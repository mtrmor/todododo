import { type AppConfig, loadConfig } from './config.ts';
import {
  createResponseState,
  emptyResponse,
  errorResponse,
  HttpError,
  jsonResponse,
  methodNotAllowed,
  type ResponseState,
} from './http.ts';
import {
  applyCorsForAllowedOrigin,
  clearCsrfCookie,
  csrfTokenForSession,
  requireCookieMutationProtection,
} from './security.ts';
import {
  authenticatedUser,
  createRequestSupabase,
  optionalUser,
  type RequestSupabase,
  toSafeUser,
} from './supabase-client.ts';
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  searchTasks,
  taskSummary,
  updateTask,
} from './tasks.ts';
import {
  parseCreateTask,
  parseCredentials,
  parseCursor,
  parsePageSize,
  parseSearchQuery,
  parseUpdateTask,
  parseUuid,
  readJsonObject,
} from './validation.ts';

const API_PREFIX = '/v1';

export function routePath(request: Request): string {
  const pathname = new URL(request.url).pathname;
  const prefixIndex = pathname.lastIndexOf(API_PREFIX);
  return prefixIndex < 0 ? pathname : pathname.slice(prefixIndex);
}

function ensureEmptyBody(body: Record<string, unknown>): void {
  if (Object.keys(body).length > 0) {
    throw new HttpError(
      400,
      'validation_error',
      'This request does not accept fields.',
    );
  }
}

async function ensureOptionalEmptyJson(request: Request): Promise<void> {
  if (request.body === null) {
    return;
  }

  ensureEmptyBody(await readJsonObject(request));
}

async function protectMutation(
  request: Request,
  supabase: RequestSupabase,
  config: AppConfig,
): Promise<void> {
  if (supabase.mode === 'cookie') {
    await requireCookieMutationProtection(request, config);
  }
}

function authFailure(message: string, status = 400): HttpError {
  return new HttpError(status, 'auth_error', message);
}

async function sessionResponse(
  request: Request,
  state: ResponseState,
  config: AppConfig,
): Promise<Response> {
  const supabase = createRequestSupabase(request, state, config);
  const user = await optionalUser(supabase);
  const csrfToken = supabase.mode === 'cookie'
    ? await csrfTokenForSession(request, state, config)
    : null;

  return jsonResponse(state, {
    user: user ? toSafeUser(user) : null,
    csrfToken,
  });
}

async function signUpResponse(
  request: Request,
  state: ResponseState,
  config: AppConfig,
): Promise<Response> {
  await requireCookieMutationProtection(request, config);
  const body = parseCredentials(await readJsonObject(request));
  const supabase = createRequestSupabase(request, state, config, false);
  const { data, error } = await supabase.client.auth.signUp(body);

  if (error || !data.user) {
    throw authFailure('The account could not be created.');
  }

  return jsonResponse(
    state,
    {
      user: toSafeUser(data.user),
      requiresEmailConfirmation: data.session === null,
    },
    201,
  );
}

async function signInResponse(
  request: Request,
  state: ResponseState,
  config: AppConfig,
): Promise<Response> {
  await requireCookieMutationProtection(request, config);
  const body = parseCredentials(await readJsonObject(request));
  const supabase = createRequestSupabase(request, state, config, false);
  const { data, error } = await supabase.client.auth.signInWithPassword(body);

  if (error || !data.user) {
    throw authFailure('Invalid email or password.', 401);
  }

  return jsonResponse(state, { user: toSafeUser(data.user) });
}

async function signOutResponse(
  request: Request,
  state: ResponseState,
  config: AppConfig,
): Promise<Response> {
  const supabase = createRequestSupabase(request, state, config);
  await protectMutation(request, supabase, config);
  await ensureOptionalEmptyJson(request);
  await authenticatedUser(supabase);

  const { error } = await supabase.client.auth.signOut({ scope: 'local' });

  if (error) {
    throw authFailure('The session could not be closed.');
  }

  if (supabase.mode === 'cookie') {
    clearCsrfCookie(state, config);
  }

  return jsonResponse(state, { ok: true });
}

