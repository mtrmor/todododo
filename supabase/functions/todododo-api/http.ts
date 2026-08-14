export type ResponseState = {
  headers: Headers;
  setCookies: string[];
};

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly publicMessage: string,
  ) {
    super(publicMessage);
  }
}

export function createResponseState(): ResponseState {
  return { headers: new Headers(), setCookies: [] };
}

function responseHeaders(state: ResponseState): Headers {
  const headers = new Headers(state.headers);
  headers.set('Cache-Control', 'private, no-store');
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Pragma', 'no-cache');
  headers.set('X-Content-Type-Options', 'nosniff');

  for (const cookie of state.setCookies) {
    headers.append('Set-Cookie', cookie);
  }

  return headers;
}

export function jsonResponse(
  state: ResponseState,
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders(state),
  });
}

export function emptyResponse(
  state: ResponseState,
  status = 204,
): Response {
  const headers = responseHeaders(state);
  headers.delete('Content-Type');
  return new Response(null, { status, headers });
}

export function errorResponse(
  state: ResponseState,
  error: unknown,
): Response {
  if (error instanceof HttpError) {
    return jsonResponse(
      state,
      { code: error.code, message: error.publicMessage },
      error.status,
    );
  }

  return jsonResponse(
    state,
    { code: 'internal_error', message: 'The request could not be completed.' },
    500,
  );
}

export function methodNotAllowed(
  state: ResponseState,
  allowedMethods: readonly string[],
): Response {
  state.headers.set('Allow', allowedMethods.join(', '));
  return errorResponse(
    state,
    new HttpError(405, 'method_not_allowed', 'Method not allowed.'),
  );
}
