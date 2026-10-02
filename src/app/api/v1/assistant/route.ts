import { NextResponse } from "next/server";
import { AssistantRequestSchema } from "@/schemas/assistant-request";
import { buildFactPacket } from "@/ai/fact-packet";
import { explain } from "@/ai/explain";
import { createAnthropicProvider } from "@/ai/anthropic-provider";
import { checkRateLimit } from "@/lib/rate-limit";

// docs/ARCHITECTURE.md §6: "REST-like JSON under /api/v1; Zod input/output
// validation; error format RFC 7807 problem details... per-user and
// per-IP rate limits on write and assistant endpoints." This is the one
// seam where /src/ai (no secrets, no DB) meets /src/lib (rate limiting) —
// the composition the module table forbids ai from doing itself.

function problem(status: number, code: string, title: string) {
  return NextResponse.json(
    { type: "about:blank", title, status, code },
    { status, headers: { "Content-Type": "application/problem+json" } },
  );
}

export async function POST(request: Request): Promise<Response> {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateLimit = checkRateLimit(`assistant:${ip}`);
  if (!rateLimit.allowed) {
    return problem(429, "rate_limited", "Too many assistant requests. Try again shortly.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return problem(400, "invalid_json", "Request body must be JSON.");
  }

  const parsed = AssistantRequestSchema.safeParse(body);
  if (!parsed.success) {
    return problem(400, "invalid_request", "Request failed validation.");
  }

  // docs/ARCHITECTURE.md §8: "AI provider down... -> Assistant shows a
  // safe fallback... the rest of the app is unaffected." No live Anthropic
  // project exists in this environment, so this is the common path here.
  const provider = createAnthropicProvider();
  if (!provider) {
    return NextResponse.json({ status: "not_configured" });
  }

  const factPacket = buildFactPacket(parsed.data.facts);
  const outcome = await explain(factPacket, parsed.data.question, provider);
  return NextResponse.json(outcome);
}
