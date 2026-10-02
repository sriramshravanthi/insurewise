import type { NextConfig } from "next";

// docs/ARCHITECTURE.md §7: "strict CSP and security headers." The specific
// CSP policy is deferred to docs/SECURITY.md (listed in CLAUDE.md's doc
// map as "to come") — a nonce-based CSP is the correct way to allow Next's
// own inline hydration scripts without "unsafe-inline", and getting that
// wrong here (untested, no browser available) risks breaking hydration
// rather than fixing anything. These headers need no such app-specific
// tuning and are safe to ship now.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
