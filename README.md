# Live Streaming Application

## Overview

This is a live streaming application that allows users to view a live stream from an RTSP URL. Users can control the playback of the stream, adjust the volume, and overlay custom elements such as logos and text. The application features a backend built with Flask and a frontend built with React.

## Features

- View live streams using HLS (HTTP Live Streaming).
- Basic controls for playback (play, pause, volume).
- Add custom overlays (logos, text) with CRUD API support for managing overlay settings.
- Responsive design for different devices.

## Tech Stack

- **Frontend:** React, HLS.js, HTML, CSS
- **Backend:** Flask, Python
- **Database:** MongoDB (for storing overlay settings)

## Installation

### Prerequisites

Make sure you have the following installed:

- Python 3.x
- Node.js and npm
- MongoDB (for database)

### Backend Setup

1. Clone the repository:

   ```bash
   git clone <your-repository-url>
   cd backend
   pip install -r requirements.txt
   python app.py


2. Frontend Setup:
    
    Navigate to the frontend directory:

    Install the required Node.js packages:

    npm install
    npm run dev

# API Endpoints

## 1. Start Livestream

- **Endpoint:** `/start-stream`
- **Method:** `GET`
- **Description:** Initiates the FFmpeg process to convert an RTSP stream into HLS format. This will create an HLS playlist (`output.m3u8`) and segment files in the specified output directory.

- **Response:**
  - **Success (200):**
    ```json
    {
      "message": "Livestream started"
    }
    ```
  - **Error (500):**
    ```json
    {
      "error": "Failed to start stream: <error message>"
    }
    ```

## 2. Serve HLS Files

- **Endpoint:** `/hls/<filename>`
- **Method:** `GET`
- **Description:** Serves the HLS playlist (`.m3u8`) or segment files (`.ts`) stored in the HLS output 
directory. The `<filename>` parameter specifies the name of the file to serve.
- **Response:**
  - **Success (200):** Returns the requested `.m3u8` or `.ts` file.
  - **Error (404):** If the file is not found:
    ```json
    {
      "error": "File not found"
    }
    ```

## 3. Overlay Management

### Get All Overlays

- **Endpoint:** `/api/overlays`
- **Method:** `GET`
- **Description:** Retrieves a list of all overlays from the database.
- **Response:**
  - **Success (200):**
    ```json
    [
      {
        "_id": "<overlay_id>",
        "key": "value",
        "another_key": "another_value"
      },
      ...
    ]
    ```

### Create a New Overlay

- **Endpoint:** `/api/overlays`
- **Method:** `POST`
- **Description:** Adds a new overlay to the database.
- **Request Body:**
  ```json
  {
    "key": "value",
    "another_key": "another_value"
  }

### Update a Single Overlay

- **Endpoint:** `/api/overlays/<id>`
- **Method:** `PUT`
- **Description:** Updates an existing overlay in the database by its ID.
- **Request Body:**
  ```json
  {
    "key": "new_value",
    "another_key": "new_another_value"
  }



### Delete an Overlay

- **Endpoint:** `/api/overlays/<id>`
- **Method:** `DELETE`
- **Description:** Deletes an overlay from the database by its ID.
- **Response:**
  - **Success (200):**
    ```json
    {
      "result": "success"
    }
    ```
  - **Error (404):**
    ```json
    {
      "error": "Overlay not found"
    }
    ```

