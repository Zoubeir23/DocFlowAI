const SENSITIVE_KEY_PATTERN = /(patient|email|phone|password|token|authorization|cookie|medical|diagnos)/i;

function scrubObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      delete result[key];
    }
  }
  return result;
}

/**
 * Retire les cookies, headers d'auth et champs PII médicaux d'un événement
 * Sentry avant envoi — l'application traite des données de santé (diagnostics,
 * dossiers patients) et sendDefaultPii ne doit pas les faire remonter telles quelles.
 * Typé de façon structurelle pour rester compatible avec l'ErrorEvent de
 * @sentry/nextjs sans dépendre d'un nom de type précis côté SDK.
 */
export function scrubSentryEvent<
  TEvent extends {
    request?: { cookies?: unknown; headers?: Record<string, unknown> } | null;
    extra?: Record<string, unknown> | null;
    contexts?: Record<string, Record<string, unknown> | undefined> | null;
  },
>(event: TEvent): TEvent {
  if (event.request) {
    const { cookies: _cookies, ...restRequest } = event.request;
    event.request = restRequest;
    if (event.request.headers) {
      const { authorization: _authorization, cookie: _cookie, ...restHeaders } = event.request.headers;
      event.request.headers = restHeaders;
    }
  }

  if (event.extra) {
    event.extra = scrubObject(event.extra);
  }

  if (event.contexts) {
    for (const key of Object.keys(event.contexts)) {
      const context = event.contexts[key];
      if (context) {
        event.contexts[key] = scrubObject(context);
      }
    }
  }

  return event;
}
