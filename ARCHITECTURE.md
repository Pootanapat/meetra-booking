# Meetra Booking architecture

รายละเอียด Class Diagram, ความสัมพันธ์ระหว่าง Object และตัวอย่าง SOLID อยู่ที่
[`docs/architecture/class-diagram.md`](docs/architecture/class-diagram.md)

## Runtime

Meetra Booking uses a layered runtime architecture:

```text
Browser HTML/JavaScript
        -> Express Router / Controllers
        -> Services (business rules)
        -> Repositories (SQL)
        -> SQLite
```

`server.js` is the composition root. It creates repositories, injects them into
services, injects services into controllers, and connects controllers to routes.
Business rules do not depend directly on Express or SQLite initialization.

Vite builds the six HTML pages into `dist/`. Express serves only `dist/` and
stores runtime data under the ignored `data/` directory. Source files and the
SQLite database are never exposed as static files.

## Authentication

Passwords are hashed on the server with `scrypt` and a unique salt. Successful
login creates a random opaque session token. The browser stores one
`meetra_session` value and sends the token as `Authorization: Bearer ...`.

Booking list, create, edit, and cancel operations require authentication.
Edit and cancel statements include the authenticated user ID, so one user
cannot mutate another user's booking.

## Booking rules

The API is the authority for booking validation:

- dates cannot be in the past;
- opening hours are 07:00–17:00;
- start time must be before end time;
- active bookings in the same room use half-open overlap rules;
- cancelled bookings do not block availability.

The UI repeats validation to provide immediate feedback, but the server always
checks again before writing to SQLite.

## Room data

SQLite is the single source of room IDs and room details. The booking, rooms,
and statistics pages load the same records from `/api/rooms` or an API response
derived from those records. No room list is maintained in Local Storage.

## Quality gates

```bash
npm run build
npm test
npm run check
```

Integration tests use an in-memory SQLite database and cover authentication,
booking conflicts, validation, ownership, edit, cancel, and static-file safety.
