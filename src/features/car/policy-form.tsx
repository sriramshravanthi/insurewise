"use client";

/**
 * CarPolicyForm — enter or edit a single car insurance policy.
 *
 * Collects: label, insurer, term, amount + basis, then the core
 * auto coverages (BI, PD, MED, UM/UIM, COMP, COLL, UMPD, UMUIM).
 *
 * On submit, calls onSave(policy, coverages) — parent decides DB ops.
 */

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { parseDollarsToCents } from "@/lib/utils";
import type { PolicyRow, PolicyCoverageRow } from "@/providers/database.types";

// ---------------------------------------------------------------------------
// Form schema
// ---------------------------------------------------------------------------

const dollarField = z
  .string()
  .trim()
  .regex(/^\$?[\d,]+(\.\d{0,2})?$|^$/, "Enter a dollar amount (e.g. 1200 or 1,200.00)");

const CoverageLineZ = z.object({
  coverage_code: z.string(),
  label: z.string(),
  limit_primary_display: z.string(), // displayed as dollars
  limit_secondary_display: z.string(),
  deductible_display: z.string(),
  included: z.boolean(),
});

const PolicyFormSchema = z.object({
  label: z.string().min(1, "Give this policy a name.").max(80),
  insurer_label: z.string().max(80).optional(),
  amount_display: dollarField,
  amount_basis: z.enum(["per_term", "per_installment", "per_year"]),
  term_months: z.enum(["1", "3", "6", "12"]),
  installments_per_year: z.enum(["1", "2", "4", "6", "12"]).optional(),
  coverages: z.array(CoverageLineZ),
});

export type PolicyFormValues = z.infer<typeof PolicyFormSchema>;

// ---------------------------------------------------------------------------
// Default coverage lines for a new car policy
// ---------------------------------------------------------------------------

const DEFAULT_COVERAGES: z.infer<typeof CoverageLineZ>[] = [
  {
    coverage_code: "BI",
    label: "Bodily Injury Liability",
    limit_primary_display: "",
    limit_secondary_display: "",
    deductible_display: "",
    included: true,
  },
  {
    coverage_code: "PD",
    label: "Property Damage Liability",
    limit_primary_display: "",
    limit_secondary_display: "",
    deductible_display: "",
    included: true,
  },
  {
    coverage_code: "MED",
    label: "Medical Payments",
    limit_primary_display: "",
    limit_secondary_display: "",
    deductible_display: "",
    included: false,
  },
  {
    coverage_code: "UM",
    label: "Uninsured Motorist BI",
    limit_primary_display: "",
    limit_secondary_display: "",
    deductible_display: "",
    included: false,
  },
  {
    coverage_code: "UMUIM",
    label: "Underinsured Motorist BI",
    limit_primary_display: "",
    limit_secondary_display: "",
    deductible_display: "",
    included: false,
  },
  {
    coverage_code: "COMP",
    label: "Comprehensive",
    limit_primary_display: "",
    limit_secondary_display: "",
    deductible_display: "",
    included: false,
  },
  {
    coverage_code: "COLL",
    label: "Collision",
    limit_primary_display: "",
    limit_secondary_display: "",
    deductible_display: "",
    included: false,
  },
];

// ---------------------------------------------------------------------------
// Helpers — convert DB rows → form values and back
// ---------------------------------------------------------------------------

export function policyToFormValues(
  policy: PolicyRow,
  coverages: PolicyCoverageRow[]
): PolicyFormValues {
  const fmtCents = (c: number | null) =>
    c != null ? (c / 100).toFixed(2) : "";

  const coverageMap = new Map(coverages.map((c) => [c.coverage_code, c]));

  const covLines = DEFAULT_COVERAGES.map((def) => {
    const db = coverageMap.get(def.coverage_code);
    return {
      coverage_code: def.coverage_code,
      label: def.label,
      limit_primary_display: fmtCents(db?.limit_primary_cents ?? null),
      limit_secondary_display: fmtCents(db?.limit_secondary_cents ?? null),
      deductible_display: fmtCents(db?.deductible_cents ?? null),
      included: db?.included ?? false,
    };
  });

  return {
    label: policy.label,
    insurer_label: policy.insurer_label ?? "",
    amount_display: fmtCents(policy.amount_cents),
    amount_basis: policy.amount_basis as "per_term" | "per_installment" | "per_year",
    term_months: String(policy.term_months) as "1" | "3" | "6" | "12",
    installments_per_year: policy.installments_per_year
      ? (String(policy.installments_per_year) as "1" | "2" | "4" | "6" | "12")
      : undefined,
    coverages: covLines,
  };
}

