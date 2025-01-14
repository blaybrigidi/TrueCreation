from collections import defaultdict
from concurrent.futures.process import ProcessPoolExecutor
from pathlib import Path
from typing import Any, Counter, Dict, NamedTuple, Optional, Tuple

from numpy._typing import NDArray
import psycopg as sql
import psycopg_pool
import traceback
import numpy as np

from db_utils import (
    doesToneExist,
    readAddressCoupleFromAddressBatch,
    storeAddressCoupleChunks,
    storeTone,
    storeAddressCouple,
    readTone,
    storeToneChunks,
)
from audio_utils import genToneId, getAudioInfo, getAudioInfoFromBytes, processAudiofile
from audio_proc import printInfo
from codec import (
    decodeAddress64Bit,
    decodeCouple64Bit,
    encodeAddress64Bit,
)
from multiprocessing import Queue

from __init__ import TARGET_RES, logger

# from concurrent.futures import ThreadPoolExecutor, as_completed
from concurrent.futures import as_completed

# TARGET_RES = 200
# TARGET_RES = 10.7


def loadFileCommon(db, filename, info, verbose=False):
    # Generate max 32bit integer for toneId using the first 32 bits of the hash of the audio data
    toneId = genToneId(info)
    with sql.connect(db) as conn:
        if doesToneExist(conn, toneId):
            return f"Tone {toneId} already exists in database"

        addressCouple = processAudiofile(
            info, db, toneId, verbose=verbose, targetRes=TARGET_RES
        )
        toneName = Path(filename).stem
        storeAddressCouple(conn, addressCouple)
        try:
            storeTone(conn, toneId, toneName)
        except Exception as e:
            return f"Load File Error: {e}"
        return f"Stored address-couple pairs in database for tone_id: {toneId}"


def loadFileBytes(db, filename, bytes, format: str = "wav", verbose=False):
    info = getAudioInfoFromBytes(bytes, format=format)
    if verbose:
        printInfo(info)

    return loadFileCommon(db, filename, info, verbose)


def loadFile(db, filename, verbose=False):
    logger.info(f"Loading file: {filename}")
    info = getAudioInfo(filename)
    if verbose:
        printInfo(info)
    path: Path = Path(filename).resolve()

    return loadFileCommon(db, path, info, verbose)


def loadFileChunks(db, chunk, verbose=False) -> None:
    addressCouples = []
    tones = []
    with psycopg_pool.ConnectionPool(db, min_size=1, max_size=3) as pool:
        with pool.connection() as conn:
            for filename in chunk:
                logger.info(f"Loading file: {filename}")
                info = getAudioInfo(filename)
                if verbose:
                    printInfo(info)
                filename = Path(filename).resolve()
                toneId = genToneId(info)
                if doesToneExist(conn, toneId):
                    logger.info(f"Tone {toneId} already exists in database")
                else:
                    try:
                        addressCouple = processAudiofile(
                            info, toneId, verbose=verbose, targetRes=TARGET_RES
                        )
                        toneName = Path(filename).stem
                        addressCouples += [addressCouple]
                        tones += [(toneId, toneName)]
                    except Exception as e:
                        logger.error(f"Load File Error: {e}")

        chunkSize = 128
        addressCouplesTuple = tuple(
            addressCouples[x : x + chunkSize]
            for x in range(0, len(addressCouples), chunkSize)
        )
        tonesTuple = tuple(
            tones[x : x + chunkSize] for x in range(0, len(tones), chunkSize)
        )
        try:
            logger.info(
                "Storing {chunks} chunks of tones each of max size {maxSize} in db",
                chunks=len(tonesTuple),
                maxSize=chunkSize,
            )
            storeToneChunks(conn, tonesTuple, verbose=verbose)
        except Exception as e:
            logger.error(f"Store tones error: {e}")
        try:
            logger.info(
                "Storing {chunks} chunks of tones each of max size {maxSize} in db",
                chunks=len(addressCouplesTuple),
                maxSize=chunkSize,
            )
            storeAddressCoupleChunks(conn, addressCouplesTuple)
        except Exception as e:
            logger.error(f"Store couples error: {e}")


def findFileBatches(foldername: Path, fileQueue: Queue, batchSize=16):
    temp = []
    for file in foldername.rglob("*"):
        if file.is_file() and file.suffix in [".wav", ".mp3", ".flac"]:
            logger.info(f"Found: {file}")
            temp.append(file)

            if len(temp) >= batchSize:
                fileQueue.put(tuple(temp))
                temp = []

    # Handle any remaining files in the last incomplete batch
    if temp:
        fileQueue.put(tuple(temp))


