"use client";

/**
 * /dashboard/education — Learn page.
 *
 * Static educational content about car and home insurance concepts.
 * Organized into tabbed sections so the user can read at their own pace.
 * No engine calculations here — just plain explanations.
 */

import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ---------------------------------------------------------------------------
// Accordion item
// ---------------------------------------------------------------------------

function AccordionItem({
  question,
  answer,
}: {
  question: string;
  answer: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 py-3 text-left text-sm font-medium hover:text-primary transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        {question}
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="pb-4 text-sm text-muted-foreground leading-relaxed space-y-2">
          {answer}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Glossary term
// ---------------------------------------------------------------------------

function Term({ term, definition }: { term: string; definition: string }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-sm font-medium">{term}</dt>
      <dd className="text-sm text-muted-foreground leading-relaxed">
        {definition}
      </dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Car insurance content
// ---------------------------------------------------------------------------

function CarContent() {
  return (
    <div className="space-y-6">
      {/* Coverage types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coverage types</CardTitle>
          <CardDescription>
            The main parts of a standard auto insurance policy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              code: "Liability",
              label: "Bodily Injury & Property Damage",
              color: "default" as const,
              desc: "Pays others when you cause an accident. Required in California. Expressed as three numbers (e.g., 15/30/5) — per-person BI limit / per-accident BI limit / PD limit, all in thousands.",
            },
            {
              code: "Collision",
              label: "Collision",
              color: "secondary" as const,
              desc: "Pays to repair or replace your car after a crash, regardless of fault. Subject to your deductible. Usually required if you have a loan or lease.",
            },
            {
              code: "Comp",
              label: "Comprehensive",
              color: "secondary" as const,
              desc: "Pays for non-collision damage: theft, vandalism, fire, hail, flood, hitting an animal. Also subject to a deductible.",
            },
            {
              code: "UM/UIM",
              label: "Uninsured / Underinsured Motorist",
              color: "outline" as const,
              desc: "Pays your injuries (and sometimes property damage) when the at-fault driver has no insurance or not enough. California requires insurers to offer it; you can waive it in writing.",
            },
            {
              code: "MedPay",
              label: "Medical Payments",
              color: "outline" as const,
              desc: "Covers medical bills for you and passengers regardless of fault. No-fault and usually modest limits. Distinct from health insurance — it pays quickly and directly.",
            },
            {
              code: "PIP",
              label: "Personal Injury Protection",
              color: "outline" as const,
              desc: "Broader than MedPay: may cover lost wages and other expenses. Not required in California, but available as an add-on.",
            },
          ].map(({ code, label, color, desc }) => (
            <div key={code} className="flex gap-3">
              <Badge variant={color} className="mt-0.5 h-fit shrink-0 text-xs">
                {code}
              </Badge>
              <div className="space-y-1">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* How premiums work */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How your premium is calculated</CardTitle>
          <CardDescription>
            Insurers combine many rating factors to arrive at your price.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y rounded-lg border px-4">
            <AccordionItem
              question="What factors affect my rate?"
              answer={
                <>
                  <p>
                    California law limits which factors insurers can use.
                    Approved primary factors include driving record, annual
                    mileage driven, and years of driving experience. Secondary
                    factors may include vehicle make/model, garaging location,
                    marital status, and multi-policy discounts.
                  </p>
                  <p>
                    Credit score is <strong>not</strong> a permitted rating
                    factor in California.
                  </p>
                </>
              }
            />
            <AccordionItem
              question="What is a deductible and how does it affect my premium?"
              answer={
                <p>
                  A deductible is the amount you pay out-of-pocket before your
                  insurance pays the rest of a covered claim. Higher deductibles
                  generally mean lower premiums because you are taking on more
                  risk. Use InsureWise&apos;s Deductible Trade-off tool (on the Car
                  page) to model break-even points.
                </p>
              }
            />
            <AccordionItem
              question="What is a premium basis?"
              answer={
                <p>
                  Insurers bill premiums in different ways: as a single annual
                  amount, per policy term (often 6 months), or as monthly
                  installments. InsureWise normalizes all of these to an
                  annualized figure so you can compare apples to apples.
                </p>
              }
            />
            <AccordionItem
              question="What is bundling and does it always save money?"
              answer={
                <p>
                  Bundling means buying car and home insurance from the same
                  insurer, often for a multi-policy discount. It can simplify
                  billing, but the bundled price is not always lower than
                  shopping each separately. Use the Compare page to run the
                  numbers with your actual quotes.
                </p>
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Glossary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Glossary</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <Term
              term="Declarations page (dec page)"
              definition="The first page of your policy that summarizes coverages, limits, deductibles, premium, and policy period. All the numbers you enter into InsureWise should come from here."
            />
            <Separator />
            <Term
              term="Policy limit"
              definition="The maximum your insurer will pay per claim or per policy period. Choosing a limit below your net worth leaves you exposed to a judgment that exceeds your coverage."
            />
            <Separator />
            <Term
              term="Actual cash value (ACV)"
              definition="The cost to replace an item minus depreciation. If your car is totaled, ACV is usually what you receive — which may be less than you owe on a loan."
            />
            <Separator />
            <Term
              term="Gap insurance"
              definition="Covers the difference between ACV and the amount you still owe on your loan. Relevant when a car depreciates faster than you pay down the principal."
            />
            <Separator />
            <Term
              term="SR-22"
              definition="A certificate your insurer files with the DMV proving you carry minimum liability coverage. Required after certain violations like a DUI or driving uninsured."
            />
            <Separator />
            <Term
              term="Named insured"
              definition="The person(s) explicitly listed on the policy. Drivers living in your household should typically be listed to avoid coverage disputes."
            />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Home insurance content
// ---------------------------------------------------------------------------

function HomeContent() {
  return (
    <div className="space-y-6">
      {/* Coverage types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Standard homeowners coverages</CardTitle>
          <CardDescription>
            A typical HO-3 (open-peril dwelling / named-peril contents) policy
            is organized into six sections.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              code: "Cov A",
              label: "Dwelling",
              desc: "Your home's structure — walls, roof, built-in appliances. The key figure to get right: it should reflect the cost to rebuild, not the market value.",
            },
            {
              code: "Cov B",
              label: "Other Structures",
              desc: "Detached structures on your property: fences, sheds, detached garages. Typically 10% of Coverage A by default.",
            },
            {
              code: "Cov C",
              label: "Personal Property",
              desc: "Your belongings — furniture, electronics, clothing. Usually 50–70% of Coverage A. High-value items (jewelry, art) often need a scheduled endorsement for full replacement value.",
            },
            {
              code: "Cov D",
              label: "Loss of Use",
              desc: "Living expenses (hotel, restaurant meals above your normal costs) while your home is being repaired after a covered loss. Usually 20–30% of Coverage A.",
            },
            {
              code: "Cov E",
              label: "Liability",
              desc: "Pays legal defense and judgment costs if someone is injured on your property or you accidentally damage someone else's property. Standard limits start at $100,000; many advisors suggest $300,000 or more.",
            },
            {
              code: "Cov F",
              label: "Medical Payments",
              desc: "Pays medical bills for guests injured on your property, regardless of fault. Typically a small limit ($1,000–$5,000) — not a substitute for liability coverage.",
            },
          ].map(({ code, label, desc }) => (
            <div key={code} className="flex gap-3">
              <Badge variant="secondary" className="mt-0.5 h-fit shrink-0 text-xs">
                {code}
              </Badge>
              <div className="space-y-1">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Common questions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Common questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y rounded-lg border px-4">
            <AccordionItem
              question="How is rebuild cost different from market value?"
              answer={
                <p>
                  Market value includes the land, which you don&apos;t need to
                  insure — you still own the land after a loss. Rebuild cost is
                  what it would cost to construct the same structure from the
                  ground up at today&apos;s labor and materials prices. Insuring to
                  market value often results in either over-insurance (on land
                  value) or under-insurance (if the home&apos;s structure costs more
                  to build than its sale price implies).
                </p>
              }
            />
            <AccordionItem
              question="What is a coinsurance clause?"
              answer={
                <>
                  <p>
                    Some policies require you to insure your home to at least
                    80% (or another percentage) of its replacement cost. If you
                    fall below that threshold and file a partial loss claim, your
                    insurer may apply a coinsurance penalty and only pay a
                    fraction of your loss.
                  </p>
                  <p>
                    The Rebuild Estimate tool on the Home page helps you see
                    whether your Coverage A is likely to meet that threshold.
                  </p>
                </>
              }
            />
            <AccordionItem
              question="What is actual cash value vs. replacement cost for contents?"
              answer={
                <p>
                  Actual cash value (ACV) pays the depreciated value of your
                  belongings — a 5-year-old TV at ACV might net you $150.
                  Replacement cost value (RCV) pays what it costs to buy a new
                  equivalent today. RCV endorsements cost more but can make a
                  big difference after a major loss.
                </p>
              }
            />
            <AccordionItem
              question="Is flood covered by a standard homeowners policy?"
              answer={
                <p>
                  No. Standard homeowners policies (HO-3) explicitly exclude
                  flood damage. Separate flood insurance is available through the
                  National Flood Insurance Program (NFIP) or private insurers.
                  In California, wildfire smoke and ash damage is generally
                  covered, but mudslide/mudflow from flooding may not be.
                </p>
              }
            />
            <AccordionItem
              question="What is an umbrella policy?"
              answer={
                <p>
                  A personal umbrella policy provides a large block of additional
                  liability coverage (often $1M–$5M) that sits on top of your
                  auto and home liability limits. It activates after your
                  underlying policy limits are exhausted. Umbrellas are
                  relatively affordable and valuable if your net worth exceeds
                  your standard liability limits.
                </p>
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Glossary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Glossary</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <Term
              term="HO-3 (Special Form)"
              definition="The most common homeowners policy type. Covers the dwelling on an open-peril basis (all causes except named exclusions) and personal property on a named-peril basis."
            />
            <Separator />
            <Term
              term="Endorsement / rider"
              definition="An attachment to the policy that adds, removes, or modifies a coverage. Common examples: scheduled personal property (jewelry), water backup, or earthquake coverage."
            />
            <Separator />
            <Term
              term="Peril"
              definition="A specific cause of loss — fire, theft, windstorm, etc. 'Open peril' means any cause not listed as an exclusion. 'Named peril' means only the specific perils listed are covered."
            />
            <Separator />
            <Term
              term="Deductible"
              definition="What you pay first before the insurer pays the rest. Home deductibles can be a flat dollar amount or a percentage of Coverage A (common for earthquake and, in some states, wind/hail)."
            />
            <Separator />
            <Term
              term="Replacement cost value (RCV)"
              definition="The cost to repair or replace with materials of like kind and quality, without a deduction for depreciation. Usually preferred over ACV."
            />
            <Separator />
            <Term
              term="Agreed value"
              definition="A special valuation where the insurer agrees to pay a set amount in the event of a total loss, with no depreciation calculation. More common for unique or historic properties."
            />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// General concepts content
// ---------------------------------------------------------------------------

function GeneralContent() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How to read your declarations page</CardTitle>
          <CardDescription>
            The dec page is the one-page summary at the front of any policy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Every declarations page lists the same essential information, even
            if the layout varies by insurer:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong className="text-foreground">Named insured(s)</strong> —
              who is covered. Make sure your name and address are correct.
            </li>
            <li>
              <strong className="text-foreground">Policy period</strong> — the
              start and end dates. Gaps between policies can expose you.
            </li>
            <li>
              <strong className="text-foreground">Premium</strong> — total cost
              and how it&apos;s broken down. Look for installment fees if you&apos;re
              paying monthly.
            </li>
            <li>
              <strong className="text-foreground">Coverage limits</strong> —
              the maximum payout per coverage, per claim, or per year. These
              are the numbers to enter into InsureWise.
            </li>
            <li>
              <strong className="text-foreground">Deductibles</strong> — your
              out-of-pocket before coverage kicks in. May differ by peril.
            </li>
            <li>
              <strong className="text-foreground">Discounts</strong> — bundled
              policy, loyalty, and other credits. Useful to know when shopping.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Shopping for coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y rounded-lg border px-4">
            <AccordionItem
              question="When should I shop for new coverage?"
              answer={
                <p>
                  At every renewal — most insurers increase rates annually.
                  Also when life changes: buying or selling a home, adding a
                  teen driver, a change in commute, or paying off a car loan
                  (which may let you drop collision if the car&apos;s value is low).
                </p>
              }
            />
            <AccordionItem
              question="How do I compare quotes fairly?"
              answer={
                <>
                  <p>
                    Match limits and deductibles exactly across quotes. A lower
                    premium with half the liability limit is not a better deal.
                    InsureWise&apos;s Compare page normalizes premiums to an annual
                    figure so you can do a side-by-side.
                  </p>
                  <p>
                    Also compare insurer financial strength ratings (AM Best,
                    S&P) and claims satisfaction scores — a policy is only as
                    good as the company&apos;s ability to pay.
                  </p>
                </>
              }
            />
            <AccordionItem
              question="What is an independent vs. captive agent?"
              answer={
                <p>
                  A captive agent represents one insurer (e.g., a State Farm
                  agent only sells State Farm). An independent agent can quote
                  multiple carriers. A direct writer (GEICO, Progressive online)
                  sells directly without agents. Each channel has different
                  incentives — it helps to get quotes from more than one.
                </p>
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">About InsureWise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            InsureWise is an <strong className="text-foreground">educational tool</strong>.
            All calculations use numbers you enter. Nothing here constitutes
            insurance advice, a premium quote, or a recommendation of any
            specific carrier or product.
          </p>
          <p>
            Premium estimates and calculations are illustrative only. Actual
            premiums depend on your specific underwriting factors, insurer
            filings, and many other variables InsureWise does not have access
            to.
          </p>
          <p>
            For personalized advice, consult a licensed insurance agent or
            broker in your state.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EducationPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Learn
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Plain-English explanations of insurance concepts — no jargon required.
        </p>
      </div>

      <Tabs defaultValue="car">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="car">Car insurance</TabsTrigger>
          <TabsTrigger value="home">Home insurance</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>
        <TabsContent value="car" className="mt-6">
          <CarContent />
        </TabsContent>
        <TabsContent value="home" className="mt-6">
          <HomeContent />
        </TabsContent>
        <TabsContent value="general" className="mt-6">
          <GeneralContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}
