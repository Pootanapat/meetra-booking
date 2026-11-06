import unittest
from datetime import datetime, timedelta, timezone

from timeline import SlotStatus, TimeRange, find_conflicts, get_status, select_slot


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


if __name__ == "__main__":
    unittest.main()
