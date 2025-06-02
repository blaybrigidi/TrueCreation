# Backend Integration Instructions for Tones Audio Processing

## Overview

The React Native frontend has been updated to connect to the Python tones backend for Shazam-like audio recognition functionality. The frontend expects specific API endpoints and response formats from the tones backend.

## Current Setup

### Frontend Changes Made

1. **API Configuration**: Updated `utils/api.ts` to point to `http://127.0.0.1:8000` for audio processing
2. **Response Handling**: Frontend now expects specific response formats from the tones backend
3. **Error Handling**: Improved error handling for audio processing failures
4. **UI Updates**: Analysis screen shows match confidence, song IDs, and time deltas

### Required Backend Implementation

## 1. Database Setup

The tones backend requires a PostgreSQL database. You need to:

```bash
# Install PostgreSQL if not already installed
brew install postgresql

# Start PostgreSQL service
brew services start postgresql

# Create database and user (adjust as needed)
createdb tones
createuser mads
```

Update the database connection string in `tones/tones/src/__init__.py`:

```python
DB = "dbname=tones user=mads"  # Adjust as needed
```

## 2. Server Startup

To run the tones backend:

```bash
cd tones/tones
source ../venv/bin/activate
cd src
python server.py
```

The server should start on `http://127.0.0.1:8000`

## 3. API Endpoints Required

### Health Check

- **Endpoint**: `GET /health`
- **Response**: `{"data": "Up"}`
- **Status**: ✅ Already implemented

### Upload Audio for Database Storage

- **Endpoint**: `POST /upload`
- **Purpose**: Store audio fingerprints in database for future matching
- **Request**:
  - `file`: Audio file (multipart/form-data)
  - `filename`: Original filename
- **Expected Response**:

```json
{
  "data": "Stored address-couple pairs in database for tone_id: 12345",
  "toneId": 12345
}
```

- **Error Response**: `{"err": "Error message"}`

### Search Audio

- **Endpoint**: `POST /search`
- **Purpose**: Find matching songs in database using audio fingerprinting
- **Request**:
  - `file`: Audio file to search (multipart/form-data)
  - `filename`: Original filename
- **Expected Response** (one of these formats):

```json
{
  "data": [
    {
      "SongId": "song123",
      "SongName": "Song Title",
      "CoherencyScore": 0.85,
      "TimeDelta": 1.23
    },
    {
      "SongId": "song456",
      "SongName": "Another Song",
      "CoherencyScore": 0.72,
      "TimeDelta": 0.45
    }
  ]
}
```

OR for array format:

```json
{
  "data": [
    ["song123", "Song Title", 0.85, 1.23],
    ["song456", "Another Song", 0.72, 0.45]
  ]
}
```

- **Error Response**: `{"err": "Error message"}`

## 4. Implementation Steps

### Step 1: Fix Database Connection

1. Ensure PostgreSQL is running
2. Create the required database and user
3. Test database connectivity in the tones backend

### Step 2: Initialize Database Schema

The tones backend should automatically create required tables. If not, check:

- `tones/tones/src/db_utils.py` for database schema
- Run any migration scripts if available

### Step 3: Test Audio Processing Pipeline

1. Test the `/upload` endpoint with a sample audio file
2. Verify audio fingerprints are stored in database
3. Test the `/search` endpoint with the same audio file
4. Verify it returns the uploaded song as a match

### Step 4: Populate Database

To have songs to match against:

1. Use the bulk upload functionality in `search_load.py`
2. Upload sample audio files to build the fingerprint database
3. Test search functionality with various audio samples

## 5. Audio Processing Pipeline

The tones backend implements:

1. **Audio Preprocessing**: Convert audio to standard format using FFmpeg
2. **Feature Extraction**: Generate audio fingerprints using FFT
3. **Database Storage**: Store fingerprints as address-couple pairs
4. **Matching Algorithm**: Compare incoming audio against stored fingerprints
5. **Coherency Analysis**: Rank matches by coherency score

## 6. Configuration Options

Key parameters in the tones backend:

- `TARGET_RES`: Resolution for audio fingerprinting (currently 200)
- `timeFreqTol`: Time/frequency tolerance for matching (default: 0.5, 0.5)
- `coherencyTol`: Coherency tolerance (default: 2.5)
- `coeff`: Coefficient for matching algorithm (default: 10)

## 7. Testing the Integration

### Test Upload

```bash
curl -X POST "http://127.0.0.1:8000/upload" \
  -F "file=@sample.wav" \
  -F "filename=sample.wav"
```

### Test Search

```bash
curl -X POST "http://127.0.0.1:8000/search" \
  -F "file=@sample.wav" \
  -F "filename=sample.wav"
```

## 8. Frontend Expectations

The React Native app expects:

1. Server running on `127.0.0.1:8000`
2. CORS enabled for all origins
3. Proper error responses with `{"err": "message"}` format
4. Search results with match confidence scores
5. Reasonable response times (< 10 seconds for search)

## 9. Troubleshooting

### Common Issues:

1. **ModuleNotFoundError**: Ensure virtual environment is activated
2. **Database Connection**: Check PostgreSQL is running and credentials are correct
3. **FFmpeg Errors**: Ensure FFmpeg is installed and audio files are valid
4. **Port Conflicts**: Ensure port 8000 is available

### Debug Mode:

Set environment variable: `MODE=dev` for detailed logging

## 10. Next Steps After Implementation

1. Test with the React Native app
2. Upload sample songs to build the database
3. Fine-tune matching parameters for better accuracy
4. Consider implementing caching for faster responses
5. Add authentication if needed
6. Optimize for production deployment

## Contact

If you need clarification on any of these requirements or run into issues, refer to the tones backend documentation or the original server.py implementation for reference.
