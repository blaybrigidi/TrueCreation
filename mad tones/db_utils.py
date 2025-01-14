# import sqlite3 as sql
from concurrent.futures import as_completed
from concurrent.futures.process import ProcessPoolExecutor
from typing import List, Tuple

import psycopg as sql
from codec import encodeAddress64Bit, encodeCouple64Bit
from __init__ import MAX_CONC, logger
import traceback

TIMEOUT = 50


def createDatabase(db, schema):
    with sql.connect(db) as conn:
        print(f"Connected to {db} info: {conn}")
        with open(schema) as f:
            schema = f.readlines()

        cursor = conn.cursor()
        for line in schema:
            cursor.execute(line)
        conn.commit()


def storeTone(conn, toneId, toneName, verbose=True):
    print(f"Storing tone {toneId} with name {toneName}")
    with conn.cursor() as cursor:
        try:
            cursor.execute(
                "INSERT INTO tone (toneId, name) VALUES (%s, %s)",
                (toneId, toneName),
            )
        # except sql.IntegrityError:
        #     print("Duplicate tone")
        except Exception as e:
            print(f"Storing tones error: {e}")
            # return

    conn.commit()


def storeToneChunks(conn, chunks, verbose=True):
    with conn.cursor() as cursor:
        for chunk in chunks:
            try:
                cursor.executemany(
                    "INSERT INTO tone (toneId, name) VALUES (%s, %s)",
                    chunk,
                )
                logger.info(f"Processed chunk of {len(chunk)} tones")
            except Exception as e:
                logger.error(f"Storing chunks error: {e}")
            conn.commit()
    conn.commit()


# def storeTone(db, toneId, toneName, verbose=True):
#     with sql.connect(db) as conn:
#         print(f"Storing tone {toneId} with name {toneName}")
#         with conn.cursor() as cursor:
#             try:
#                 cursor.execute(
#                     "INSERT INTO tone (toneId, name) VALUES (%s, %s)",
#                     (toneId, toneName),
#                 )
#             # except sql.IntegrityError:
#             #     print("Duplicate tone")
#             except Exception as e:
#                 raise e
#                 # return
#
#         conn.commit()


def storeAddressCouple(conn, addressCouple):
    with conn.cursor() as cursor:
        for address, couple in addressCouple:
            try:
                cursor.execute(
                    "INSERT INTO address_couple (address, couple) VALUES (%s, %s)",
                    (encodeAddress64Bit(address), encodeCouple64Bit(couple)),
                )
            except sql.errors.UniqueViolation:
                continue

        conn.commit()


def storeAddressCoupleChunks(conn, chunks):
    with conn.cursor() as cursor:
        for chunk in chunks:
            # Flatten the chunk structure and encode values
            enc = [
                (encodeAddress64Bit(address), encodeCouple64Bit(couple))
                for addressCouple in chunk
                for address, couple in addressCouple
            ]

            if not enc:
                continue

            # Use ON CONFLICT DO NOTHING for handling unique violations in bulk
            try:
                cursor.executemany(
                    """
                    INSERT INTO address_couple (address, couple) 
                    VALUES (%s, %s) 
                    ON CONFLICT DO NOTHING
                    """,
                    enc,
                )
                logger.info(f"Processed chunk of {len(enc)} address couples")
                conn.commit()
            except Exception as e:
                logger.error(f"Error storing address couple chunk: {e}")

        # Single commit after all chunks are processed
        conn.commit()


# def storeAddressCouple(db, addressCouple):
#     with sql.connect(db) as conn:
#         with conn.cursor() as cursor:
#             for address, couple in addressCouple:
#                 try:
#                     cursor.execute(
#                         "INSERT INTO address_couple (address, couple) VALUES (%s, %s)",
#                         (encodeAddress32Bit(address), encodeCouple64Bit(couple)),
#                     )
#
#                 except sql.errors.UniqueViolation:
#                     continue
#
#             conn.commit()


def doesToneExist(conn, toneId):
    with conn.cursor() as cursor:
        cursor.execute("SELECT * FROM tone WHERE toneId = %s", [toneId])
        return cursor.fetchone() is not None


# def doesToneExist(db, toneId):
#     with sql.connect(db) as conn:
#         with conn.cursor() as cursor:
#             cursor.execute("SELECT * FROM tone WHERE toneId = %s", [toneId])
#             return cursor.fetchone() is not None


def readAllAddressCouple(db):
    with sql.connect(db) as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM address_couple")
            return cursor.fetchall()


def readOneAddressCoupleBatch(db: str, batch: List[int]) -> List[Tuple]:
    """Read a single batch of addresses using its own connection"""
    with sql.connect(db) as conn:
        with conn.cursor() as cursor:
            placeholders = ",".join(["%s"] * len(batch))
            query = f"SELECT address, couple FROM address_couple WHERE address IN ({placeholders})"
            cursor.execute(query, batch)
            return cursor.fetchall()


def readAddressCoupleFromAddressBatch(
    db: str, addresses: List[int], batch_size: int = 1000, max_workers: int = MAX_CONC
) -> List[Tuple]:
    """Batch read addresses from database concurrently"""
    results: List[Tuple] = []

    # Split addresses into batches
    batches = [
        addresses[i : i + batch_size] for i in range(0, len(addresses), batch_size)
    ]

    # Process batches concurrently
    with ProcessPoolExecutor(max_workers=MAX_CONC) as executor:
        # Submit all batch jobs
        todo = {
            executor.submit(readOneAddressCoupleBatch, db, batch): batch
            for batch in batches
        }

        # Process results as they complete
        for future in as_completed(todo):
            batch = todo[future]
            try:
                batch_results = future.result()
                results.extend(batch_results)
            except Exception as e:
                tb = traceback.format_exc()
                logger.error(f"Failed to process batch {batch[:5]}...: {e}")
                logger.error(tb)
                continue

    return results


def readAddressCoupleFromAddress(db, address):
    with sql.connect(db) as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM address_couple WHERE address = %s", [address])
            return cursor.fetchall()


def readTone(db, toneId):
    with sql.connect(db) as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM tone WHERE toneId = %s", [toneId])
            return cursor.fetchone()


def readTones(db):
    with sql.connect(db) as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM tone")
            return cursor.fetchall()