export function formValuesToPolicyInsert(
  values: PolicyFormValues,
  householdId: string
): Omit<PolicyRow, "id" | "created_at" | "updated_at"> {
  return {
    household_id: householdId,
    policy_type: "car",
    role: "current",
    source: "entered",
    label: values.label,
    insurer_label: values.insurer_label || null,
    amount_cents: parseDollarsToCents(values.amount_display) ?? 0,
    amount_basis: values.amount_basis,
    term_months: Number(values.term_months) as 1 | 3 | 6 | 12,
    installments_per_year: values.installments_per_year
      ? Number(values.installments_per_year)
      : null,
    fees: null,
    effective_period: null,
    notes: null,
  };
}

export function formValuesToCoverageInserts(
  values: PolicyFormValues,
  policyId: string
): Omit<PolicyCoverageRow, "id" | "created_at" | "updated_at">[] {
  return values.coverages
    .filter((c) => c.included)
    .map((c) => ({
      policy_id: policyId,
      coverage_code: c.coverage_code,
      included: true,
      limit_primary_cents: parseDollarsToCents(c.limit_primary_display),
      limit_secondary_cents: parseDollarsToCents(c.limit_secondary_display),
      limit_split_raw: null,
      deductible_cents: parseDollarsToCents(c.deductible_display),
      deductible_pct: null,
      deductible_pct_basis: null,
      valuation_basis: null,
      notes: null,
    }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CarPolicyFormProps {
  defaultValues?: PolicyFormValues;
  onSave: (values: PolicyFormValues) => void | Promise<void>;
  onCancel?: () => void;
  saving?: boolean;
}

export function CarPolicyForm({
  defaultValues,
  onSave,
  onCancel,
  saving = false,
}: CarPolicyFormProps) {
  const form = useForm<PolicyFormValues>({
    resolver: zodResolver(PolicyFormSchema),
    defaultValues: defaultValues ?? {
      label: "My Car Policy",
      insurer_label: "",
      amount_display: "",
      amount_basis: "per_term",
      term_months: "6",
      installments_per_year: undefined,
      coverages: DEFAULT_COVERAGES,
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "coverages",
  });

  const amountBasis = form.watch("amount_basis");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
        {/* ── Policy details ── */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Policy details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Policy name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Current Policy" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="insurer_label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Insurer{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. State Farm" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Premium */}
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="amount_display"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Premium amount</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 800.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount_basis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Basis</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="per_term">Per term</SelectItem>
                      <SelectItem value="per_year">Per year</SelectItem>
                      <SelectItem value="per_installment">
                        Per installment
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {amountBasis === "per_term" ? (
              <FormField
                control={form.control}
                name="term_months"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term length</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 month</SelectItem>
                        <SelectItem value="3">3 months</SelectItem>
                        <SelectItem value="6">6 months</SelectItem>
                        <SelectItem value="12">12 months (annual)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : amountBasis === "per_installment" ? (
              <FormField
                control={form.control}
                name="installments_per_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Installments / year</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select…" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 (annual)</SelectItem>
                        <SelectItem value="2">2 (semi-annual)</SelectItem>
                        <SelectItem value="4">4 (quarterly)</SelectItem>
                        <SelectItem value="6">6 (bi-monthly)</SelectItem>
                        <SelectItem value="12">12 (monthly)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
          </div>
        </div>

        <Separator />

        {/* ── Coverages ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Coverages</h3>
            <span className="text-xs text-muted-foreground">
              Check coverages included on your policy
            </span>
          </div>

          <div className="rounded-lg border divide-y">
            {fields.map((field, index) => {
              const included = form.watch(`coverages.${index}.included`);
              return (
                <div key={field.id} className="p-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`cov-${index}`}
                      checked={included}
                      onChange={(e) =>
                        form.setValue(
                          `coverages.${index}.included`,
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 rounded border-input accent-primary"
                    />
                    <label
                      htmlFor={`cov-${index}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {field.label}
                    </label>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {field.coverage_code}
                    </Badge>
                  </div>

                  {included && (
                    <div className="ml-7 grid gap-3 sm:grid-cols-3">
                      <FormField
                        control={form.control}
                        name={`coverages.${index}.limit_primary_display`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Limit (per person)
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. 100000"
                                className="h-8 text-sm"
                                {...f}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`coverages.${index}.limit_secondary_display`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Limit (per occurrence)
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. 300000"
                                className="h-8 text-sm"
                                {...f}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`coverages.${index}.deductible_display`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Deductible</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. 500"
                                className="h-8 text-sm"
                                {...f}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save policy"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
