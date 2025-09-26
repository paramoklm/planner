from datetime import datetime

TIMETABLE = {}

"""
    "date": [{"startTime", "endTime", "title"}, {...}, {...}, ...],
    "anotherdate": [...], 
"""


def is_same_slot(slot1, slot2):
    return slot1["startTime"] == slot2["startTime"] and slot1["endTime"] == slot2["endTime"] and slot1["title"] == slot2["title"]

def is_duplicate(eventSlot: dict):
    i = 0
    while (i < len(TIMETABLE[eventSlot["date"]])):
        if is_same_slot(eventSlot, TIMETABLE[eventSlot["date"]][i]):
            return True
        i += 1
    return False

# Returns true if time1 is after time2
def compare_time(time1, time2):
    t1 = datetime.strptime(time1, "%H:%M").time()
    t2 = datetime.strptime(time2, "%H:%M").time()
    return t1 > t2

# Returns the position of the slot in the day timewise
def get_slot_position(eventSlot: dict):
    i = 0
    while (i < len(TIMETABLE[eventSlot["date"]]) and compare_time(eventSlot["startTime"], TIMETABLE[eventSlot["date"]][i]["startTime"])):
        i += 1
    return i

# Returns true if there is a time conflict between slots
def is_slot_conflict(eventSlot: dict):
    if eventSlot["date"] in TIMETABLE:
        # Go through all the slots on that date
        for slot in TIMETABLE[eventSlot["date"]]:
            """
                TBA = to be added
                If existing slot's start time is before TBA slot's start time then conflict if existing slot's end time after TBA start time
                If TBA slot's start time is before existing slot's start time then conflict if TBA slot's end time after existing start time
            """
            if (
                (compare_time(slot["startTime"], eventSlot["startTime"])
                and compare_time(eventSlot["endTime"], slot["startTime"]))
                or
                (compare_time(eventSlot["startTime"], slot["startTime"])
                and compare_time(slot["endTime"], eventSlot["startTime"]))
                or
                (slot["startTime"] == eventSlot["startTime"])
            ):
                return "There is a conflict"
    return "There is no conflict"

# Add the event slot to the timetable
def add_slot(eventSlot: dict) -> str:
    # If date already exists in timetable
    if eventSlot["date"] in TIMETABLE:
        if is_duplicate(eventSlot):
            return "SUCCESS"
        
        # Get the position of the event slot timewise during the day and add it
        TIMETABLE[eventSlot["date"]].insert(get_slot_position(eventSlot), {k: v for k, v in eventSlot.items() if k != "date"})
    else: # Else
        # Initiate the list and add the event slot
        TIMETABLE[eventSlot["date"]] = [{k: v for k, v in eventSlot.items() if k != "date"}]
    return "SUCCESS"

def remove_slot(eventSlot: dict) -> str:
    print(eventSlot)
    print(TIMETABLE)
    if eventSlot["date"] in TIMETABLE:
        position = get_slot_position(eventSlot)
        if position == len(TIMETABLE[eventSlot["date"]]):
            return "Couldn't find the slot to remove at date"
        TIMETABLE[eventSlot["date"]].pop(get_slot_position(eventSlot))
        if len(TIMETABLE[eventSlot["date"]]) == 0:
            del TIMETABLE[eventSlot["date"]]
        return "SUCCESS"
    return "Date not found or not right timing or title"

"""
{'date': '29/09/2025', 'weekday': 'Monday', 'startTime': '10:00', 'endTime': '11:00', 'title': 'Meeting'}

{'29/09/2025': [{'weekday': 'Monday', 'startTime': '17:00', 'endTime': '18:00', 'title': 'Meeting with Boss'}], 
'06/10/2025': [{'weekday': 'Monday', 'startTime': '17:00', 'endTime': '18:00', 'title': 'Meeting with Boss'}]}
"""

# {'date': '29/09/2025', 'weekday': 'Monday', 'startTime': '09:00', 'endTime': '10:00', 'title': 'Next Monday'

def access_timetable() -> str:
    if not TIMETABLE:
        return "No events planned"
    result = ""
    for date in TIMETABLE:
        result += f"{date}: \n"
        for slot in TIMETABLE[date]:
            result += f"\t({slot["weekday"]}) Title: {slot["title"]}, Start Time: {slot["startTime"]} - End Time: {slot["endTime"]}\n"
    return result

        
    