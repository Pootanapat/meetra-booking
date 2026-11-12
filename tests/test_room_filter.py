import unittest

from mock_data import MOCK_ROOMS
from room import Room, RoomFilterCriteria
from room_filter import InMemoryRoomRepository, RoomFilterService


class RoomTests(unittest.TestCase):
    def test_room_requires_valid_identity_location_and_capacity(self):
        with self.assertRaisesRegex(ValueError, "ID"):
            Room("", "ห้องประชุม", 10, "อาคาร A", 1)
        with self.assertRaisesRegex(ValueError, "capacity"):
            Room("701", "ห้องประชุม", 0, "อาคาร A", 1)
        with self.assertRaisesRegex(ValueError, "building"):
            Room("701", "ห้องประชุม", 10, " ", 1)


class RoomFilterCriteriaTests(unittest.TestCase):
    def test_rejects_negative_capacity(self):
        with self.assertRaisesRegex(ValueError, "negative"):
            RoomFilterCriteria(min_capacity=-1)

    def test_rejects_blank_exact_filters(self):
        with self.assertRaisesRegex(ValueError, "Equipment"):
            RoomFilterCriteria(equipment=" ")
        with self.assertRaisesRegex(ValueError, "Building"):
            RoomFilterCriteria(building=" ")


class RoomFilterServiceTests(unittest.TestCase):
    def setUp(self):
        self.repository = InMemoryRoomRepository(MOCK_ROOMS)
        self.service = RoomFilterService(self.repository)

    def test_returns_all_rooms_without_criteria(self):
        self.assertEqual(self.service.search(), list(MOCK_ROOMS))

    def test_filters_by_case_insensitive_name_or_id(self):
        self.assertEqual(
            [
                room.id
                for room in self.service.search(
                    RoomFilterCriteria(query="บุนนาค")
                )
            ],
            ["701"],
        )
        self.assertEqual(
            [room.id for room in self.service.search(RoomFilterCriteria(query="70"))],
            ["701", "702", "703", "704", "706"],
        )

    def test_filters_by_minimum_capacity(self):
        self.assertEqual(
            [
                room.id
                for room in self.service.search(
                    RoomFilterCriteria(min_capacity=40)
                )
            ],
            ["701", "704"],
        )

    def test_filters_by_equipment_case_insensitively(self):
        self.assertEqual(
            [
                room.id
                for room in self.service.search(
                    RoomFilterCriteria(equipment=" Wi-Fi ")
                )
            ],
            ["704"],
        )

    def test_filters_by_building_case_insensitively(self):
        self.assertEqual(
            [
                room.id
                for room in self.service.search(
                    RoomFilterCriteria(building="อาคารเรียนรวม b")
                )
            ],
            ["703", "704"],
        )

    def test_combines_all_criteria(self):
        criteria = RoomFilterCriteria(
            query="70",
            min_capacity=35,
            equipment="ไมโครโฟน",
            building="อาคารเรียนรวม B",
        )

        self.assertEqual(
            [room.id for room in self.service.search(criteria)],
            ["703", "704"],
        )

    def test_returns_empty_list_when_no_room_matches(self):
        self.assertEqual(
            self.service.search(
                RoomFilterCriteria(query="ไม่มีห้องนี้")
            ),
            [],
        )

    def test_repository_rejects_duplicate_room_ids(self):
        with self.assertRaisesRegex(ValueError, "unique"):
            InMemoryRoomRepository([MOCK_ROOMS[0], MOCK_ROOMS[0]])

    def test_repository_keeps_its_room_collection_immutable(self):
        source = list(MOCK_ROOMS)
        repository = InMemoryRoomRepository(source)
        source.clear()

        self.assertEqual(repository.list_rooms(), MOCK_ROOMS)


if __name__ == "__main__":
    unittest.main()