def loadFoldersChunks(db, foldername, maxWorkers=6, verbose=False):
    fileQueue = Queue()
    findFileBatches(foldername, fileQueue)
    failed = 0
    succeeded = 0

    try:
        with ProcessPoolExecutor(max_workers=maxWorkers) as exec:
            # with ThreadPoolExecutor(max_workers=maxWorkers) as exec:
            todo = {}
            qsize = fileQueue.qsize()  # Get total number of batches

            # Submit all batches to executor
            for _ in range(qsize):
                try:
                    fileChunk = fileQueue.get(block=True, timeout=1)
                    future = exec.submit(loadFileChunks, db, fileChunk, verbose)
                    todo[future] = fileChunk
                except fileQueue.Empty:
                    break

            for job in as_completed(todo):
                try:
                    job.result()
                    succeeded += 1
                except Exception as e:
                    failed += 1
                    tb = traceback.format_exc()
                    logger.error("Chunk Error:\n{error}", error=e)
                    logger.error("Chunk Error Trace: \n{tb}", tb=tb)
    except KeyboardInterrupt:
        logger.info("Terminating all processes...")
        exec.shutdown(wait=False)
    finally:
        logger.info(f"Failed: {failed}")
        logger.info(f"Succeeded: {succeeded}")

    if not fileQueue.empty():
        logger.info(f"{fileQueue.qsize()} chunks are left in queue, clearing...")
        while not fileQueue.empty():
            fileQueue.get(block=False)
        fileQueue.close()


def vectorizedIsMatchingZone(
    targetCouples: np.ndarray,
    dbCouples: np.ndarray,
    targetAddresses: np.ndarray,
    dbAddresses: np.ndarray,
    timeFreqTol: Tuple[float, float],
) -> np.ndarray:
    """Vectorized version of IsMatchingZone"""
    timeTol, freqTol = timeFreqTol

    # Broadcast to compare all combinations
    timeDiff = np.abs(targetCouples[:, None, 0] - dbCouples[None, :, 0])
    freqDiff = np.abs(targetAddresses[:, None, 3] - dbAddresses[None, :, 3])

    # Return boolean mask of matches
    return (timeDiff <= timeTol) & (freqDiff <= freqTol)


def isMatchingZone(
    couple, decoededCouple, address, decodedAddress, timeFreqTol=(0.1, 0.1)
):
    toneTime, _ = couple
    dbTime, _ = decoededCouple
    # _, toneFreq, _ = address
    # _, dbFreq, _ = decodedAddress
    _, _, _, toneFreq, _, _ = address
    _, _, _, dbFreq, _, _ = decodedAddress

    if (
        abs(toneTime - dbTime) <= timeFreqTol[0]
        and abs(toneFreq - dbFreq) <= timeFreqTol[1]
    ):
        return True

    return False


def maxTimeCoherentNotes(
    addressCouple, dbAddressCouple, tolerance=0.1, verbose=False
) -> Optional[tuple[int, int]]:
    if not addressCouple or not dbAddressCouple:
        return None

    # Extract timestamps using numpy for vectorized operations
    anchorTimes: NDArray[np.int64] = np.array(
        [couple[0] for _, couple in addressCouple]
    )
    dbAnchorTimes: NDArray[np.int64] = np.array([c[0] for _, c in dbAddressCouple])

    # Calculate all pairwise time differences using broadcasting
    deltas = np.abs(anchorTimes[:, np.newaxis] - dbAnchorTimes)

    # Convert to 1D array and filter within tolerance
    flatDeltas = deltas.flatten()
    validDeltas = flatDeltas[flatDeltas <= tolerance]

    if len(validDeltas) == 0:
        return None

    # Count occurrences and find most common delta
    deltaCount = Counter(np.round(validDeltas, decimals=6))

    # if verbose:
    #     logger.log("SEARCH", f"Delta count: {deltaCount}")

    if not deltaCount:
        return None

    return deltaCount.most_common(1)[0]


class CoherencyResult(NamedTuple):
    SongId: str
    SongName: str
    CoherencyScore: float
    TimeDelta: float


