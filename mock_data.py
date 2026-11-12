"""Sample meeting-room data for the room-filtering service."""

from room import Room


MOCK_ROOMS = (
    Room(
        id="701",
        name="บุนนาค",
        capacity=100,
        building="อาคารเรียนรวม A",
        floor=7,
        equipment=frozenset({
            "โปรเจกเตอร์",
            "ไมโครโฟน",
            "จอแสดงผล",
        }),
    ),
    Room(
        id="702",
        name="ชงโค",
        capacity=30,
        building="อาคารเรียนรวม A",
        floor=7,
        equipment=frozenset({
            "จอแสดงผล",
            "กระดานไวท์บอร์ด",
        }),
    ),
    Room(
        id="703",
        name="พิกุล",
        capacity=35,
        building="อาคารเรียนรวม B",
        floor=7,
        equipment=frozenset({
            "โปรเจกเตอร์",
            "ไมโครโฟน",
        }),
    ),
    Room(
        id="704",
        name="ราชพฤกษ์",
        capacity=40,
        building="อาคารเรียนรวม B",
        floor=7,
        equipment=frozenset({
            "จอแสดงผล",
            "ไมโครโฟน",
            "Wi-Fi",
        }),
    ),
    Room(
        id="706",
        name="บัวหลวง",
        capacity=25,
        building="อาคารเรียนรวม A",
        floor=7,
        equipment=frozenset({
            "จอแสดงผล",
            "กระดานไวท์บอร์ด",
        }),
    ),
)
