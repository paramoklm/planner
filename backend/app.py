from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os

from crew_execution import MyFlow, execute_request


flow = MyFlow()

app = Flask(__name__)
CORS(app)  # allow frontend (React) to call backend

TIMETABLE_PATH = os.path.join(os.path.dirname(__file__), "timetable.json")


@app.route("/chat", methods=["POST"])
def chat():
    print("HHHEEEERRRRREEEE")
    data = request.get_json()
    user_input = data.get("message", "")
    print(f"User said: {user_input}")
    return jsonify({"reply": execute_request(user_input, flow)})



@app.route("/update_slot", methods=["POST"])
def update_slot():
    """Update (replace) a slot in timetable.json. 
    If the date changes, move the slot to the new date."""
    data = request.get_json()

    date = data.get("date")              # 🟢 new date (may be changed)
    index = data.get("index")
    new_slot = data.get("new_slot")
    old_date = data.get("old_date", date)  # 🟢 optional old date

    if not (date and isinstance(index, int) and isinstance(new_slot, dict)):
        return jsonify({"error": "Missing or invalid parameters"}), 400

    # Load the JSON file
    if not os.path.exists(TIMETABLE_PATH):
        return jsonify({"error": "timetable.json not found"}), 404

    with open(TIMETABLE_PATH, "r", encoding="utf-8") as f:
        timetable = json.load(f)

    # Ensure the old date exists
    if old_date not in timetable:
        return jsonify({"error": f"No slots found for date {old_date}"}), 404

    # 🟢 If the date was changed
    if date != old_date:
        # Remove from old date
        old_slots = timetable[old_date]
        if 0 <= index < len(old_slots):
            removed_slot = old_slots.pop(index)
        else:
            return jsonify({"error": "Invalid index for old date"}), 400

        # Add to new date (create if missing)
        if date not in timetable:
            timetable[date] = []
        timetable[date].append(new_slot)

        action = f"Moved slot from {old_date} to {date}"

    else:
        # 🟢 Date unchanged — replace in place
        slots = timetable[date]
        if 0 <= index < len(slots):
            slots[index] = new_slot
            action = f"Updated slot in {date}"
        else:
            slots.append(new_slot)
            action = f"Appended new slot to {date}"

    # Save changes
    with open(TIMETABLE_PATH, "w", encoding="utf-8") as f:
        json.dump(timetable, f, indent=2, ensure_ascii=False)

    return jsonify({"message": action, "new_slot": new_slot})



if __name__ == "__main__":
    app.run(debug=True, port=5000)