def tryCoherency(
    addressCouple: list,
    foundDB: Dict[str, list],
    foundTones: Dict[str, Dict[str, Any]],
    numTargetZones: int,
    coeff: float = 0.5,
    verbose: bool = False,
    tol: float = 0.1,
) -> Optional[str]:
    if not foundDB or not foundTones:
        if verbose:
            logger.log("SEARCH", "No database entries or tones to analyze")
        return None

    bestMatch = None
    maxCoherency = 0
    coherencyThreshold = numTargetZones * coeff
    logger.info(f"Coherency Threshold: {coherencyThreshold}")

    for songId, songData in foundDB.items():
        # Get time coherency for current song
        maxTime = maxTimeCoherentNotes(
            addressCouple, songData, tolerance=tol, verbose=verbose
        )

        if not maxTime:
            logger.log("SEARCH", f"No notes coherent for song {songId}")
            continue
        logger.log("SEARCH", f"Max Time Coherent Notes for song {songId}: {maxTime}")

        timeDelta, coherencyScore = maxTime

        if verbose and coherencyScore > coherencyThreshold:
            try:
                songName = foundTones[songId]["tone"][1]
                logger.log(
                    "SEARCH",
                    f"Match found - {songName}: "
                    f"(delta={timeDelta:.3f}, score={coherencyScore})",
                )
            except (KeyError, IndexError):
                logger.log("SEARCH", f"Invalid tone data for song {songId}")

        # Update best match if this song has higher coherency
        if coherencyScore > maxCoherency:
            maxCoherency = coherencyScore
            try:
                songName = foundTones[songId]["tone"][1]
                bestMatch = CoherencyResult(
                    SongId=songId,
                    SongName=songName,
                    CoherencyScore=coherencyScore,
                    TimeDelta=timeDelta,
                )
            except (KeyError, IndexError):
                logger.log(
                    "SEARCH",
                    f"Cannot create result for song {songId}: "
                    "missing or invalid tone data",
                )

    # Check if best match meets threshold
    if bestMatch and bestMatch.CoherencyScore >= coherencyThreshold:
        if verbose:
            logger.log(
                "SEARCH",
                f"Best match: {bestMatch.SongName} "
                f"(score={bestMatch.CoherencyScore})",
            )
        return bestMatch.SongName
    else:
        if verbose:
            logger.log("SEARCH", "No tone met coherency threshold")
        return None


def tryMatchRatios(
    foundTones, numTargetZones, cutoff, verbose=False
) -> Tuple[Tuple[str, float],]:
    filtered: list[tuple[str, float]] = []
    tonesWithMatchRatios: Dict[int, Tuple[str, float]] = {}
    for id, data in foundTones.items():
        matchRatio = data["common"] / numTargetZones
        tonesWithMatchRatios[id] = (data["tone"][1], matchRatio)
        if matchRatio >= cutoff:
            filtered.append((data["tone"][1], matchRatio))

    if not filtered:
        if verbose:
            logger.log(
                "SEARCH", "Tone not found with the given cutoff ouputting top 5 matches"
            )
        top5 = sorted(tonesWithMatchRatios.values(), key=lambda x: x[1], reverse=True)[
            :5
        ]

        if verbose:
            logger.log("SEARCH", "Top 5 matches:")
            for tone, matchRatio in top5:
                logger.log("SEARCH", f"{tone}: {matchRatio:.5%}")
        return tuple(top5)

    if verbose:
        for tone, matchRatio in filtered:
            logger.log("SEARCH", f"{tone}: {matchRatio:.2%}")

    return tuple(filtered)


def searchCommon(
    db: str,
    filename: str,
    info: dict,
    cutoff: float = 0.70,
    verbose: bool = False,
    coherencyTol: float = 0.1,
    coeff: float = 0.5,
    timeFreqTol: Tuple[float, float] = (0.1, 0.1),
    strongCoeff=0.5,
    visualize=False,
    save=False,
) -> Optional[Dict]:
    # process audio file and get initial data
    toneId = genToneId(info)
    addressCouple = processAudiofile(
        info,
        toneId=toneId,
        visualize=visualize,
        save=save,
        strongCoeff=strongCoeff,
        targetRes=TARGET_RES,
    )
    numTargetZones = len(addressCouple)

    if verbose:
        logger.log("SEARCH", f"Number of target zones: {numTargetZones}")

    if numTargetZones == 0:
        return None

    # convert addresses to 64-bit format
    addresses = np.array([encodeAddress64Bit(addr) for addr, _ in addressCouple])
    addrs = np.array([addr for addr, _ in addressCouple])
    couples = np.array([couple for _, couple in addressCouple])

    # batch read all addresses at once
    dbMatches = readAddressCoupleFromAddressBatch(db, addresses.tolist())
    if not dbMatches:
        logger.log("SEARCH", "No matches found in database")
        logger.debug(f"Addresses:\n{addresses}")
        return None

    # convert database results to numpy arrays
    dbAddresses = np.array([decodeAddress64Bit(addr) for addr, _ in dbMatches])
    dbCouples = np.array([decodeCouple64Bit(couple) for _, couple in dbMatches])

    # group matches by tone iD
    toneMatches = defaultdict(list)
    for i, (_, couple) in enumerate(dbMatches):
        toneId = decodeCouple64Bit(couple)[1]
        toneMatches[toneId].append(i)

    # process each tone's matches vectorized
    foundTones = {}
    foundDb = {}

    for toneId, matchIndices in toneMatches.items():
        tone = readTone(db, toneId)
        if not tone:
            continue

        # get relevant matches for this tone
        toneDbAddresses = dbAddresses[matchIndices]
        toneDbCouples = dbCouples[matchIndices]

        # vectorized matching
        matches = vectorizedIsMatchingZone(
            couples,  # exclude address column
            toneDbCouples,
            addrs,  # address column
            toneDbAddresses,
            timeFreqTol,
        )

        matchCount = np.sum(matches)
        if matchCount > 0:
            foundTones[toneId] = {"tone": tone, "common": matchCount}
            foundDb[toneId] = [
                (toneDbAddresses[j], toneDbCouples[j])
                for j in range(len(toneDbCouples))
                if matches[:, j].any()
            ]

    # try coherency and match ratios
    coherencyRes = tryCoherency(
        addressCouple,
        foundDb,
        foundTones,
        numTargetZones,
        verbose=verbose,
        coeff=coeff,
        tol=coherencyTol,
    )

    if coherencyRes:
        return coherencyRes

    matchRatioRes = tryMatchRatios(foundTones, numTargetZones, cutoff, verbose=verbose)
    return matchRatioRes if matchRatioRes else None


