##(ข้อมูลจำลอง)

mock_rooms = [
    {
        "id": "1",
        "name": "Meeting Room A",
        "building": "Building 1",
        "capacity": 10,
        "amenities": ["Projector", "Whiteboard", "WiFi"],
        "is_available": True
    },
    {
        "id": "2",
        "name": "Conference Room B",
        "building": "Building 2",
        "capacity": 20,
        "amenities": ["Projector", "TV", "WiFi", "Video Conference"],
        "is_available": True
    },
    {
        "id": "3",
        "name": "Brainstorm Room C",
        "building": "Building 1",
        "capacity": 5,
        "amenities": ["Whiteboard", "WiFi"],
        "is_available": False
    }
]

mock_bookings = [
    {
        "id": "b1",
        "room_id": "3",
        "title": "Sprint Planning",
        "user_name": "Somchai",
        "start_time": "2026-11-10 09:00",
        "end_time": "2026-11-10 11:00"
    }
]