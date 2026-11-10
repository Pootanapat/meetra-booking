"""Room domain models used by room search and filtering."""

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Room:
    """A meeting room and its searchable properties."""

    id: str
    name: str
    capacity: int
    building: str
    floor: int
    equipment: frozenset[str] = frozenset()

    def __post_init__(self) -> None:
        if not self.id.strip():
            raise ValueError("A room must have an ID")
        if not self.name.strip():
            raise ValueError("A room must have a name")
        if self.capacity <= 0:
            raise ValueError("Room capacity must be positive")
        if not self.building.strip():
            raise ValueError("A room must have a building")
        if self.floor <= 0:
            raise ValueError("Room floor must be positive")
        if any(not item.strip() for item in self.equipment):
            raise ValueError("Room equipment names must not be blank")


@dataclass(frozen=True, slots=True)
class RoomFilterCriteria:
    """Optional, conjunctive filters for finding meeting rooms."""

    query: str = ""
    min_capacity: int | None = None
    equipment: str | None = None
    building: str | None = None

    def __post_init__(self) -> None:
        if self.min_capacity is not None and self.min_capacity < 0:
            raise ValueError("Minimum capacity cannot be negative")
        if self.equipment is not None and not self.equipment.strip():
            raise ValueError("Equipment filter must not be blank")
        if self.building is not None and not self.building.strip():
            raise ValueError("Building filter must not be blank")
