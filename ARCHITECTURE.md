# Booking timeline and room filtering architecture

## Booking timeline

The browser timeline stays in the project's existing HTML and JavaScript stack;
there is no React or TypeScript build configuration, so the interactive
`TimelineView.js` is the timeline component rather than a parallel `.tsx`
implementation. It renders 30-minute slots from 07:00 to 17:00, supports click,
mouse-drag, and keyboard selection, and reads/writes bookings through the
existing `booking.js` local-storage flow.

The Python `timeline.py` module contains the matching, independently testable
domain rules. `TimeRange` and `Booking` are immutable values; ranges use
half-open intervals (`[start, end)`), so adjacent bookings do not conflict.
`find_conflicts`, `get_room_status`, and `select_room_slot` keep overlap,
room-specific status, and selection validation separate from the UI.

```mermaid
classDiagram
    class TimeRange {
        +datetime start
        +datetime end
    }
    class Booking {
        +str room_id
        +TimeRange time_range
    }
    class SlotStatus {
        <<enumeration>>
        AVAILABLE
        BOOKED
        PAST
    }
    Booking *-- TimeRange
    Booking ..> SlotStatus : resolved by timeline rules
    TimeRange ..> SlotStatus : resolved by timeline rules
```

```mermaid
flowchart LR
    BookingData["booking.js / localStorage"] --> Timeline["TimelineView.js"]
    Timeline --> BrowserRules["Browser overlap and past-time checks"]
    BrowserRules --> Colors["available / booked / past slot states"]
    BrowserRules --> Selection["drag or keyboard selection"]
    PythonRules["timeline.py domain rules"] --> PythonTests["tests/test_timeline.py"]
```

The Python rules are not called directly by the static browser pages; they
provide a tested domain implementation for Python workflows and future API
integration. The browser applies the same half-open overlap rule locally.

## Room filtering

Room filtering is implemented as a Python application service, separate from
the browser UI. This keeps its domain rules independently testable and avoids
coupling the service to HTML, JavaScript, or a particular persistence provider.

```mermaid
classDiagram
    class Room {
        +str id
        +str name
        +int capacity
        +str building
        +int floor
        +frozenset equipment
    }
    class RoomFilterCriteria {
        +str query
        +int min_capacity
        +str equipment
        +str building
    }
    class RoomRepository {
        <<Protocol>>
        +list_rooms() Sequence~Room~
    }
    class InMemoryRoomRepository {
        +list_rooms() tuple~Room~
    }
    class RoomFilterService {
        -RoomRepository repository
        +search(criteria) list~Room~
    }
    RoomRepository <|.. InMemoryRoomRepository
    RoomFilterService --> RoomRepository : depends on abstraction
    RoomFilterService --> RoomFilterCriteria : applies
    RoomFilterService --> Room : returns
    InMemoryRoomRepository o--> Room : stores
```

`Room` and `RoomFilterCriteria` are immutable domain values. The repository
protocol isolates data access, and `RoomFilterService` applies all supplied
criteria conjunctively. `MOCK_ROOMS` provides sample data through
`mock_data.py`; production storage can be added behind `RoomRepository` without
changing the filtering service.

The current browser pages continue to use their existing JavaScript behavior.
The Python service is not connected to the browser or exposed over HTTP; an API
adapter can be added separately if server-side integration is needed.
