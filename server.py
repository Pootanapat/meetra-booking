"""Serve the built website and adapt the booking domain to JSON requests."""

import argparse
import json
from datetime import datetime
from functools import partial
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

from room import Room, RoomFilterCriteria
from room_filter import InMemoryRoomRepository, RoomFilterService
from timeline import TimeRange, find_conflicts


def filter_rooms(data):
    capacity = data['capacity']
    if capacity not in ('all', 'small', 'large'):
        raise ValueError('Unknown capacity filter')
    # Match the location text the current room cards display.
    rooms = [
        Room(room['id'], room['name'], room['capacity'], room['location'], room['floor'])
        for room in data['rooms']
    ]
    service = RoomFilterService(InMemoryRoomRepository(rooms))
    criteria = RoomFilterCriteria(query=data['query'], min_capacity=16 if capacity == 'large' else None)
    return {'roomIds': [room.id for room in service.search(criteria) if capacity != 'small' or room.capacity <= 15]}


def check_booking(data):
    def time_range(booking):
        return TimeRange(
            datetime.fromisoformat(f"{booking['date']}T{booking['start']}"),
            datetime.fromisoformat(f"{booking['date']}T{booking['end']}"),
        )

    try:
        requested = time_range(data)
    except (KeyError, ValueError):
        return {'status': 'invalid_time'}

    existing = []
    for booking in data['bookings']:
        if booking['roomId'] != data['roomId'] or booking['date'] != data['date']:
            continue
        try:
            existing.append(time_range(booking))
        except (KeyError, ValueError):
            # Earlier versions allowed saving reversed or incomplete intervals.
            continue

    conflicts = find_conflicts(requested, existing)
    if conflicts:
        conflict = conflicts[0]
        return {'status': 'booked', 'start': conflict.start.strftime('%H:%M'), 'end': conflict.end.strftime('%H:%M')}
    return {'status': 'available'}


class BookingHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        actions = {'/api/rooms/filter': filter_rooms, '/api/bookings/check': check_booking}
        action = actions.get(urlsplit(self.path).path)
        if action is None:
            self.send_json(HTTPStatus.NOT_FOUND, {'error': 'Unknown API route'})
            return

        try:
            size = int(self.headers.get('Content-Length', '0'))
            if not 0 < size <= 1024 * 1024:
                raise ValueError('Invalid request size')
            result = action(json.loads(self.rfile.read(size)))
        except (AttributeError, KeyError, TypeError, ValueError):
            self.send_json(HTTPStatus.BAD_REQUEST, {'error': 'Invalid request'})
            return
        self.send_json(HTTPStatus.OK, result)

    def send_json(self, status, result):
        body = json.dumps(result, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
    dist = Path(__file__).resolve().parent / 'dist'
    if not (dist / 'css' / 'tailwind.css').is_file():
        parser.error('Build the site first with npm run build')

    handler = partial(BookingHandler, directory=str(dist))
    with ThreadingHTTPServer(('127.0.0.1', args.port), handler) as server:
        print(f'Open http://127.0.0.1:{server.server_port}/', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == '__main__':
    main()
