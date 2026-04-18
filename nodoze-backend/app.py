from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import cv2
import numpy as np
from collections import deque
import mediapipe as mp

app = Flask(__name__)
CORS(app)

# Setup the Tasks API
BaseOptions = mp.tasks.BaseOptions
FaceLandmarker = mp.tasks.vision.FaceLandmarker
FaceLandmarkerOptions = mp.tasks.vision.FaceLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

# Initialize the detector
options = FaceLandmarkerOptions(
    base_options=BaseOptions(model_asset_path="face_landmarker.task"),
    running_mode=VisionRunningMode.IMAGE,
)
detector = FaceLandmarker.create_from_options(options)

# MediaPipe Task indices for EAR
LEFT_EYE = [362, 385, 387, 263, 373, 380]
RIGHT_EYE = [33, 160, 158, 133, 153, 144]
last_five_images = deque(maxlen=5)


def get_ear(landmarks, eye_indices):
    # Landmarks in the new API are objects with x, y, z
    coords = [np.array([landmarks[i].x, landmarks[i].y]) for i in eye_indices]
    v1 = np.linalg.norm(coords[1] - coords[5])
    v2 = np.linalg.norm(coords[2] - coords[4])
    h = np.linalg.norm(coords[0] - coords[3])
    return (v1 + v2) / (2.0 * h)


def get_head_tilt(landmarks):
    # Using the nose tip (index 1) and the chin (index 152)
    # We look at the Y-distance relative to the overall face height
    nose = landmarks[1]
    chin = landmarks[152]
    forehead = landmarks[10]

    # Calculate the ratio of nose position between forehead and chin
    # If the nose gets too close to the chin, the head is tilted down
    face_height = chin.y - forehead.y
    nose_pos = (nose.y - forehead.y) / face_height if face_height != 0 else 0.5

    return nose_pos


@app.route("/detect", methods=["POST"])
def detect_drowsiness():
    data = request.json
    if not data or "image" not in data:
        return jsonify({"error": "No image provided"}), 400

    last_five_images.append(data["image"])

    # Decode
    img_data = base64.b64decode(data["image"])
    nparr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Convert to MediaPipe Image object
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_img)

    # Detect
    detection_result = detector.detect(mp_image)

    is_drowsy = False
    ear_value = 0.0
    nose_ratio = 0.5  # Default neutral position

    if detection_result.face_landmarks:
        landmarks = detection_result.face_landmarks[0]

        # 1. EAR Logic
        left_ear = get_ear(landmarks, LEFT_EYE)
        right_ear = get_ear(landmarks, RIGHT_EYE)
        ear_value = (left_ear + right_ear) / 2.0

        # 2. Head Tilt Logic
        nose_ratio = get_head_tilt(landmarks)

        # 3. Combined Trigger
        # Triggers if eyes are closed OR head is slumped down
        # Try bumping 0.65 to 0.75 to make it less sensitive to your desk setup
        if ear_value < 0.13 or nose_ratio > 0.60:
            is_drowsy = True

        print(
            f"EAR: {ear_value:.3f} | Head Pos: {nose_ratio:.2f} | Drowsy: {is_drowsy}"
        )
    else:
        print("No face detected")

    return jsonify(
        {
            "status": "success",
            "isDrowsy": is_drowsy,
            "ear": round(ear_value, 3),
            "head_tilt": round(nose_ratio, 2),
        }
    )


@app.route("/get-images", methods=["GET"])
def get_images():
    return jsonify({"images": list(last_five_images)})


@app.route("/view-images", methods=["GET"])
def view_images():
    html = "<html><body style='font-family: sans-serif;'><h1>Last 5 Frames</h1><div style='display: flex; flex-wrap: wrap;'>"
    for img_b64 in last_five_images:
        html += f'<div style="margin: 10px;"><img src="data:image/jpeg;base64,{img_b64}" style="width:300px; border:2px solid #333; border-radius: 8px;"></div>'
    if not last_five_images:
        html += "<p>No images captured yet. Start the app on your phone!</p>"
    html += "</div></body></html>"
    return html


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
