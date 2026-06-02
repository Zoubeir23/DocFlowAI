import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const appSecurityHeaders = [
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      // Allow images from Supabase storage, Google user avatars, and common CDNs
      "img-src 'self' data: blob: https://*.supabase.co https://polygonscan.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://polygon-rpc.com https://rpc.ankr.com https://*.sentry.io https://meet.jit.si wss://meet.jit.si",
      // Web workers for Next.js/Sentry
      "worker-src 'self' blob:",
      // 'self' for widget preview + meet.jit.si for teleconsultation
      "frame-src 'self' https://meet.jit.si",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; "),
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

// Widget pages must be embeddable on third-party sites — override framing headers
const widgetHeaders = [
  {
    key: "X-Frame-Options",
    value: "ALLOWALL",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co https:",
      "connect-src 'self' https://*.supabase.co https://api.anthropic.com https://*.sentry.io",
      "worker-src 'self' blob:",
      // Allow embedding from any origin
      "frame-ancestors *",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; "),
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      // Widget routes — must come before the catch-all so they take precedence
      {
        source: "/widget/:path*",
        headers: widgetHeaders,
      },
      // All other routes
      {
        source: "/((?!widget).*)",
        headers: appSecurityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

const sentryConfig = {
  org: "isi-of",
  project: "docflowia",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  // Never fail the build on Sentry errors (missing project, network issues, etc.)
  errorHandler: (err: Error) => {
    console.warn("[Sentry] Build warning (non-fatal):", err.message);
  },
  webpack: {
    automaticVercelMonitors: true,
    treeshake: { removeDebugLogging: true },
  },
};

export default withSentryConfig(withNextIntl(nextConfig), sentryConfig);
