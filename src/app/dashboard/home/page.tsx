"use client";

/**
 * /dashboard/home — Home insurance feature page.
 */

import { useState } from "react";
import { Plus, Home, Pencil, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  usePolicies,
  useCoverages,
  useCreatePolicy,
  useUpdatePolicy,
  useDeletePolicy,
  useUpsertCoverage,
  useHouseholdRow,
} from "@/providers/household-context";
import type { PolicyRow, PolicyCoverageRow } from "@/providers/database.types";
import {
  HomePolicyForm,
  homePolicyToFormValues,
  homeFormValuesToPolicyInsert,
  homeFormValuesToCoverageInserts,
} from "@/features/home/policy-form";
import type { HomePolicyFormValues } from "@/features/home/policy-form";
import { RebuildPanel } from "@/features/home/rebuild-panel";
import { formatCents } from "@/lib/utils";
import { c1AnnualizedPremium } from "@/engine/c1-annualized-premium";
import type { AmountBasis, TermMonths, InstallmentsPerYear } from "@/engine/c1-annualized-premium";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function annualCentsForPolicy(policy: PolicyRow): number | null {
  const basis = policy.amount_basis as AmountBasis | "per_year";
  if (basis === "per_year") return policy.amount_cents;

  const result = c1AnnualizedPremium({
    amountCents: policy.amount_cents,
    amountBasis: basis as AmountBasis,
    ...(basis === "per_term" && policy.term_months != null
      ? { termMonths: policy.term_months as TermMonths }
      : {}),
    ...(basis === "per_installment" && policy.installments_per_year != null
      ? { installmentsPerYear: policy.installments_per_year as InstallmentsPerYear }
      : {}),
  });

  return result.status === "ok" ? result.value.annualCents : null;
}

const COVERAGE_LABELS: Record<string, string> = {
  COV_A: "Dwelling",
  COV_B: "Other Structures",
  COV_C: "Personal Property",
  COV_D: "Loss of Use",
  COV_E: "Liability",
  COV_F: "Medical",
};

// ---------------------------------------------------------------------------
// Policy card
// ---------------------------------------------------------------------------

function PolicyCard({
  policy,
  coverages,
  onEdit,
  onDelete,
}: {
  policy: PolicyRow;
  coverages: PolicyCoverageRow[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const annualCents = annualCentsForPolicy(policy);
  const covA = coverages.find((c) => c.coverage_code === "COV_A");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base truncate">{policy.label}</CardTitle>
            {policy.insurer_label && (
              <CardDescription className="mt-0.5">
                {policy.insurer_label}
              </CardDescription>
            )}
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onEdit}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Annual premium</span>
          <span className="font-semibold tabular-nums">
            {annualCents != null ? formatCents(annualCents) : "—"}
            <span className="text-xs font-normal text-muted-foreground">/yr</span>
          </span>
        </div>

        {covA?.limit_primary_cents != null && (
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Dwelling coverage</span>
            <span className="text-sm font-medium tabular-nums">
              {formatCents(covA.limit_primary_cents)}
            </span>
          </div>
        )}

        <Separator />

        <div className="flex flex-wrap gap-1.5">
          {coverages
            .filter((c) => c.included)
            .map((c) => (
              <Badge key={c.id} variant="secondary" className="text-xs">
                {COVERAGE_LABELS[c.coverage_code] ?? c.coverage_code}
              </Badge>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HomePage() {
  const household = useHouseholdRow();
  const allPolicies = usePolicies();
  const allCoverages = useCoverages();

  const homePolicies = allPolicies.filter((p) => p.policy_type === "home");

  const createPolicy = useCreatePolicy();
  const updatePolicy = useUpdatePolicy();
  const deletePolicy = useDeletePolicy();
  const upsertCoverage = useUpsertCoverage();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PolicyRow | null>(null);
  const [saving, setSaving] = useState(false);

  function openAdd() {
    setEditingPolicy(null);
    setDialogOpen(true);
  }

  function openEdit(policy: PolicyRow) {
    setEditingPolicy(policy);
    setDialogOpen(true);
  }

  async function handleSave(values: HomePolicyFormValues) {
    if (!household) return;
    setSaving(true);
    try {
      if (editingPolicy) {
        const insert = homeFormValuesToPolicyInsert(values, household.id);
        await updatePolicy.mutateAsync({ id: editingPolicy.id, patch: insert });
        const coverageInserts = homeFormValuesToCoverageInserts(
          values,
          editingPolicy.id
        );
        for (const cov of coverageInserts) {
          await upsertCoverage.mutateAsync(cov);
        }
      } else {
        const policyInsert = homeFormValuesToPolicyInsert(values, household.id);
        const result = await createPolicy.mutateAsync(policyInsert);
        if (result.ok) {
          const coverageInserts = homeFormValuesToCoverageInserts(
            values,
            result.data.id
          );
          for (const cov of coverageInserts) {
            await upsertCoverage.mutateAsync(cov);
          }
        }
      }
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(policyId: string) {
    await deletePolicy.mutateAsync(policyId);
  }

  const editingFormValues =
    editingPolicy != null
      ? homePolicyToFormValues(
          editingPolicy,
          allCoverages.filter((c) => c.policy_id === editingPolicy.id)
        )
      : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Home className="h-6 w-6 text-primary" />
            Home Insurance
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your policy and understand your coverage limits.
          </p>
        </div>
        <Button onClick={openAdd} size="sm" className="shrink-0">
          <Plus className="h-4 w-4" />
          Add policy
        </Button>
      </div>

      {/* Policy cards */}
      {homePolicies.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Home className="h-10 w-10 text-muted-foreground/40" />
            <div>
              <p className="font-medium">No home policies yet</p>
              <p className="text-sm text-muted-foreground">
                Add your current home or renters policy to start the analysis.
              </p>
            </div>
            <Button onClick={openAdd} size="sm">
              <Plus className="h-4 w-4" />
              Add your first policy
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {homePolicies.map((policy) => (
            <PolicyCard
              key={policy.id}
              policy={policy}
              coverages={allCoverages.filter(
                (c) => c.policy_id === policy.id
              )}
              onEdit={() => openEdit(policy)}
              onDelete={() => handleDelete(policy.id)}
            />
          ))}
        </div>
      )}

      {/* Analysis tools */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Analysis Tools
        </h2>
        <Tabs defaultValue="rebuild">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="rebuild">Rebuild estimate</TabsTrigger>
          </TabsList>
          <TabsContent value="rebuild" className="mt-4">
            <RebuildPanel />
          </TabsContent>
        </Tabs>
      </div>

      {/* Disclaimer */}
      <div className="flex gap-2 rounded-lg border bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          <strong>Educational tool only.</strong> All calculations use numbers
          you entered and are for learning purposes only. Rebuild cost
          estimates are rough illustrations — consult a licensed appraiser or
          your insurer for a verified figure.
        </p>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPolicy ? "Edit policy" : "Add home policy"}
            </DialogTitle>
            <DialogDescription>
              Enter the details from your declarations page.
            </DialogDescription>
          </DialogHeader>
          <HomePolicyForm
            {...(editingFormValues ? { defaultValues: editingFormValues } : {})}
            onSave={handleSave}
            onCancel={() => setDialogOpen(false)}
            saving={saving}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
