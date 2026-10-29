"use client";

/**
 * /dashboard/assistant — Ask AI page.
 *
 * A simple Q&A interface where the user picks a topic and gets an
 * educational explanation. Powered by the engine calculators plus
 * static educational content — no external AI calls.
 *
 * Design: topic cards → detail panel with explanation and optional
 * mini calculator. Keeps things self-contained and fast.
 */

import { useState } from "react";
import { Bot, ChevronRight, ArrowLeft, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { c4DeductibleTradeoff, c5BreakEven } from "@/engine/c4-deductible-tradeoff";
import { c1AnnualizedPremium } from "@/engine/c1-annualized-premium";
import { c10CoverageRatios, c11RebuildEstimate } from "@/engine/c10-c11-home-ratios";
import { formatCents, parseDollarsToCents } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Topic definitions
// ---------------------------------------------------------------------------

type TopicId =
  | "what-is-deductible"
  | "annual-premium"
  | "liability-limits"
  | "rebuild-estimate"
  | "bundling"
  | "coverage-gaps"
  | "term-vs-installment"
  | "home-coverages";

interface Topic {
  id: TopicId;
  title: string;
  summary: string;
  tag: "Car" | "Home" | "General";
}

const TOPICS: Topic[] = [
  {
    id: "what-is-deductible",
    title: "How does a deductible affect my premium?",
    summary: "Understand the trade-off between deductible and annual cost.",
    tag: "General",
  },
  {
    id: "annual-premium",
    title: "How do I compare premiums paid on different schedules?",
    summary: "Convert monthly, semi-annual, or per-term payments to an annual figure.",
    tag: "General",
  },
  {
    id: "liability-limits",
    title: "How much liability coverage do I need?",
    summary: "Learn how liability limits work and how to think about the right amount.",
    tag: "Car",
  },
  {
    id: "rebuild-estimate",
    title: "How do I estimate my home's rebuild cost?",
    summary: "Calculate a rough rebuild figure and compare it to your Coverage A.",
    tag: "Home",
  },
  {
    id: "bundling",
    title: "Does bundling car and home insurance always save money?",
    summary: "Not always — here is how to check with your actual quotes.",
    tag: "General",
  },
  {
    id: "coverage-gaps",
    title: "What are the most common home insurance gaps?",
    summary: "Flood, earthquake, ACV vs. RCV, and scheduled property.",
    tag: "Home",
  },
  {
    id: "term-vs-installment",
    title: "What is the difference between paying per term vs. monthly?",
    summary: "Installment fees add up — here's how to calculate the true annual cost.",
    tag: "Car",
  },
  {
    id: "home-coverages",
    title: "What do the six home coverages actually cover?",
    summary: "Coverage A through F explained in plain English.",
    tag: "Home",
  },
];

// ---------------------------------------------------------------------------
// Topic detail panels
// ---------------------------------------------------------------------------

function DeductiblePanel() {
  const [lowDed, setLowDed] = useState("");
  const [lowPrem, setLowPrem] = useState("");
  const [highDed, setHighDed] = useState("");
  const [highPrem, setHighPrem] = useState("");

  const ldCents = parseDollarsToCents(lowDed);
  const lpCents = parseDollarsToCents(lowPrem);
  const hdCents = parseDollarsToCents(highDed);
  const hpCents = parseDollarsToCents(highPrem);

  const canCalc =
    ldCents != null &&
    lpCents != null &&
    hdCents != null &&
    hpCents != null &&
    hdCents > ldCents &&
    lpCents > hpCents;

  const tradeoff = canCalc
    ? c4DeductibleTradeoff({
        dLowCents: ldCents!,
        pLowAnnualCents: lpCents!,
        dHighCents: hdCents!,
        pHighAnnualCents: hpCents!,
      })
    : null;

  const breakeven = canCalc
    ? c5BreakEven({
        dLowCents: ldCents!,
        pLowAnnualCents: lpCents!,
        dHighCents: hdCents!,
        pHighAnnualCents: hpCents!,
      })
    : null;

  const t = tradeoff?.status === "ok" ? tradeoff.value : null;
  const be = breakeven?.status === "ok" ? breakeven.value : null;

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
        <p>
          A <strong className="text-foreground">deductible</strong> is the
          amount you pay out-of-pocket when you file a claim, before your
          insurer pays the rest. Choosing a higher deductible lowers your
          annual premium — but means you absorb more cost if you have a claim.
        </p>
        <p>
          The break-even question: <em>How many claim-free years does it
          take for the premium savings to offset the extra risk I am
          taking on?</em> If the break-even is 3 years but you typically
          go claim-free for 5+, a higher deductible often makes financial
          sense.
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        <p className="text-sm font-medium">Try it with your numbers</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4 space-y-3">
            <Badge variant="secondary" className="text-xs">Lower deductible</Badge>
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-xs">Deductible ($)</Label>
                <Input value={lowDed} onChange={(e) => setLowDed(e.target.value)} placeholder="e.g. 500" className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Annual premium ($)</Label>
                <Input value={lowPrem} onChange={(e) => setLowPrem(e.target.value)} placeholder="e.g. 1800" className="h-8 text-sm" />
              </div>
            </div>
          </div>
          <div className="rounded-lg border p-4 space-y-3">
            <Badge variant="outline" className="text-xs">Higher deductible</Badge>
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-xs">Deductible ($)</Label>
                <Input value={highDed} onChange={(e) => setHighDed(e.target.value)} placeholder="e.g. 1000" className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Annual premium ($)</Label>
                <Input value={highPrem} onChange={(e) => setHighPrem(e.target.value)} placeholder="e.g. 1600" className="h-8 text-sm" />
              </div>
            </div>
          </div>
        </div>

        {!canCalc && (lowDed || lowPrem || highDed || highPrem) && (
          <p className="text-xs text-muted-foreground">
            The higher deductible must be larger than the lower one, and the
            lower deductible must have the higher premium.
          </p>
        )}

        {t && be && (
          <div className="divide-y rounded-lg border px-4">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">Annual premium savings</span>
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatCents(t.annualPremiumDifferenceCents)}/yr
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">Extra out-of-pocket at claim</span>
              <span className="text-sm tabular-nums">{formatCents(t.extraOutOfPocketIfClaimCents)}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium">Break-even</span>
              <span className="text-sm font-semibold tabular-nums">
                {`${be.breakEvenYears.toFixed(1)} years claim-free`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AnnualPremiumPanel() {
  const [amount, setAmount] = useState("");
  const [basis, setBasis] = useState<"per_term" | "per_installment">("per_term");
  const [termMonths, setTermMonths] = useState<6 | 12>(6);
  const [installments, setInstallments] = useState<12>(12);

  const amountCents = parseDollarsToCents(amount);

  const result =
    amountCents != null
      ? c1AnnualizedPremium({
          amountCents,
          amountBasis: basis,
          ...(basis === "per_term" ? { termMonths } : { installmentsPerYear: installments }),
        })
      : null;

  const annual = result?.status === "ok" ? result.value.annualCents : null;

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
        <p>
          Insurers present premiums in different ways: as a single annual
          figure, as a per-term amount (e.g., $900 every 6 months), or as
          monthly installments. To compare policies fairly, you need to
          normalize everything to one annual number.
        </p>
        <p>
          Watch out for installment fees. If your insurer charges $5/month
          to split payments, that is $60/year added to your cost.
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        <p className="text-sm font-medium">Convert your premium</p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Premium amount ($)</Label>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 900" className="h-8 text-sm sm:max-w-[200px]" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={basis === "per_term" && termMonths === 6 ? "default" : "outline"}
              size="sm"
              onClick={() => { setBasis("per_term"); setTermMonths(6); }}
              className="h-8 text-xs"
            >
              Per 6-month term
            </Button>
            <Button
              type="button"
              variant={basis === "per_term" && termMonths === 12 ? "default" : "outline"}
              size="sm"
              onClick={() => { setBasis("per_term"); setTermMonths(12); }}
              className="h-8 text-xs"
            >
              Per 12-month term
            </Button>
            <Button
              type="button"
              variant={basis === "per_installment" ? "default" : "outline"}
              size="sm"
              onClick={() => { setBasis("per_installment"); setInstallments(12); }}
              className="h-8 text-xs"
            >
              Per month (×12)
            </Button>
          </div>
          {annual != null && (
            <div className="flex items-center gap-3 rounded-md bg-muted/50 px-4 py-3">
              <span className="text-sm text-muted-foreground">Annualized premium</span>
              <span className="ml-auto text-lg font-bold tabular-nums">
                {formatCents(annual)}
                <span className="text-sm font-normal text-muted-foreground">/yr</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LiabilityPanel() {
  return (
    <div className="text-sm text-muted-foreground leading-relaxed space-y-4">
      <p>
        Auto liability coverage pays for <strong className="text-foreground">bodily injury and property damage you
        cause to others</strong>. It does not pay for your own injuries or
        vehicle damage — that is what health insurance, MedPay, collision, and
        comp are for.
      </p>
      <p>
        California&apos;s minimum limits are 15/30/5: $15,000 per injured person,
        $30,000 per accident total, $5,000 property damage. These minimums are
        widely considered inadequate — a single ER visit can exceed $15,000.
      </p>
      <div className="rounded-lg border p-4 space-y-2">
        <p className="text-sm font-medium text-foreground">Rule of thumb</p>
        <p>
          Carry liability limits at least equal to your net worth (assets minus
          debts). If you are sued for more than your limits, you pay the excess
          personally. An umbrella policy extends your limits cheaply.
        </p>
      </div>
      <p>
        Common limit choices beyond minimum: 50/100/25, 100/300/100,
        250/500/100. State Farm, GEICO, and most carriers offer 250/500 or
        higher. The marginal cost of higher limits is often small relative to
        the added protection.
      </p>
      <p className="text-xs">
        InsureWise does not calculate recommended limits — that is a financial
        planning question best answered with a licensed agent who knows your
        full balance sheet.
      </p>
    </div>
  );
}

function RebuildPanel() {
  const [sqFt, setSqFt] = useState("");
  const [costPerSqFt, setCostPerSqFt] = useState("");
  const [covA, setCovA] = useState("");

  const sqFtNum = parseFloat(sqFt);
  const costCents = parseDollarsToCents(costPerSqFt) ?? 0;
  const covACents = parseDollarsToCents(covA);

  const c11 =
    sqFtNum > 0 && costCents > 0
      ? c11RebuildEstimate({ squareFeet: sqFtNum, costPerSqFtCents: costCents })
      : null;
  const rebuildCents = c11?.status === "ok" ? c11.value.rebuildEstimateCents : undefined;

  const c10 =
    covACents != null && rebuildCents != null
      ? c10CoverageRatios({
          coverageACents: covACents,
          ...(rebuildCents != null ? { rebuildEstimateCents: rebuildCents } : {}),
          rebuildEstimateProvenance: "Illustrative",
        })
      : null;
  const ratio = c10?.status === "ok" ? c10.value.dwellingVsRebuildPct : null;

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
        <p>
          Your Coverage A (Dwelling) should reflect how much it would cost to
          rebuild your home from the ground up — not its sale price, which
          includes land value.
        </p>
        <p>
          A rough rule: multiply your home&apos;s heated square footage by the
          local cost per square foot to build. In California, that figure
          ranges widely by region and construction type — a simple single-story
          might be $250/sq ft, while a custom build could be $500+/sq ft.
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        <p className="text-sm font-medium">Rough estimate calculator</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Sq ft</Label>
            <Input value={sqFt} onChange={(e) => setSqFt(e.target.value)} placeholder="e.g. 1800" className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Cost/sq ft ($)</Label>
            <Input value={costPerSqFt} onChange={(e) => setCostPerSqFt(e.target.value)} placeholder="e.g. 250" className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Your Coverage A ($)</Label>
            <Input value={covA} onChange={(e) => setCovA(e.target.value)} placeholder="e.g. 400000" className="h-8 text-sm" />
          </div>
        </div>
        {rebuildCents != null && (
          <div className="divide-y rounded-lg border px-4">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">Illustrative rebuild estimate</span>
              <span className="text-sm font-medium tabular-nums">{formatCents(rebuildCents)}</span>
            </div>
            {ratio != null && (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">Coverage A vs. rebuild</span>
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    ratio >= 90
                      ? "text-emerald-600 dark:text-emerald-400"
                      : ratio >= 70
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-destructive"
                  }`}
                >
                  {ratio.toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Rebuild cost varies by location, materials, and labor — this is a
          rough illustration only. Consult a contractor or appraiser for a
          reliable figure.
        </p>
      </div>
    </div>
  );
}

function BundlingPanel() {
  return (
    <div className="text-sm text-muted-foreground leading-relaxed space-y-4">
      <p>
        <strong className="text-foreground">Multi-policy discounts</strong>{" "}
        (bundling) can reduce your combined premium, but they don&apos;t always
        produce the lowest total cost. An insurer offering a 10% bundle
        discount may still charge more than buying each policy from the
        cheapest specialist.
      </p>
      <p>When bundling makes sense:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>The combined bundled quote is lower than the sum of the cheapest separate quotes.</li>
        <li>One bill and one insurer simplifies claims when both policies are involved (e.g., a car damages your fence — both auto and home are involved).</li>
      </ul>
      <p>When to skip the bundle:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>One policy category has a much better deal from a specialist (e.g., USAA for auto, a specialty insurer for a high-value home).</li>
        <li>The discount is absorbed by higher base rates at that insurer.</li>
      </ul>
      <p>
        Use InsureWise&apos;s{" "}
        <strong className="text-foreground">Bundle Comparison tool</strong> on
        the Compare page — enter separate quotes and a bundled quote to see the
        exact dollar difference.
      </p>
    </div>
  );
}

function CoverageGapsPanel() {
  return (
    <div className="text-sm text-muted-foreground leading-relaxed space-y-4">
      <p>The most common gaps in standard homeowners policies:</p>
      <div className="space-y-3">
        {[
          {
            title: "Flood",
            body: "Not covered by any standard HO-3 policy. Requires a separate NFIP or private flood policy. Even a few inches of water can cause tens of thousands in damage.",
          },
          {
            title: "Earthquake",
            body: "Excluded from standard policies in California. A separate earthquake policy or endorsement is required. The California Earthquake Authority (CEA) is the main source.",
          },
          {
            title: "ACV vs. RCV for contents",
            body: "Standard policies often pay actual cash value (depreciated) for personal property. An RCV endorsement adds cost but pays what replacement actually costs today.",
          },
          {
            title: "Scheduled personal property",
            body: "Jewelry, art, collectibles, and musical instruments often have sub-limits (e.g., $1,500 for jewelry). Scheduling each item separately provides full replacement value.",
          },
          {
            title: "Home business",
            body: "Business equipment and liability from a home-based business are typically excluded. A business owner's policy (BOP) or endorsement is needed.",
          },
          {
            title: "Sewer / water backup",
            body: "Water that backs up from a sewer or drain is usually excluded. A water backup endorsement covers this for a modest additional premium.",
          },
        ].map(({ title, body }) => (
          <div key={title} className="rounded-lg border p-3 space-y-1">
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p>{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TermVsInstallmentPanel() {
  return (
    <div className="text-sm text-muted-foreground leading-relaxed space-y-4">
      <p>
        <strong className="text-foreground">Per-term billing</strong> means you
        pay a lump sum for each policy period (6 or 12 months). Many insurers
        offer a slight discount for paying in full.
      </p>
      <p>
        <strong className="text-foreground">Monthly installments</strong> spread
        the cost over the year, but often come with an installment fee ($3–$10
        per payment). Over 12 months, that can add $36–$120 to your effective
        annual cost.
      </p>
      <p>
        To find the true annual cost of installment billing:
        <br />
        <em>(Monthly payment × 12) + (installment fee × 12)</em>
      </p>
      <p>
        Use the <strong className="text-foreground">Annual Premium converter</strong>{" "}
        topic on this page (or the Car Insurance page) to normalize any billing
        schedule to a per-year figure for fair comparison.
      </p>
    </div>
  );
}

function HomeCoveragesPanel() {
  return (
    <div className="text-sm text-muted-foreground leading-relaxed space-y-4">
      {[
        {
          code: "A",
          name: "Dwelling",
          body: "The physical structure of your home — walls, roof, floors, built-in appliances. This is the most important limit to get right: it must cover the cost to rebuild, not the market value.",
        },
        {
          code: "B",
          name: "Other Structures",
          body: "Fences, detached garages, sheds, driveways, swimming pools. Usually auto-set at 10% of Coverage A. For a home with extensive landscaping or structures, you may need more.",
        },
        {
          code: "C",
          name: "Personal Property",
          body: "Everything inside the home: furniture, electronics, clothing, appliances. Typical default is 50–70% of Coverage A. High-value items may need a floater or scheduled endorsement.",
        },
        {
          code: "D",
          name: "Loss of Use",
          body: "Pays the increase in your living expenses (hotel, restaurant meals above normal) while your home is uninhabitable due to a covered loss. Usually 20–30% of Coverage A.",
        },
        {
          code: "E",
          name: "Personal Liability",
          body: "Pays legal defense and judgments if someone is injured on your property or you accidentally damage another person's property. Standard limit starts at $100,000; $300,000 or more is recommended.",
        },
        {
          code: "F",
          name: "Medical Payments to Others",
          body: "Pays medical bills for guests injured on your property, regardless of fault. Low limits ($1,000–$5,000). Does not apply to you or household members.",
        },
      ].map(({ code, name, body }) => (
        <div key={code} className="flex gap-3">
          <Badge variant="secondary" className="mt-0.5 h-fit shrink-0 text-xs">
            Cov {code}
          </Badge>
          <div className="space-y-1">
            <p className="font-medium text-foreground">{name}</p>
            <p>{body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail panel router
// ---------------------------------------------------------------------------

function TopicDetail({ id, onBack }: { id: TopicId; onBack: () => void }) {
  const topic = TOPICS.find((t) => t.id === id)!;

  const panels: Record<TopicId, React.ReactNode> = {
    "what-is-deductible": <DeductiblePanel />,
    "annual-premium": <AnnualPremiumPanel />,
    "liability-limits": <LiabilityPanel />,
    "rebuild-estimate": <RebuildPanel />,
    bundling: <BundlingPanel />,
    "coverage-gaps": <CoverageGapsPanel />,
    "term-vs-installment": <TermVsInstallmentPanel />,
    "home-coverages": <HomeCoveragesPanel />,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Badge variant={topic.tag === "Car" ? "default" : topic.tag === "Home" ? "secondary" : "outline"} className="text-xs">
          {topic.tag}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg leading-snug">{topic.title}</CardTitle>
        </CardHeader>
        <CardContent>{panels[id]}</CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AssistantPage() {
  const [activeId, setActiveId] = useState<TopicId | null>(null);

  if (activeId) {
    return (
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            Ask AI
          </h1>
        </div>
        <TopicDetail id={activeId} onBack={() => setActiveId(null)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          Ask AI
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a question to get an explanation and, where helpful, a live
          calculator.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {TOPICS.map((topic) => (
          <button
            key={topic.id}
            type="button"
            className="group flex items-start justify-between gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={() => setActiveId(topic.id)}
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    topic.tag === "Car"
                      ? "default"
                      : topic.tag === "Home"
                      ? "secondary"
                      : "outline"
                  }
                  className="text-xs shrink-0"
                >
                  {topic.tag}
                </Badge>
              </div>
              <p className="text-sm font-medium leading-snug">{topic.title}</p>
              <p className="text-xs text-muted-foreground">{topic.summary}</p>
            </div>
            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>

      <div className="flex gap-2 rounded-lg border bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          <strong>Educational only.</strong> Explanations and calculations are
          for learning purposes and do not constitute insurance advice. For
          personalized guidance, consult a licensed agent.
        </p>
      </div>
    </div>
  );
}
