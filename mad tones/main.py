from pathlib import Path
import traceback
import signal
import traceback
from typing import Iterable
from argparse import ArgumentParser
from db_utils import createDatabase
from search_load import loadFoldersChunks, searchFile, loadFile
from __init__ import MAX_CONC, logger, DB
from cProfile import Profile
from pstats import SortKey, Stats
import sys


if __name__ == "__main__":
    if sys.version_info >= (3, 13):
        logger.info(f"GIL enabled: {sys._is_gil_enabled()}")

    parser = ArgumentParser(
        prog="tones", description="CLI for tone adding and searching"
    )

    parser.add_argument(
        "--mode",
        metavar="mode",
        required=True,
        type=str,
        help="Mode of operation: load, load_folder, search",
    )

    parser.add_argument(
        "--filename",
        metavar="filename",
        required=True,
        type=str,
        help="Filename or foldername to load or search",
    )

    parser.add_argument(
        "--visualize",
        default=False,
        action="store_true",
        help="Visualize frequency data",
    )

    parser.add_argument(
        "--profile",
        default=False,
        action="store_true",
        help="Profile the script",
    )

    parser.add_argument(
        "--overwrite",
        default=False,
        action="store_true",
        help="Overwrite existing db",
    )

    parser.add_argument(
        "--save",
        default=False,
        action="store_true",
        help="Save generated visualizations",
    )

    def handleInt(sig, frame):
        logger.info("Exiting...")
        raise KeyboardInterrupt

    signal.signal(signal.SIGINT, handleInt)

    args = parser.parse_args()
    mode = args.mode
    filename = args.filename
    v = True
    vis = args.visualize
    save = args.save
    if not vis:
        save = False
    prof = args.profile
    overwrite = args.overwrite
    # logger.info("Test")

    # db = "dbname=tones user=mads"
    # db = "dbname=songs user=mads"

    res = None

    try:
        with Profile() as profile:
            try:
                match mode:
                    case "load":
                        loadFile(DB, filename, verbose=v)
                    case "load_folder":
                        if overwrite:
                            logger.info("Overwriting database")
                            # runningDir = Path.cwd()
                            # createDatabase(DB, runningDir / "./src/db/schema.sql")
                            createDatabase(DB, "./src/db/schema.sql")
                        # loadFolders(db, Path(filename), verbose=v, maxWorkers=5)
                        loadFoldersChunks(
                            DB, Path(filename), verbose=v, maxWorkers=MAX_CONC
                        )
                    case "search":
                        res = searchFile(
                            DB,
                            filename,
                            verbose=v,
                            strongCoeff=0.5,
                            coeff=1,
                            timeFreqTol=(1, 1),
                            coherencyTol=2.5,
                            visualize=vis,
                            save=save,
                        )
                    case _:
                        logger.info("Invalid mode")
                        exit(1)
            except Exception as e:
                logger.info(f"Script Error: {e}")
                tb = traceback.format_exc()
                logger.info(f"Script Trace: {tb}")

            if res is not None:
                if isinstance(res, Iterable) and not isinstance(res, str):
                    logger.info("Found tones:")
                    for item in res:
                        logger.info(item)
                else:
                    logger.info(f"Tone: {res}")

        if prof:
            (
                Stats(profile)  #
                .strip_dirs()
                .sort_stats(SortKey.CALLS)
                .dump_stats("profile.stats")
            )
    except KeyboardInterrupt:
        logger.info("Exiting...")
