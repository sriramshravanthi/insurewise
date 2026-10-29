"use client";

/**
 * /dashboard/car — Car insurance feature page.
 *
 * Layout:
 *   - Policy list (cards, one per tracked car policy)
 *   - "Add policy" sheet / drawer
 *   - Tabs: Analysis | Deductible trade-off | Premium composition
 *
 * All analysis is purely educational — no recommendations.
 */

import { useState } from "react";
import { Plus, Car, Pencil, Trash2, Info } from "lucide-react";
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
  CarPolicyForm,
  policyToFormValues,
  formValuesToPolicyInsert,
  formValuesToCoverageInserts,
} from "@/features/car/policy-form";
import type { PolicyFormValues } from "@/features/car/policy-form";
import { DeductiblePanel } from "@/features/car/deductible-panel";
import { CompositionChart } from "@/features/car/composition-chart";
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
  const includedCoverages = coverages.filter((c) => c.included);

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
        {/* Annual premium */}
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Annual premium</span>
          <span className="font-semibold tabular-nums">
            {annualCents != null ? formatCents(annualCents) : "—"}
            <span className="text-xs font-normal text-muted-foreground">/yr</span>
          </span>
        </div>

        <Separator />

        {/* Coverage badges */}
        {includedCoverages.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {includedCoverages.map((c) => (
              <Badge key={c.id} variant="secondary" className="text-xs">
                {c.coverage_code}
              </Badge>
            ))}
          </div>
        )}
        {includedCoverages.length === 0 && (
          <p className="text-xs text-muted-foreground">No coverages recorded</p>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CarPage() {
  const household = useHouseholdRow();
  const allPolicies = usePolicies();
  const allCoverages = useCoverages();

  const carPolicies = allPolicies.filter((p) => p.policy_type === "car");

  const createPolicy = useCreatePolicy();
  const updatePolicy = useUpdatePolicy();
  const deletePolicy = useDeletePolicy();
  const upsertCoverage = useUpsertCoverage();

  // Dialog state
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

  async function handleSave(values: PolicyFormValues) {
    if (!household) return;
    setSaving(true);
    try {
      if (editingPolicy) {
        // Update existing
        const insert = formValuesToPolicyInsert(values, household.id);
        await updatePolicy.mutateAsync({ id: editingPolicy.id, patch: insert });
        // Re-upsert all included coverages
        const coverageInserts = formValuesToCoverageInserts(
          values,
          editingPolicy.id
        );
        for (const cov of coverageInserts) {
          await upsertCoverage.mutateAsync(cov);
        }
      } else {
        // Create new
        const policyInsert = formValuesToPolicyInsert(values, household.id);
        const result = await createPolicy.mutateAsync(policyInsert);
        if (result.ok) {
          const coverageInserts = formValuesToCoverageInserts(
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
      ? policyToFormValues(
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
            <Car className="h-6 w-6 text-primary" />
            Car Insurance
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your policies and understand your coverage.
          </p>
        </div>
        <Button onClick={openAdd} size="sm" className="shrink-0">
          <Plus className="h-4 w-4" />
          Add policy
        </Button>
      </div>

      {/* Policy cards */}
      {carPolicies.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Car className="h-10 w-10 text-muted-foreground/40" />
            <div>
              <p className="font-medium">No car policies yet</p>
              <p className="text-sm text-muted-foreground">
                Add your current car insurance policy to start the analysis.
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
          {carPolicies.map((policy) => (
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

      {/* Analysis tabs */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Analysis Tools
        </h2>
        <Tabs defaultValue="deductible">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="deductible">Deductible trade-off</TabsTrigger>
            <TabsTrigger value="composition">Premium composition</TabsTrigger>
          </TabsList>
          <TabsContent value="deductible" className="mt-4">
            <DeductiblePanel />
          </TabsContent>
          <TabsContent value="composition" className="mt-4">
            <CompositionChart />
          </TabsContent>
        </Tabs>
      </div>

      {/* Disclaimer */}
      <div className="flex gap-2 rounded-lg border bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          <strong>Educational tool only.</strong> InsureWise does not provide
          licensed insurance advice. All calculations use numbers you entered
          and are for learning purposes only. Verify coverage details with your
          insurer or a licensed agent.
        </p>
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPolicy ? "Edit policy" : "Add car policy"}
            </DialogTitle>
            <DialogDescription>
              Enter the details from your declarations page or policy documents.
            </DialogDescription>
          </DialogHeader>
          <CarPolicyForm
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
