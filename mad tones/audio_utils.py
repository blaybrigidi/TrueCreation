from pathlib import Path
from loguru import logger
from typing import Dict
import numpy as np
import pyaudio
from collections import deque
from hashlib import sha256
import ffmpeg
from visualize import visualizeStrongestFrequencies, visualizeSong, visualizeSpectograph
from codec import decodeAddress32Bit, decodeCouple64Bit
from audio_proc import WAVInfo, getWAVInfo, generateSpectograph, preprocess


def getAudioInfoFromBytes(data: bytes, format: str = "wav") -> WAVInfo:
    try:
        # process = (
        #     ffmpeg.input(data, format=format, ar=44100)
        #     .output("pipe:", format="wav")
        #     .overwrite_output()
        #     .run_async(pipe_stdout=True, pipe_stderr=True)
        # )
        process = (
            ffmpeg.input("pipe:0", format=format)
            .output(
                "pipe:1",
                format="wav",
                acodec="pcm_s16le",  # Explicit codec selection
                ar=44100,  # Sample rate
                ac=2,  # Number of channels
                threads="auto",  # Auto-select thread count
                **{
                    "thread_queue_size": 1024,  # Increase buffer size
                    "fflags": "+diskmasync",  # Aggressive disk I/O optimization
                    "probesize": "32",  # Minimal probe size since we know the format
                    "analyzeduration": "0",  # Skip analysis since we know the format
                },
            )
            .overwrite_output()
            .run_async(pipe_stdout=True, pipe_stdin=True, pipe_stderr=True)
        )
        # Send the input data and retrieve the output
        stdout, stderr = process.communicate(input=data)

        if process.returncode != 0:
            raise RuntimeError(f"Error converting audio: {stderr.decode('utf8')}")
    except ffmpeg.Error as e:
        logger.error("stdout:", e.stdout.decode("utf8"))
        logger.error("stderr:", e.stderr.decode("utf8"))
        raise e

    return getWAVInfo(stdout)


def getAudioInfo(filename: str) -> WAVInfo:
    try:
        if not Path(filename).exists():
            raise FileNotFoundError("File not found")
        process = (
            ffmpeg.input(filename)
            .output(
                "pipe:1",
                format="wav",
                acodec="pcm_s16le",  # Explicit codec selection
                ar=44100,  # Sample rate
                ac=2,  # Number of channels
                threads="auto",  # Auto-select thread count
                **{
                    "thread_queue_size": 1024,  # Increase buffer size
                    # "fflags": "+diskmasync",  # Aggressive disk I/O optimization
                    "probesize": "32",  # Minimal probe size since we know the format
                    "analyzeduration": "0",  # Skip analysis since we know the format
                },
            )
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True)
            # .run_async(pipe_stdout=True, pipe_stdin=True, pipe_stderr=True)
        )
    except ffmpeg.Error as e:
        logger.error("FFMPEG ERROR -> stdout: {e}", e=e.stdout.decode("utf8"))
        logger.error("FFMPEG ERROR -> stderr: {e}", e=e.stderr.decode("utf8"))
        raise e
    except FileNotFoundError as e:
        raise e

    return getWAVInfo(process[0])


def playWav(info: WAVInfo):
    logger.info("Playing audio (CTRL-C to stop)")
    sound = pyaudio.PyAudio()
    stream = sound.open(
        format=pyaudio.paInt16 if info.bitsPerSample == 16 else pyaudio.paInt8,
        channels=1 if info.mono else 2,
        rate=info.sampleFreq,
        output=True,
    )
    pointer = 0
    try:
        while True:
            if pointer >= len(info.data):
                break
            stream.write(info.data[pointer : pointer + info.bytesSec])
            pointer += info.bytesSec
    except KeyboardInterrupt:
        pass
    stream.close()


def logarithmicSplits(n_bins, n_bands):
    bin_ranges = [
        (0, 10),  # Very Low Sound Band
        (10, 20),  # Low Sound Band
        (20, 40),  # Low-Mid Sound Band
        (40, 80),  # Mid Sound Band
        (80, 160),  # Mid-High Sound Band
        (160, 511),  # High Sound Band
    ]

    bin_ranges = [(start, min(end, n_bins - 1)) for start, end in bin_ranges]

    return bin_ranges


