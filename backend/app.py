

from flask import Flask, jsonify, send_from_directory, Response,request
from flask_cors import CORS
import os
import subprocess
from flask_pymongo import PyMongo
from bson.objectid import ObjectId

app = Flask(__name__)
CORS(app)  # Enable CORS for communication with the React frontend
app.config["MONGO_URI"] = "mongodb+srv://jadwanihardik10:HLvYGp3RYdJDA3zL@cluster69.jvp7fg3.mongodb.net/overlays_db"  # Change as per your MongoDB setup
mongo = PyMongo(app)

# Path where FFmpeg will store the HLS output files
HLS_OUTPUT_PATH = './hls_output'
RTSP_URL = 'rtsp://rtspstream:a3225734323052aacda51ac47d552a62@zephyr.rtsp.stream/movie'



# Route to start FFmpeg and generate HLS stream
@app.route('/start-stream', methods=['GET'])
def start_stream():
    # If the HLS output directory doesn't exist, create it
    if not os.path.exists(HLS_OUTPUT_PATH):
        os.makedirs(HLS_OUTPUT_PATH)

    # Run FFmpeg to convert RTSP to HLS with TCP transport
    ffmpeg_command = [
        'C:/ffmpeg/bin/ffmpeg',  # Full path to ffmpeg.exe on Windows
        '-rtsp_transport', 'tcp',
        '-i', RTSP_URL,
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-c:a', 'aac',
        '-f', 'hls',
        '-hls_time', '2',
        '-hls_list_size', '3',  # Only keep 3 segments in the playlist
        '-hls_flags', 'delete_segments+discont_start',  # Ensure old segments are deleted and start fresh
        '-hls_segment_type', 'mpegts',
        os.path.join(HLS_OUTPUT_PATH, 'output.m3u8')
    ]


    
    try:
        # Start FFmpeg process and capture logs
        process = subprocess.Popen(ffmpeg_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        # Capture and log FFmpeg stderr output
        _, stderr = process.communicate()
        if stderr:
            print("FFmpeg error log:", stderr.decode())

        return jsonify({"message": "Livestream started"}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to start stream: {str(e)}"}), 500
    

# Route to serve HLS .m3u8 file and .ts segments
@app.route('/hls/<path:filename>', methods=['GET'])
def serve_hls_file(filename):
    return send_from_directory(HLS_OUTPUT_PATH, filename)


@app.route('/api/overlays', methods=['GET', 'POST'])
def handle_overlays():
    if request.method == 'GET':
        overlays = list(mongo.db.overlays.find())
        for overlay in overlays:
            overlay['_id'] = str(overlay['_id'])  # Convert ObjectId to string
        return jsonify(overlays)
    
    if request.method == 'POST':
        overlay_data = request.json
        result = mongo.db.overlays.insert_one(overlay_data)
        overlay_data['_id'] = str(result.inserted_id)
        return jsonify(overlay_data), 201

@app.route('/api/overlays/<id>', methods=['PUT', 'DELETE'])
def handle_single_overlay(id):
    # Convert the string id to ObjectId
    object_id = ObjectId(id)

    if request.method == 'PUT':
        overlay_data = request.json
        # Use ObjectId for querying the document
        result = mongo.db.overlays.update_one({'_id': object_id}, {'$set': overlay_data})
        
        if result.matched_count == 0:
            return jsonify({'error': 'Overlay not found'}), 404
        
        # Return the updated overlay with its ID
        overlay_data['_id'] = id
        return jsonify(overlay_data)

    if request.method == 'DELETE':
        result = mongo.db.overlays.delete_one({'_id': object_id})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Overlay not found'}), 404

        return jsonify({'result': 'success'})

if __name__ == '__main__':
    app.run(debug=True)