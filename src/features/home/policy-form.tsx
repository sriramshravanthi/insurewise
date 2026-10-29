"use client";

/**
 * HomePolicyForm — enter or edit a home insurance policy.
 *
 * Collects: label, insurer, premium, and the four main coverage
 * amounts (A/B/C/D) plus deductible and optional liability / med pay.
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { parseDollarsToCents } from "@/lib/utils";
import type { PolicyRow, PolicyCoverageRow } from "@/providers/database.types";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const dollarField = z
  .string()
  .trim()
  .regex(
    /^\$?[\d,]+(\.\d{0,2})?$|^$/,
    "Enter a dollar amount (e.g. 300000 or 300,000)"
  );

export const HomePolicyFormSchema = z.object({
  label: z.string().min(1, "Give this policy a name.").max(80),
  insurer_label: z.string().max(80).optional(),
  amount_display: dollarField,
  amount_basis: z.enum(["per_term", "per_installment", "per_year"]),
  term_months: z.enum(["1", "3", "6", "12"]),
  installments_per_year: z.enum(["1", "2", "4", "6", "12"]).optional(),
  // Coverage amounts
  coverage_a: dollarField, // Dwelling
  coverage_b: dollarField, // Other structures
  coverage_c: dollarField, // Personal property (contents)
  coverage_d: dollarField, // Loss of use
  coverage_e: dollarField, // Liability (optional)
  coverage_f: dollarField, // Medical payments (optional)
  deductible: dollarField,
});

export type HomePolicyFormValues = z.infer<typeof HomePolicyFormSchema>;

// ---------------------------------------------------------------------------
// DB ↔ form converters
// ---------------------------------------------------------------------------

export function homePolicyToFormValues(
  policy: PolicyRow,
  coverages: PolicyCoverageRow[]
): HomePolicyFormValues {
  const fmt = (c: number | null) =>
    c != null ? (c / 100).toFixed(2) : "";

  const cov = (code: string) =>
    coverages.find((c) => c.coverage_code === code);

  return {
    label: policy.label,
    insurer_label: policy.insurer_label ?? "",
    amount_display: fmt(policy.amount_cents),
    amount_basis: policy.amount_basis as "per_term" | "per_installment" | "per_year",
    term_months: String(policy.term_months) as "1" | "3" | "6" | "12",
    installments_per_year: policy.installments_per_year
      ? (String(policy.installments_per_year) as "1" | "2" | "4" | "6" | "12")
      : undefined,
    coverage_a: fmt(cov("COV_A")?.limit_primary_cents ?? null),
    coverage_b: fmt(cov("COV_B")?.limit_primary_cents ?? null),
    coverage_c: fmt(cov("COV_C")?.limit_primary_cents ?? null),
    coverage_d: fmt(cov("COV_D")?.limit_primary_cents ?? null),
    coverage_e: fmt(cov("COV_E")?.limit_primary_cents ?? null),
    coverage_f: fmt(cov("COV_F")?.limit_primary_cents ?? null),
    deductible: fmt(cov("COV_A")?.deductible_cents ?? null),
  };
}

export function homeFormValuesToPolicyInsert(
  values: HomePolicyFormValues,
  householdId: string
): Omit<PolicyRow, "id" | "created_at" | "updated_at"> {
  return {
    household_id: householdId,
    policy_type: "home",
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

export function homeFormValuesToCoverageInserts(
  values: HomePolicyFormValues,
  policyId: string
): Omit<PolicyCoverageRow, "id" | "created_at" | "updated_at">[] {
  const deductibleCents = parseDollarsToCents(values.deductible);

  const covs: Array<{
    code: string;
    amtField: string;
    includeDeductible?: boolean;
  }> = [
    { code: "COV_A", amtField: values.coverage_a, includeDeductible: true },
    { code: "COV_B", amtField: values.coverage_b },
    { code: "COV_C", amtField: values.coverage_c },
    { code: "COV_D", amtField: values.coverage_d },
    { code: "COV_E", amtField: values.coverage_e },
    { code: "COV_F", amtField: values.coverage_f },
  ];

  return covs
    .filter((c) => c.amtField.trim() !== "")
    .map((c) => ({
      policy_id: policyId,
      coverage_code: c.code,
      included: true,
      limit_primary_cents: parseDollarsToCents(c.amtField),
      limit_secondary_cents: null,
      limit_split_raw: null,
      deductible_cents: c.includeDeductible ? deductibleCents : null,
      deductible_pct: null,
      deductible_pct_basis: null,
      valuation_basis: null,
      notes: null,
    }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface HomePolicyFormProps {
  defaultValues?: HomePolicyFormValues;
  onSave: (values: HomePolicyFormValues) => void | Promise<void>;
  onCancel?: () => void;
  saving?: boolean;
}

export function HomePolicyForm({
  defaultValues,
  onSave,
  onCancel,
  saving = false,
}: HomePolicyFormProps) {
  const form = useForm<HomePolicyFormValues>({
    resolver: zodResolver(HomePolicyFormSchema),
    defaultValues: defaultValues ?? {
      label: "My Home Policy",
      insurer_label: "",
      amount_display: "",
      amount_basis: "per_year",
      term_months: "12",
      installments_per_year: undefined,
      coverage_a: "",
      coverage_b: "",
      coverage_c: "",
      coverage_d: "",
      coverage_e: "",
      coverage_f: "",
      deductible: "",
    },
  });

  const amountBasis = form.watch("amount_basis");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
        {/* Policy details */}
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
                    <Input placeholder="My Current Home Policy" {...field} />
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
                    <Input placeholder="e.g. Farmers" {...field} />
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
                    <Input placeholder="e.g. 1800.00" {...field} />
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
                      <SelectItem value="per_year">Per year</SelectItem>
                      <SelectItem value="per_term">Per term</SelectItem>
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

        {/* Coverage amounts */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold">Coverage limits</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              From your declarations page. Leave blank if not applicable.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                name: "coverage_a" as const,
                label: "Coverage A — Dwelling",
                hint: "Your home's structure",
              },
              {
                name: "coverage_b" as const,
                label: "Coverage B — Other Structures",
                hint: "Fences, detached garage, etc.",
              },
              {
                name: "coverage_c" as const,
                label: "Coverage C — Personal Property",
                hint: "Furniture, electronics, clothing",
              },
              {
                name: "coverage_d" as const,
                label: "Coverage D — Loss of Use",
                hint: "Living expenses while home is repaired",
              },
              {
                name: "coverage_e" as const,
                label: "Coverage E — Liability",
                hint: "If someone is injured on your property",
              },
              {
                name: "coverage_f" as const,
                label: "Coverage F — Medical Payments",
                hint: "No-fault coverage for visitors",
              },
            ].map(({ name, label, hint }) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 300000" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      {hint}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>

          <FormField
            control={form.control}
            name="deductible"
            render={({ field }) => (
              <FormItem className="sm:max-w-[calc(50%-0.5rem)]">
                <FormLabel>Deductible</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 1000" {...field} />
                </FormControl>
                <FormDescription className="text-xs">
                  Amount you pay before insurance kicks in
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
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
