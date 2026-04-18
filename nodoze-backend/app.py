from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import cv2
import numpy as np

app = Flask(__name__)
CORS(app)  # Allow connection to frontend


@app.route("/detect", methods=["POST"])
def detect_drowsiness():
    data = request.json
    if not data or "image" not in data:
        return jsonify({"error": "No image provided"}), 400

    # Decode the base64 image from React Native
    img_data = base64.b64string(data["image"])
    nparr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # This is where you will add your MediaPipe/EAR logic later
    print("Received frame for analysis...")

    # Result
    is_drowsy = False

    # Return refult
    return jsonify({"status": "success", "isDrowsy": is_drowsy})


if __name__ == "__main__":
    # Run on 0.0.0.0 so it's accessible on your local network
    app.run(host="0.0.0.0", port=5000, debug=True)
