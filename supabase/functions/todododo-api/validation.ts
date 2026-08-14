import { HttpError } from './http.ts';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/u;
const MAX_BODY_BYTES = 16_384;

export type CredentialsInput = Readonly<{
  email: string;
  password: string;
}>;

export type CreateTaskInput = Readonly<{
  id: string;
  title: string;
  notes: string;
  dueDate: string | null;
}>;

export type UpdateTaskInput = Readonly<{
  title?: string;
  notes?: string;
  dueDate?: string | null;
  completed?: boolean;
}>;

function validationError(message: string): HttpError {
  return new HttpError(400, 'validation_error', message);
}

function expectObject(value: unknown): Record<string, unknown> {
  if (
    typeof value !== 'object' || value === null || Array.isArray(value)
  ) {
    throw validationError('A JSON object is required.');
  }

  return value as Record<string, unknown>;
}

function assertAllowedKeys(
  value: Record<string, unknown>,
  allowedKeys: readonly string[],
): void {
  const allowed = new Set(allowedKeys);
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    throw validationError('The request contains an unsupported field.');
  }
}

function parseTitle(value: unknown): string {
  if (typeof value !== 'string') {
    throw validationError('Title is required.');
  }

  const title = value.trim();
  if (title.length < 1 || title.length > 240) {
    throw validationError('Title must be between 1 and 240 characters.');
  }

  return title;
}

function parseNotes(value: unknown): string {
  if (typeof value !== 'string' || value.length > 5_000) {
    throw validationError('Notes must be at most 5000 characters.');
  }

  return value;
}

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function parseUuid(value: unknown, label = 'Task id'): string {
  if (typeof value !== 'string' || !isUuid(value)) {
    throw validationError(`${label} is invalid.`);
  }

  return value.toLowerCase();
}

export function parseIsoDate(value: unknown): string | null {
  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw validationError('Due date must use YYYY-MM-DD.');
  }

  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) {
    throw validationError('Due date must use YYYY-MM-DD.');
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw validationError('Due date is not a valid calendar date.');
  }

  return value;
}

export async function readJsonObject(
  request: Request,
): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';
  if (!contentType.startsWith('application/json')) {
    throw new HttpError(
      415,
      'unsupported_media_type',
      'Content-Type must be application/json.',
    );
  }

  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new HttpError(413, 'payload_too_large', 'Request body is too large.');
  }

  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
    throw new HttpError(413, 'payload_too_large', 'Request body is too large.');
  }

  try {
    return expectObject(JSON.parse(body));
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw validationError('Request body must be valid JSON.');
  }
}

export function parseCredentials(
  value: Record<string, unknown>,
): CredentialsInput {
  assertAllowedKeys(value, ['email', 'password']);
  if (typeof value.email !== 'string' || value.email.trim().length > 320) {
    throw validationError('A valid email address is required.');
  }

  const email = value.email.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    throw validationError('A valid email address is required.');
  }

  if (
    typeof value.password !== 'string' ||
    value.password.length < 6 ||
    value.password.length > 1_024
  ) {
    throw validationError('Password must be at least 6 characters.');
  }

  return { email, password: value.password };
}

export function parseCreateTask(
  value: Record<string, unknown>,
): CreateTaskInput {
  assertAllowedKeys(value, ['id', 'title', 'notes', 'dueDate']);
  return {
    id: parseUuid(value.id),
    title: parseTitle(value.title),
    notes: value.notes === undefined ? '' : parseNotes(value.notes),
    dueDate: value.dueDate === undefined ? null : parseIsoDate(value.dueDate),
  };
}

export function parseUpdateTask(
  value: Record<string, unknown>,
): UpdateTaskInput {
  assertAllowedKeys(value, ['title', 'notes', 'dueDate', 'completed']);
  if (Object.keys(value).length === 0) {
    throw validationError('At least one task field is required.');
  }

  const update: {
    title?: string;
    notes?: string;
    dueDate?: string | null;
    completed?: boolean;
  } = {};

  if ('title' in value) {
    update.title = parseTitle(value.title);
  }
  if ('notes' in value) {
    update.notes = parseNotes(value.notes);
  }
  if ('dueDate' in value) {
    update.dueDate = parseIsoDate(value.dueDate);
  }
  if ('completed' in value) {
    if (typeof value.completed !== 'boolean') {
      throw validationError('Completed must be a boolean.');
    }
    update.completed = value.completed;
  }

  return update;
}

export function parsePageSize(value: string | null): number {
  if (value === null) {
    return 50;
  }

  if (!/^\d+$/u.test(value)) {
    throw validationError('Limit must be an integer between 1 and 50.');
  }

  const limit = Number(value);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50) {
    throw validationError('Limit must be an integer between 1 and 50.');
  }

  return limit;
}

export function parseSearchQuery(value: string): string {
  const query = value.trim();
  if (query.length > 240) {
    throw validationError('Search query must be at most 240 characters.');
  }
  return query;
}

function encodeBase64Url(value: string): string {
  let binary = '';
  for (const byte of new TextEncoder().encode(value)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '');
}

function decodeBase64Url(value: string): string {
  if (value.length > 512 || !/^[A-Za-z0-9_-]+$/u.test(value)) {
    throw validationError('Cursor is invalid.');
  }

  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  try {
    const binary = atob(
      value.replaceAll('-', '+').replaceAll('_', '/') + padding,
    );
    return new TextDecoder().decode(
      Uint8Array.from(binary, (character) => character.charCodeAt(0)),
    );
  } catch {
    throw validationError('Cursor is invalid.');
  }
}

export function encodeCursor(cursor: { createdAt: string; id: string }): string {
  return encodeBase64Url(JSON.stringify(cursor));
}

export function parseCursor(
  value: string | null,
): { createdAt: string; id: string } | null {
  if (value === null) {
    return null;
  }

  let cursor: unknown;
  try {
    cursor = JSON.parse(decodeBase64Url(value));
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw validationError('Cursor is invalid.');
  }
  const object = expectObject(cursor);
  assertAllowedKeys(object, ['createdAt', 'id']);
  if (typeof object.createdAt !== 'string') {
    throw validationError('Cursor is invalid.');
  }

  const timestamp = new Date(object.createdAt);
  if (Number.isNaN(timestamp.getTime())) {
    throw validationError('Cursor is invalid.');
  }

  return {
    createdAt: timestamp.toISOString(),
    id: parseUuid(object.id, 'Cursor id'),
  };
}
