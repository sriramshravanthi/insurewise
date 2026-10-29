import { beforeEach, describe, expect, it } from "vitest";
import { resetRateLimit } from "@/lib/rate-limit";
import { POST } from "@/app/api/v1/assistant/route";

function postRequest(body: unknown, ip = "1.2.3.4"): Request {
  return new Request("http://localhost/api/v1/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  resetRateLimit();
});

describe("POST /api/v1/assistant (docs/ARCHITECTURE.md §6)", () => {
  it("rejects a request that fails Zod validation with a problem+json body", async () => {
    const response = await POST(postRequest({ question: "" }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("invalid_request");
  });

  it("rejects a body that isn't JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/v1/assistant", {
        method: "POST",
        body: "not json",
        headers: { "x-forwarded-for": "9.9.9.9" },
      }),
    );
    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe("invalid_json");
  });

  it('reports "not_configured" when there is no live Anthropic project (this environment\'s default)', async () => {
    const response = await POST(
      postRequest({ question: "What does this mean?", facts: [] }, "5.5.5.5"),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "not_configured" });
  });

  it("rate-limits repeated requests from the same IP (PRD AI-5)", async () => {
    const ip = "7.7.7.7";
    for (let i = 0; i < 10; i++) {
      const response = await POST(postRequest({ question: "Q", facts: [] }, ip));
      expect(response.status).toBe(200);
    }
    const limited = await POST(postRequest({ question: "Q", facts: [] }, ip));
    expect(limited.status).toBe(429);
    expect((await limited.json()).code).toBe("rate_limited");
  });

  it("tracks rate limits per IP independently", async () => {
    for (let i = 0; i < 10; i++) {
      await POST(postRequest({ question: "Q", facts: [] }, "8.8.8.8"));
    }
    const otherIp = await POST(postRequest({ question: "Q", facts: [] }, "8.8.8.9"));
    expect(otherIp.status).toBe(200);
  });
});
