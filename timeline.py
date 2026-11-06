"""Time-range validation and availability rules for the booking timeline."""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Iterable


class SlotStatus(str, Enum):
    AVAILABLE = "available"
    BOOKED = "booked"
    PAST = "past"


@dataclass(frozen=True)
class TimeRange:
    """A half-open time interval: the start is included and the end is excluded."""

    start: datetime
    end: datetime

    def __post_init__(self) -> None:
        _validate_datetime_pair(self.start, self.end)
        if self.start >= self.end:
            raise ValueError("A time range must end after it starts")


def find_conflicts(
    slot: TimeRange, bookings: Iterable[TimeRange]
) -> list[TimeRange]:
    """Return bookings that overlap a slot; adjacent ranges do not overlap."""
    conflicts = []
    for booking in bookings:
        _validate_datetime_pair(slot.start, booking.start)
        _validate_datetime_pair(slot.start, booking.end)
        if slot.start < booking.end and booking.start < slot.end:
            conflicts.append(booking)
    return conflicts


def get_status(
    slot: TimeRange, bookings: Iterable[TimeRange], now: datetime
) -> SlotStatus:
    """Resolve a slot's display state, prioritizing elapsed time over bookings."""
    _validate_datetime_pair(slot.start, now)
    if slot.end <= now:
        return SlotStatus.PAST
    if find_conflicts(slot, bookings):
        return SlotStatus.BOOKED
    return SlotStatus.AVAILABLE


def select_slot(
    slot: TimeRange, bookings: Iterable[TimeRange], now: datetime
) -> TimeRange:
    """Select an available slot, raising ValueError when it cannot be selected."""
    status = get_status(slot, bookings, now)
    if status is not SlotStatus.AVAILABLE:
        raise ValueError(f"Cannot select a {status.value} time range")
    return slot


def _validate_datetime_pair(first: datetime, second: datetime) -> None:
    if not isinstance(first, datetime) or not isinstance(second, datetime):
        raise TypeError("Time range values must be datetime instances")
    first_is_aware = first.tzinfo is not None and first.utcoffset() is not None
    second_is_aware = second.tzinfo is not None and second.utcoffset() is not None
    if first_is_aware != second_is_aware:
        raise ValueError("Cannot compare timezone-aware and timezone-naive datetimes")
