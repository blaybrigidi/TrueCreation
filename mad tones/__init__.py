import logging
from loguru import logger
import sys
from os import environ
from threading import Event

serverLogger = logging.getLogger("uvicorn.error")
logFmt = "{time:YYYY-MM-DD HH:mm:ss.SSS} {level} {message}"
logger.add(
    sys.stderr,
    format=logFmt,
    filter="tones",
    level="DEBUG",
    colorize=True,
    backtrace=True,
    diagnose=True,
)
logger.level("SEARCH", no=38, color="<green>")
try:
    MODE = environ["MODE"]
except KeyError:
    MODE = "dev"

logLocation = "./logs/"
logger.info(f"Running mode: {MODE}")
if MODE == "no-log":
    logger.remove()

if MODE == "prod":
    logger.add(f"{logLocation}/tones.log", rotation="00:00", compression="zip")
    logger.add(
        f"{logLocation}/error.log",
        filter=lambda r: r["level"].name == "ERROR",
        mode="w",
    )
    logger.add(
        f"{logLocation}/info.log", filter=lambda r: r["level"].name == "INFO", mode="w"
    )
    logger.add(
        f"{logLocation}/debug.log",
        filter=lambda r: r["level"].name == "DEBUG",
        mode="w",
    )
    logger.add(
        f"{logLocation}/search.log",
        filter=lambda r: r["level"].name == "SEARCH",
        mode="w",
    )

MAX_CONC = 6
# Tones
DB = "dbname=tones user=mads"
TARGET_RES = 200

# Songs
# DB = "dbname=songs user=mads"
# TARGET_RES = 10.7