async function taskCollectionResponse(
  request: Request,
  state: ResponseState,
  config: AppConfig,
): Promise<Response> {
  const supabase = createRequestSupabase(request, state, config);
  const user = await authenticatedUser(supabase);

  if (request.method === 'POST') {
    await protectMutation(request, supabase, config);
    const input = parseCreateTask(await readJsonObject(request));
    return jsonResponse(
      state,
      await createTask(supabase.client, user.id, input),
      201,
    );
  }

  if (request.method !== 'GET') {
    return methodNotAllowed(state, ['GET', 'POST']);
  }

  const url = new URL(request.url);
  const cursor = parseCursor(url.searchParams.get('cursor'));
  const pageSize = parsePageSize(url.searchParams.get('limit'));
  const page = url.searchParams.has('q')
    ? await searchTasks(
      supabase.client,
      parseSearchQuery(url.searchParams.get('q') ?? ''),
      cursor,
      pageSize,
    )
    : await listTasks(supabase.client, cursor, pageSize);

  return jsonResponse(state, page);
}

async function taskItemResponse(
  request: Request,
  state: ResponseState,
  config: AppConfig,
  rawTaskId: string,
): Promise<Response> {
  const taskId = parseUuid(rawTaskId);
  const supabase = createRequestSupabase(request, state, config);
  await authenticatedUser(supabase);

  if (request.method === 'GET') {
    return jsonResponse(state, await getTask(supabase.client, taskId));
  }

  if (request.method === 'PATCH') {
    await protectMutation(request, supabase, config);
    const input = parseUpdateTask(await readJsonObject(request));
    return jsonResponse(state, await updateTask(supabase.client, taskId, input));
  }

  if (request.method === 'DELETE') {
    await protectMutation(request, supabase, config);
    await ensureOptionalEmptyJson(request);
    await deleteTask(supabase.client, taskId);
    return emptyResponse(state);
  }

  return methodNotAllowed(state, ['GET', 'PATCH', 'DELETE']);
}

async function summaryResponse(
  request: Request,
  state: ResponseState,
  config: AppConfig,
): Promise<Response> {
  if (request.method !== 'GET') {
    return methodNotAllowed(state, ['GET']);
  }

  const supabase = createRequestSupabase(request, state, config);
  await authenticatedUser(supabase);
  return jsonResponse(state, await taskSummary(supabase.client));
}

async function dispatch(
  request: Request,
  state: ResponseState,
  config: AppConfig,
): Promise<Response> {
  const path = routePath(request);

  if (path === `${API_PREFIX}/session`) {
    return request.method === 'GET'
      ? await sessionResponse(request, state, config)
      : methodNotAllowed(state, ['GET']);
  }

  if (path === `${API_PREFIX}/auth/sign-up`) {
    return request.method === 'POST'
      ? await signUpResponse(request, state, config)
      : methodNotAllowed(state, ['POST']);
  }

  if (path === `${API_PREFIX}/auth/sign-in`) {
    return request.method === 'POST'
      ? await signInResponse(request, state, config)
      : methodNotAllowed(state, ['POST']);
  }

  if (path === `${API_PREFIX}/auth/sign-out`) {
    return request.method === 'POST'
      ? await signOutResponse(request, state, config)
      : methodNotAllowed(state, ['POST']);
  }

  if (path === `${API_PREFIX}/tasks/summary`) {
    return await summaryResponse(request, state, config);
  }

  if (path === `${API_PREFIX}/tasks`) {
    return await taskCollectionResponse(request, state, config);
  }

  const taskMatch = new RegExp(`^${API_PREFIX}/tasks/([^/]+)$`, 'u').exec(path);

  if (taskMatch) {
    return await taskItemResponse(
      request,
      state,
      config,
      taskMatch[1],
    );
  }

  throw new HttpError(404, 'not_found', 'Endpoint not found.');
}

function rejectDisallowedPreflight(
  request: Request,
  config: AppConfig,
): void {
  const origin = request.headers.get('origin');

  if (origin && !config.allowedOrigins.has(origin)) {
    throw new HttpError(403, 'invalid_origin', 'Request origin is not allowed.');
  }
}

export async function handleRequest(request: Request): Promise<Response> {
  const state = createResponseState();

  try {
    const config = loadConfig();
    applyCorsForAllowedOrigin(request, state, config);

    if (request.method === 'OPTIONS') {
      rejectDisallowedPreflight(request, config);
      return emptyResponse(state);
    }

    return await dispatch(request, state, config);
  } catch (error) {
    return errorResponse(state, error);
  }
}
