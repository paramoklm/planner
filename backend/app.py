from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os

from crew_execution import crew, execute_request

app = Flask(__name__)
CORS(app)  # allow frontend (React) to call backend

TIMETABLE_PATH = os.path.join(os.path.dirname(__file__), "timetable.json")


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_input = data.get("message", "")
    print(f"User said: {user_input}")
    return jsonify({"reply": execute_request(user_input, crew)})


@app.route("/update_slot", methods=["POST"])
def update_slot():
    """Update (replace) a slot in timetable.json."""
    data = request.get_json()

    date = data.get("date")
    index = data.get("index")
    new_slot = data.get("new_slot")

    if not (date and isinstance(index, int) and isinstance(new_slot, dict)):
        return jsonify({"error": "Missing or invalid parameters"}), 400

    # Load the JSON file
    if not os.path.exists(TIMETABLE_PATH):
        return jsonify({"error": "timetable.json not found"}), 404

    with open(TIMETABLE_PATH, "r", encoding="utf-8") as f:
        timetable = json.load(f)

    # Ensure the date exists
    if date not in timetable:
        return jsonify({"error": f"No slots found for date {date}"}), 404

    # Replace or append the slot
    slots = timetable[date]
    if 0 <= index < len(slots):
        slots[index] = new_slot
    else:
        # if index out of range, append new slot
        slots.append(new_slot)

    # Save changes back to the file
    with open(TIMETABLE_PATH, "w", encoding="utf-8") as f:
        json.dump(timetable, f, indent=2, ensure_ascii=False)

    return jsonify({"message": f"Slot updated for {date}", "new_slot": new_slot})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
