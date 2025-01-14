from fastapi import FastAPI, status, UploadFile, Form, File
from typing import Annotated

# from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from search_load import loadFileBytes, searchBytes
import uvicorn
from os import environ
from __init__ import serverLogger, DB

MODE = environ.get("MODE", "dev")

# origins = ["http://localhost:8000", "http://127.0.0.1:53400", "http://127.0.0.1:8080"]
origins = ["*"]

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB = "dbname=tones user=mads"
# DB = "dbname=songs user=mads"


@app.get("/health")
def health(status_code=status.HTTP_200_OK):
    return {"data": "Up"}


@app.post("/upload")
async def uploadFile(
    file: Annotated[UploadFile, File()], filename: Annotated[str, Form()]
):
    try:
        serverLogger.info(file.filename)
        ext = filename.split(".")[1]
        tone = await file.read()
        res = loadFileBytes(DB, filename, tone, format=ext, verbose=True)
        serverLogger.info(res)
    except Exception as e:
        serverLogger.error(e)
        raise e
        return {"err": str(e)}
    else:
        return {"data": res}


@app.post("/search")
async def searchUploadFile(
    file: Annotated[UploadFile, File()], filename: Annotated[str, Form()]
):
    try:
        serverLogger.info(filename)
        ext = filename.split(".")[1]
        tone = await file.read()
        res = searchBytes(
            DB,
            data=tone,
            filename=filename,
            format=ext,
            verbose=True,
            coeff=10,
            timeFreqTol=(0.5, 0.5),
            coherencyTol=2.5,
        )
        serverLogger.info(res)
    except Exception as e:
        serverLogger.error(e)
        raise e
        return {"err": str(e)}
    else:
        return {"data": res}


if __name__ == "__main__":
    host = "127.0.0.1" if MODE == "dev" else "0.0.0.0"
    port = environ.get("PORT", 8000)
    uvicorn.run("server:app", host=host, port=8000, reload=True)