def quantizeFreqs(freqs, resolution_hz=1):
    """
    Quantize frequencies with adaptive resolution.

    Args:
    freqs (array-like): Array of frequencies in Hz
    resolution_hz (float): Base resolution in Hz

    Returns:
    ndarray: Quantized frequencies as a NumPy array
    """
    # Ensure input is a NumPy array
    freqs = np.asarray(freqs)

    # Convert to cents (relative to 1 Hz)
    cents = 1200 * np.log2(freqs)

    # Adaptive quantization: finer for lower frequencies
    quant_factor = np.maximum(1, np.log2(freqs / 440) + 5)
    quant_cents = np.round(cents / (resolution_hz * quant_factor)) * (
        resolution_hz * quant_factor
    )

    # Convert back to Hz
    return np.power(2, quant_cents / 1200)


def extractFrequencies(Zxx, freq, coef=0.5, bands=6, verbose=False):
    binsN = len(Zxx[0])
    ranges = logarithmicSplits(binsN, bands)

    freqs = []
    for bin in Zxx.T:  # Transpose Zxx to iterate over time bins
        strongest = []
        for start, end in ranges:
            band = bin[start : end + 1]
            if len(band) > 0:
                strongestBin = np.max(band)
                strongestFreq = freq[start + np.argmax(band)]
                strongest.append((strongestFreq, strongestBin))

        avg = np.mean([strength for _, strength in strongest])
        keep = [freq for freq, strength in strongest if strength > (avg * coef)]

        # Pad with zeros if necessary
        keep = np.pad(keep, (0, bands - len(keep)), "constant")
        freqs.append(keep)
    freqs = np.array(freqs)

    if verbose:
        logger.info(f"""
        Number of bins: {binsN}
        Number of bands: {bands}
        Shape of freqs: {freqs.shape}""")

    return freqs


def generateTimeFreqOrderRelation(times, Zxx):
    pos = 0
    orderedFreqs: Dict[int, float] = {}
    i = 0
    while i < len(times):
        while i < len(times) - 2 and times[i] == times[i + 1]:
            minFreqPos = np.argmin([Zxx[i], Zxx[i + 1]])
            if minFreqPos == 0:
                orderedFreqs[pos] = Zxx[i]
                pos += 1
                orderedFreqs[pos] = Zxx[i + 1]
            else:
                orderedFreqs[pos] = Zxx[i + 1]
                pos += 1
                orderedFreqs[pos] = Zxx[i]
            pos += 1
            i += 2
        orderedFreqs[pos] = Zxx[i]
        pos += 1
        i += 1
    return orderedFreqs


TARGET_ZONE_SIZE = 5
NUM_ANCHORS = 3


def createTargetZones(orderedFreqs):
    # zones = []
    # for i in range(len(orderedFreqs) - (TARGET_ZONE_SIZE - 1)):
    #     zones.append(tuple(orderedFreqs.values())[i : i + TARGET_ZONE_SIZE])
    # return np.array(zones)

    # To generate target zones in a spectrogram, you need for each time-frequency point to create a group composed
    # of this point and the 4 points after it
    values = np.array(list(orderedFreqs.values()))
    return np.lib.stride_tricks.sliding_window_view(values, TARGET_ZONE_SIZE)


