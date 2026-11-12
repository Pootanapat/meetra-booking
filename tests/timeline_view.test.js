import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(
    __dirname,
    '..',
    'dashboard',
    'dashboard',
    'js',
    'TimelineView.js',
);
const source = fs.readFileSync(sourcePath, 'utf8');
const context = vm.createContext({});
vm.runInContext(`${source}\nglobalThis.TimelineView = TimelineView;`, context);
const { TimelineView } = context;

test('cancelled bookings do not block timeline availability', () => {
    assert.equal(TimelineView.isCancelled({ status: 'cancelled' }), true);
    assert.equal(TimelineView.isCancelled({ status: 'ยกเลิกแล้ว' }), true);
    assert.equal(TimelineView.isCancelled({ status: 'ยืนยันแล้ว' }), false);
});

function makeSlot(index, room, next) {
    return {
        dataset: { index: String(index) },
        closest: () => ({ dataset: { room } }),
        parentElement: {
            querySelector: () => next,
        },
        focus() {
            this.focused = true;
        },
    };
}

function makeTimeline(selection = null) {
    const timeline = Object.create(TimelineView.prototype);
    timeline.selection = selection;
    timeline.selectSlot = slot => {
        timeline.selection = {
            room: slot.closest('.slots').dataset.room,
            start: Number(slot.dataset.index),
            end: Number(slot.dataset.index),
        };
    };
    timeline.extendSelection = slot => {
        if (timeline.selection) {
            timeline.selection.end = Number(slot.dataset.index);
        }
    };
    return timeline;
}

function pressShiftArrow(timeline, slot, key) {
    let prevented = false;
    timeline.handleKeydown({
        key,
        shiftKey: true,
        target: { closest: () => slot },
        preventDefault() {
            prevented = true;
        },
    });
    return prevented;
}

test('Shift+Arrow selects and extends a time range', () => {
    const next = makeSlot(4, '701');
    const slot = makeSlot(3, '701', next);
    const timeline = makeTimeline();

    assert.equal(pressShiftArrow(timeline, slot, 'ArrowRight'), true);
    assert.deepEqual(timeline.selection, { room: '701', start: 3, end: 4 });
    assert.equal(next.focused, true);
});

test('Shift+Arrow starts a new range in a different room', () => {
    const next = makeSlot(6, '702');
    const slot = makeSlot(5, '702', next);
    const timeline = makeTimeline({ room: '701', start: 1, end: 2 });

    pressShiftArrow(timeline, slot, 'ArrowRight');

    assert.deepEqual(timeline.selection, { room: '702', start: 5, end: 6 });
});

test('an arrow key without Shift only moves focus', () => {
    const next = makeSlot(2, '701');
    const slot = makeSlot(1, '701', next);
    const timeline = makeTimeline();

    timeline.handleKeydown({
        key: 'ArrowRight',
        shiftKey: false,
        target: { closest: () => slot },
        preventDefault() {},
    });

    assert.equal(timeline.selection, null);
    assert.equal(next.focused, true);
});
