import unittest
from datetime import datetime, timedelta, timezone

from timeline import (
    Booking,
    SlotStatus,
    TimeRange,
    find_conflicts,
    get_room_status,
    get_status,
    select_room_slot,
    select_slot,
)


class TimeRangeTests(unittest.TestCase):
    def test_requires_positive_duration(self):
        start = datetime(2026, 11, 6, 9)

        with self.assertRaises(ValueError):
            TimeRange(start, start)
        with self.assertRaises(ValueError):
            TimeRange(start + timedelta(hours=1), start)

    def test_rejects_mixed_timezone_awareness(self):
        start = datetime(2026, 11, 6, 9)
        aware_start = start.replace(tzinfo=timezone.utc)

        with self.assertRaises(ValueError):
            TimeRange(start, aware_start + timedelta(hours=1))


class TimelineTests(unittest.TestCase):
    def setUp(self):
        self.now = datetime(2026, 11, 6, 9, tzinfo=timezone.utc)
        self.slot = TimeRange(
            self.now + timedelta(hours=1),
            self.now + timedelta(hours=2),
        )

    def test_adjacent_booking_does_not_conflict(self):
        booking = TimeRange(
            self.now,
            self.slot.start,
        )

        self.assertEqual(find_conflicts(self.slot, [booking]), [])

    def test_partial_and_contained_bookings_conflict(self):
        partial = TimeRange(
            self.slot.end - timedelta(minutes=15),
            self.slot.end + timedelta(minutes=15),
        )
        contained = TimeRange(
            self.slot.start + timedelta(minutes=10),
            self.slot.start + timedelta(minutes=20),
        )

        self.assertEqual(
            find_conflicts(self.slot, [partial, contained]),
            [partial, contained],
        )

    def test_timezone_mismatch_is_rejected(self):
        naive_booking = TimeRange(
            datetime(2026, 11, 6, 10),
            datetime(2026, 11, 6, 11),
        )

        with self.assertRaises(ValueError):
            find_conflicts(self.slot, [naive_booking])

    def test_statuses_are_available_booked_and_past(self):
        booking = TimeRange(
            self.slot.start,
            self.slot.end,
        )
        elapsed = TimeRange(
            self.now - timedelta(hours=2),
            self.now - timedelta(hours=1),
        )

        self.assertEqual(get_status(self.slot, [], self.now), SlotStatus.AVAILABLE)
        self.assertEqual(get_status(self.slot, [booking], self.now), SlotStatus.BOOKED)
        self.assertEqual(get_status(elapsed, [elapsed], self.now), SlotStatus.PAST)

    def test_started_slot_is_past_even_if_it_has_not_ended(self):
        ongoing = TimeRange(
            self.now - timedelta(minutes=5),
            self.now + timedelta(minutes=25),
        )

        self.assertEqual(get_status(ongoing, [], self.now), SlotStatus.PAST)

    def test_selects_available_slot_only(self):
        self.assertEqual(select_slot(self.slot, [], self.now), self.slot)
        with self.assertRaisesRegex(ValueError, "booked"):
            select_slot(self.slot, [self.slot], self.now)

        elapsed = TimeRange(
            self.now - timedelta(hours=2),
            self.now - timedelta(hours=1),
        )
        with self.assertRaisesRegex(ValueError, "past"):
            select_slot(elapsed, [], self.now)


class RoomTimelineTests(unittest.TestCase):
    def setUp(self):
        self.now = datetime(2026, 11, 6, 9, tzinfo=timezone.utc)
        self.slot = TimeRange(
            datetime(2026, 11, 6, 10, tzinfo=timezone.utc),
            datetime(2026, 11, 6, 10, 30, tzinfo=timezone.utc),
        )

    def test_only_same_room_overlapping_bookings_conflict(self):
        same_room = Booking(
            "701",
            TimeRange(
                self.slot.start - timedelta(minutes=15),
                self.slot.start + timedelta(minutes=15),
            ),
        )
        different_room = Booking("702", same_room.time_range)
        different_day = Booking(
            "701",
            TimeRange(
                self.slot.start + timedelta(days=1),
                self.slot.end + timedelta(days=1),
            ),
        )

        self.assertEqual(
            get_room_status(
                self.slot,
                [different_room, different_day],
                "701",
                self.now,
            ),
            SlotStatus.AVAILABLE,
        )
        self.assertEqual(
            get_room_status(self.slot, [same_room], "701", self.now),
            SlotStatus.BOOKED,
        )

    def test_booking_from_previous_day_conflicts_if_it_overlaps(self):
        overnight = Booking(
            "701",
            TimeRange(
                self.slot.start - timedelta(days=1, minutes=15),
                self.slot.start + timedelta(minutes=15),
            ),
        )

        self.assertEqual(
            get_room_status(self.slot, [overnight], "701", self.now),
            SlotStatus.BOOKED,
        )

    def test_selects_room_slot_only_when_available(self):
        booking = Booking("701", self.slot)

        with self.assertRaisesRegex(ValueError, "booked"):
            select_room_slot(self.slot, [booking], "701", self.now)

        self.assertEqual(
            select_room_slot(self.slot, [booking], "702", self.now),
            self.slot,
        )

    def test_booking_requires_room_id(self):
        with self.assertRaisesRegex(ValueError, "room ID"):
            Booking(" ", self.slot)


if __name__ == "__main__":
    unittest.main()
