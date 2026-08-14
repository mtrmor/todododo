import { HttpError } from './http.ts';
import {
  encodeCursor,
  parseCreateTask,
  parseCursor,
  parseIsoDate,
  parsePageSize,
  parseUpdateTask,
} from './validation.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertThrowsHttpError(operation: () => unknown): void {
  try {
    operation();
  } catch (error) {
    assert(error instanceof HttpError, 'expected an HttpError');
    return;
  }
  throw new Error('expected operation to throw');
}

Deno.test('task creation validates ids, trims titles, and supplies defaults', () => {
  const task = parseCreateTask({
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    title: '  Quiet route  ',
  });
  assert(
    task.id === 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'id should be preserved',
  );
  assert(task.title === 'Quiet route', 'title should be trimmed');
  assert(task.notes === '', 'notes should default to empty');
  assert(task.dueDate === null, 'due date should default to null');
});

Deno.test('calendar date validation rejects rollover dates', () => {
  assert(parseIsoDate('2028-02-29') === '2028-02-29', 'leap date is valid');
  assertThrowsHttpError(() => parseIsoDate('2027-02-29'));
});

Deno.test('task updates reject unknown and empty payloads', () => {
  assertThrowsHttpError(() => parseUpdateTask({}));
  assertThrowsHttpError(() => parseUpdateTask({ userId: 'not-allowed' }));
});

Deno.test('pagination validates page sizes and complete cursors', () => {
  assert(parsePageSize(null) === 50, 'default page size should be 50');
  assertThrowsHttpError(() => parsePageSize('51'));
  assertThrowsHttpError(() => parseCursor('not-a-cursor'));
  const encoded = encodeCursor({
    createdAt: '2026-01-01T00:00:00Z',
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  });
  assert(!encoded.includes('='), 'cursor should be URL-safe without padding');
  const cursor = parseCursor(encoded);
  assert(cursor?.createdAt === '2026-01-01T00:00:00.000Z', 'cursor normalizes');
});