def generateAddress(zones, orderedFreqs, times, songId):
    def addressFormula(
        anchor1, anchor2, anchor3, freq, anchor1Time, anchor2Time, anchor3Time, freqTime
    ):
        return (
            int(anchor1),
            int(anchor2),
            int(anchor3),
            int(freq),
            int(
                np.abs((np.sum([anchor1Time, anchor2Time, anchor3Time]) / 3) - freqTime)
            ),
            int(np.abs(anchor1Time - freqTime)),
        )

    def mapAddressToCouple(anchorTime):
        return (int(anchorTime), int(songId))

    addressCouple = []
    freqs = np.array(list(orderedFreqs.values()))
    times = np.array(times)
    freqTimes = list(zip(freqs, times))
    freqTimesDeque = deque(freqTimes)
    freqTimes = np.array(freqTimes)

    # Find indices where each zone starts
    zoneStartIdxs = []
    currentIdx = 0
    for zone in zones:
        while currentIdx < len(freqs) and freqs[currentIdx] < zone[0]:
            currentIdx += 1
        zoneStartIdxs.append(currentIdx)

    # Process each zone
    for zoneIdx, zoneStartIdx in enumerate(zoneStartIdxs):
        # Get anchor points: three frequencies before the current zone
        anchorEndIdx = zoneStartIdx
        anchorStartIdx = max(0, anchorEndIdx - NUM_ANCHORS)

        # Extract anchor frequencies and times
        anchors = freqs[anchorStartIdx:anchorEndIdx]
        anchorTimes = times[anchorStartIdx:anchorEndIdx]

        # Pad anchors if we don't have 3 points
        if len(anchors) < NUM_ANCHORS:
            anchors = np.pad(anchors, (0, 3 - len(anchors)), "constant")
            anchorTimes = np.pad(anchorTimes, (0, 3 - len(anchorTimes)), "constant")

        # Advance deque to current zone
        while freqTimesDeque and freqTimesDeque[0][0] < zone[0]:
            freqTimesDeque.popleft()

        # Process points in the current zone
        points_processed = 0
        while points_processed < TARGET_ZONE_SIZE and freqTimesDeque:
            freq, freqTime = freqTimesDeque[0]

            # Only process if frequency is within current zone
            if freq >= zone[0] and (
                len(zones) == zoneIdx + 1 or freq < zones[zoneIdx + 1][0]
            ):
                anchor1, anchor2, anchor3 = anchors[-3:]
                anchor1Time, anchor2Time, anchor3Time = anchorTimes[-3:]

                address = addressFormula(
                    anchor1,
                    anchor2,
                    anchor3,
                    freq,
                    anchor1Time,
                    anchor2Time,
                    anchor3Time,
                    freqTime,
                )
                couple = mapAddressToCouple(anchor1Time)
                addressCouple.append((address, couple))
                points_processed += 1

            freqTimesDeque.popleft()

            # Break if we've moved past the current zone
            if len(zones) > zoneIdx + 1 and freq >= zones[zoneIdx + 1][0]:
                break

    return addressCouple


def parseAddressCouple(addressCouple):
    addressCouple = [(int(address), int(couple)) for address, couple in addressCouple]
    for address, couple in addressCouple:
        addressDecoded = decodeAddress32Bit(address)
        coupleDecoded = decodeCouple64Bit(couple)
        yield addressDecoded, coupleDecoded


def genToneId(info):
    hash = sha256(info.data).digest()
    return int.from_bytes(hash[:4], "big")


def processAudiofile(
    info: WAVInfo,
    toneId,
    visualize=False,
    verbose=False,
    targetRes=50,
    save=False,
    strongCoeff=0.5,
):
    if visualize:
        visualizeSong(info, id=toneId, save=save)

    info = preprocess(info, downmix=True, downsampleFactor=4, verbose=verbose)
    windowSize = int(info.sampleFreq / targetRes)
    windowDuration = windowSize / info.sampleFreq
    freq, times, Zxx, data, overlap = generateSpectograph(info, windowDuration)

    if visualize:
        visualizeSpectograph(
            freq,
            times,
            Zxx,
            data,
            overlap,
            windowSize,
            info.sampleFreq,
            id=toneId,
            save=save,
        )

    strongest = extractFrequencies(Zxx, freq, verbose=verbose, coef=strongCoeff)
    t = []
    for timeIdx, freqComp in enumerate(strongest):
        time = times[timeIdx]
        for freq in freqComp:
            if freq > 0:
                t.append((freq, time))

    table = np.asarray(t)
    times = table[:, 1]
    freqs = table[:, 0]

    if visualize:
        visualizeStrongestFrequencies(
            times,
            freqs,
            id=toneId,
            save=save,
        )

    orderedFreqs = generateTimeFreqOrderRelation(times, freqs)
    targetZones = createTargetZones(orderedFreqs)
    addressCouple = generateAddress(targetZones, orderedFreqs, times, toneId)

    if verbose:
        logger.info(f"Number of target zones: {len(targetZones)}")

    return addressCouple
