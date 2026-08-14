import { routePath } from './handler.ts';

function assertEquals(actual: unknown, expected: unknown): void {
  if (actual !== expected) {
    throw new Error(`Expected ${String(expected)}, received ${String(actual)}`);
  }
}

Deno.test('route extraction strips the Supabase function prefix', () => {
  assertEquals(
    routePath(
      new Request(
        'https://project.supabase.co/functions/v1/todododo-api/v1/tasks?limit=50',
      ),
    ),
    '/v1/tasks',
  );
});