# def searchCommon(
#     db,
#     filename,
#     info,
#     cutoff=0.70,
#     verbose=False,
#     coherencyTol=0.1,
#     coeff=0.5,
#     timeFreqTol=(0.1, 0.1),
# ):
#     addressCouple = processAudiofile(info, db, toneId=0, targetRes=TARGET_RES)
#     numTargetZones = len(addressCouple)
#
#     if verbose:
#         logger.log("SEARCH", f"Number of target zones: {numTargetZones}")
#
#     foundTones = {}
#     foundDB = {}
#
#     # Find the matching couples in the database for all fingerprints
#     for address, couple in addressCouple:
#         address = encodeAddress64Bit(address)
#         read = readAddressCoupleFromAddress(db, address)
#         if not read:
#             continue
#         address = decodeAddress64Bit(address)
#
#         for a, c in read:
#             c = decodeCouple64Bit(c)
#             a = decodeAddress64Bit(a)
#             id = c[1]
#             tone = readTone(db, id)
#             if not tone:
#                 continue
#
#             if id not in foundTones:
#                 foundTones[id] = {"tone": tone, "common": 0}
#                 foundDB[id] = []
#
#             if isMatchingZone(couple, c, address, a, timeFreqTol=timeFreqTol):
#                 foundTones[id]["common"] += 1
#                 foundDB[id].append((a, c))
#
#     coherencyRes = tryCoherency(
#         addressCouple,
#         foundDB,
#         foundTones,
#         numTargetZones,
#         verbose=verbose,
#         coeff=coeff,
#         tol=coherencyTol,
#     )
#     if coherencyRes:
#         return coherencyRes
#
#     matchRatioRes = tryMatchRatios(foundTones, numTargetZones, cutoff, verbose=verbose)
#     if matchRatioRes:
#         return matchRatioRes
#
#     return None


def searchBytes(
    db,
    data,
    filename,
    format="wav",
    cutoff=0.50,
    verbose=False,
    coherencyTol=0.1,
    coeff=0.5,
    timeFreqTol=(0.1, 0.1),
):
    info = getAudioInfoFromBytes(data, format=format)

    if verbose:
        printInfo(info)

    return searchCommon(
        db,
        filename,
        info,
        cutoff=cutoff,
        verbose=verbose,
        coherencyTol=coherencyTol,
        coeff=coeff,
        timeFreqTol=timeFreqTol,
    )


def searchFile(
    db,
    filename,
    cutoff=0.50,
    verbose=False,
    coherencyTol=0.1,
    coeff=0.5,
    timeFreqTol=(0.1, 0.1),
    visualize=False,
    save=False,
    strongCoeff=0.5,
):
    info = getAudioInfo(filename)

    if verbose:
        printInfo(info)

    return searchCommon(
        db,
        filename,
        info,
        cutoff=cutoff,
        verbose=verbose,
        coherencyTol=coherencyTol,
        coeff=coeff,
        timeFreqTol=timeFreqTol,
        visualize=visualize,
        save=save,
        strongCoeff=strongCoeff,
    )


def searchFileN(db, filename, cutoff=0.50, n=3):
    results = []
    for i in range(n):
        results += [searchFile(db, filename, cutoff)]

    logger.info("Results:")
    for i, res in enumerate(results):
        logger.info(f"Run {i+1}")
        for tone, matchRatio in res:
            logger.info(f"{tone}: {matchRatio:.2%}")
