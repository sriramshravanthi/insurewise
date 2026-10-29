"use client";

import Link from "next/link";
import { Car, Home, BookOpen, Bot, ArrowRight, ShieldAlert } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useHouseholdRow, usePolicies, useVehicles, useProperties } from "@/providers/household-context";

const quickActions = [
  {
    href: "/dashboard/car",
    title: "Car Insurance",
    description: "Analyze coverage limits, deductibles, and annual cost.",
    icon: Car,
    badge: null,
  },
  {
    href: "/dashboard/home",
    title: "Home Insurance",
    description: "Review dwelling coverage, rebuild cost, and contents.",
    icon: Home,
    badge: null,
  },
  {
    href: "/dashboard/education",
    title: "Learn the Basics",
    description: "Plain-language guides — no jargon, no sales pitch.",
    icon: BookOpen,
    badge: "New",
  },
  {
    href: "/dashboard/assistant",
    title: "Ask the AI",
    description: "Get plain answers to your insurance questions.",
    icon: Bot,
    badge: null,
  },
] as const;

function SummaryStats() {
  const policies = usePolicies();
  const vehicles = useVehicles();
  const properties = useProperties();

  if (policies.length === 0 && vehicles.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <ShieldAlert className="h-10 w-10 text-muted-foreground/50" />
          <div>
            <p className="font-medium">No policies yet</p>
            <p className="text-sm text-muted-foreground">
              Add your car or home policy to start analysing your coverage.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm">
              <Link href="/dashboard/car">Add car policy</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/home">Add home policy</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Policies tracked</CardDescription>
          <CardTitle className="text-3xl">{policies.length}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Vehicles</CardDescription>
          <CardTitle className="text-3xl">{vehicles.length}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Properties</CardDescription>
          <CardTitle className="text-3xl">{properties.length}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const household = useHouseholdRow();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          {household ? `${household.label} — Overview` : "Your Dashboard"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          InsureWise helps you understand your car and home insurance — no agent
          required.
        </p>
      </div>

      {/* Summary stats */}
      <SummaryStats />

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          What would you like to do?
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} className="group block">
              <Card className="h-full transition-shadow group-hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <action.icon className="h-5 w-5 text-primary" />
                    {action.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base">{action.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {action.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Get started <ArrowRight className="h-3 w-3" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Educational disclaimer */}
      <p className="rounded-lg border bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
        <strong>Educational tool only.</strong> InsureWise does not provide
        licensed insurance advice and cannot recommend specific insurers or
        policies. Always verify coverage details with your agent or insurer.
      </p>
    </div>
  );
}
