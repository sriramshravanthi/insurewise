import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

// docs/ARCHITECTURE.md §7: "strict CSP and security headers." Confirms
// the headers Next.js will actually attach to every response, without
// needing a running server.
describe("next.config headers (docs/ARCHITECTURE.md §7)", () => {
  it("applies baseline security headers to every route", async () => {
    const headerRules = await nextConfig.headers?.();
    expect(headerRules).toBeDefined();
    const rule = headerRules?.find((r) => r.source === "/:path*");
    expect(rule).toBeDefined();

    const headerMap = Object.fromEntries(
      (rule?.headers ?? []).map((h) => [h.key, h.value]),
    );
    expect(headerMap["X-Content-Type-Options"]).toBe("nosniff");
    expect(headerMap["X-Frame-Options"]).toBe("DENY");
    expect(headerMap["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headerMap["Permissions-Policy"]).toContain("camera=()");
  });
});
