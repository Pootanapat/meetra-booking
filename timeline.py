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


@dataclass(frozen=True)
class Booking:
    """A room reservation on a half-open time interval."""

    room_id: str
    time_range: TimeRange

    def __post_init__(self) -> None:
        if not isinstance(self.room_id, str) or not self.room_id.strip():
            raise ValueError("A booking must have a room ID")
        if not isinstance(self.time_range, TimeRange):
            raise TypeError("A booking time range must be a TimeRange")


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
    """Resolve a slot's state, treating started slots as unavailable."""
    _validate_datetime_pair(slot.start, now)
    if slot.start <= now:
        return SlotStatus.PAST
    if find_conflicts(slot, bookings):
        return SlotStatus.BOOKED
    return SlotStatus.AVAILABLE


def get_room_status(
    slot: TimeRange,
    bookings: Iterable[Booking],
    room_id: str,
    now: datetime,
) -> SlotStatus:
    """Resolve availability using bookings for the same room that overlap the slot."""
    if not isinstance(room_id, str) or not room_id.strip():
        raise ValueError("A room ID is required")
    room_bookings = (
        booking.time_range
        for booking in bookings
        if booking.room_id == room_id
    )
    return get_status(slot, room_bookings, now)


def select_slot(
    slot: TimeRange, bookings: Iterable[TimeRange], now: datetime
) -> TimeRange:
    """Select an available slot, raising ValueError when it cannot be selected."""
    status = get_status(slot, bookings, now)
    if status is not SlotStatus.AVAILABLE:
        raise ValueError(f"Cannot select a {status.value} time range")
    return slot


def select_room_slot(
    slot: TimeRange,
    bookings: Iterable[Booking],
    room_id: str,
    now: datetime,
) -> TimeRange:
    """Select a slot only when it is available for the requested room and day."""
    status = get_room_status(slot, bookings, room_id, now)
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
