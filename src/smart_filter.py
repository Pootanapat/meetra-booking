##(Logic การกรองข้อมูลแบบ Real-time)
import json
import os
from mock_data import mock_rooms

CONFIG_FILE = "filter_state.json"

class SmartFilter:
    def __init__(self, rooms=None):
        self.rooms = rooms if rooms is not None else mock_rooms

    def filter_rooms(self, building="All", min_capacity=0, required_amenities=None):
        if required_amenities is None:
            required_amenities = []

        filtered = [
            room for room in self.rooms
            if (building == "All" or room["building"] == building)
            and (room["capacity"] >= min_capacity)
            and all(amenity in room["amenities"] for amenity in required_amenities)
        ]
        
        self.save_filter_state(building, min_capacity, required_amenities)
        return filtered

    def save_filter_state(self, building, min_capacity, amenities):
        state = {
            "building": building,
            "min_capacity": min_capacity,
            "amenities": amenities
        }
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(state, f, ensure_ascii=False, indent=2)

    def load_filter_state(self):
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        return {"building": "All", "min_capacity": 0, "amenities": []}