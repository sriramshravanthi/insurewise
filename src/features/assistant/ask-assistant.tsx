"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Fact } from "@/schemas/fact";

export interface AskAssistantProps {
  facts: Fact[];
}

type Outcome =
  | { status: "answered"; answer: string; citedFactIds: string[] }
  | { status: "insufficient_data" }
  | { status: "safe_fallback" }
  | { status: "not_configured" }
  | { status: "error" };

// PRD AI-1: explains already-entered/computed data, grounded only in the
// `facts` passed in — never a free-form chat about anything else.
export function AskAssistant({ facts }: AskAssistantProps) {
  const [question, setQuestion] = useState("");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [loading, setLoading] = useState(false);

  const ask = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/v1/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, facts }),
      });
      if (!response.ok) {
        setOutcome({ status: "error" });
        return;
      }
      setOutcome((await response.json()) as Outcome);
    } catch {
      setOutcome({ status: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <h2 className="text-lg font-semibold">Ask the assistant</h2>
      <p className="text-sm text-muted-foreground">
        The assistant only explains what&apos;s shown above; it never
        recommends, ranks, or invents insurance facts.
      </p>
      <form onSubmit={ask} className="flex flex-col gap-2">
        <Label htmlFor="assistant-question">Your question</Label>
        <Input
          id="assistant-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          required
        />
        <Button type="submit" className="self-start" disabled={loading}>
          {loading ? "Asking..." : "Ask"}
        </Button>
      </form>

      {outcome?.status === "answered" && (
        <div className="flex flex-col gap-2 text-sm">
          <p>{outcome.answer}</p>
          {outcome.citedFactIds.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Based on: {outcome.citedFactIds.join(", ")}
            </p>
          )}
        </div>
      )}
      {outcome?.status === "insufficient_data" && (
        <p className="text-sm text-muted-foreground">
          Verified information isn&apos;t available for this yet.
        </p>
      )}
      {outcome?.status === "safe_fallback" && (
        <p className="text-sm text-muted-foreground">
          The assistant couldn&apos;t give a grounded answer to that. Try
          rephrasing, or see the review items above.
        </p>
      )}
      {outcome?.status === "not_configured" && (
        <p className="text-sm text-muted-foreground">
          The assistant isn&apos;t configured in this environment yet.
        </p>
      )}
      {outcome?.status === "error" && (
        <p className="text-sm text-muted-foreground">
          Something went wrong asking the assistant. Try again.
        </p>
      )}
    </div>
  );
}
