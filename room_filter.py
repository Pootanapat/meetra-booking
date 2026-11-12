"""Application service and repository boundary for meeting-room search."""

from typing import Protocol, Sequence

from room import Room, RoomFilterCriteria


class RoomRepository(Protocol):
    """Read-only source of rooms used by the search service."""

    def list_rooms(self) -> Sequence[Room]:
        """Return the rooms available to search."""


class InMemoryRoomRepository:
    """Immutable in-memory room source suitable for local use and tests."""

    def __init__(self, rooms: Sequence[Room]) -> None:
        self._rooms = tuple(rooms)
        room_ids = [room.id for room in self._rooms]
        if len(room_ids) != len(set(room_ids)):
            raise ValueError("Room IDs must be unique")

    def list_rooms(self) -> tuple[Room, ...]:
        return self._rooms


class RoomFilterService:
    """Apply room search criteria without depending on a storage mechanism."""

    def __init__(self, repository: RoomRepository) -> None:
        self._repository = repository

    def search(self, criteria: RoomFilterCriteria | None = None) -> list[Room]:
        """Return rooms matching every supplied criterion."""
        filters = criteria or RoomFilterCriteria()
        query = filters.query.strip().casefold()
        equipment = (
            filters.equipment.strip().casefold()
            if filters.equipment is not None
            else None
        )
        rooms = self._repository.list_rooms()

        return [
            room
            for room in rooms
            if self._matches_query(room, query)
            and (
                filters.min_capacity is None
                or room.capacity >= filters.min_capacity
            )
            and (
                equipment is None
                or equipment
                in {item.casefold() for item in room.equipment}
            )
            and (
                filters.building is None
                or room.building.casefold() == filters.building.strip().casefold()
            )
        ]

    @staticmethod
    def _matches_query(room: Room, query: str) -> bool:
        if not query:
            return True
        searchable_text = f"{room.id} {room.name} {room.building}".casefold()
        return query in searchable_text
