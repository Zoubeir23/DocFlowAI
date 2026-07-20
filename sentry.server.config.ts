// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "@/lib/security/sentry-scrub";

Sentry.init({
  dsn: "https://0eb4aa5642b50e31a98e805885a8144b@o4511429080449024.ingest.de.sentry.io/4511486838112336",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // sendDefaultPii désactivé : application médicale, pas d'IP/cookies/headers
  // d'auth par défaut sur des endpoints qui manipulent des données patients.
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: false,

  beforeSend: (event) => scrubSentryEvent(event),
});
