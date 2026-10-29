"use client";

/**
 * /dashboard/account — Account & household settings.
 *
 * Lets the user:
 *   - View / update their household label and state
 *   - See their email address
 *   - Sign out
 *   - View a summary of what data InsureWise stores
 */

import { useState } from "react";
import { Settings, ShieldCheck, LogOut, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useAuth } from "@/providers/auth-context";
import { signOut } from "@/providers/auth";
import { useHouseholdRow, useUpdateHousehold } from "@/providers/household-context";

// ---------------------------------------------------------------------------
// US states list (abbreviated)
// ---------------------------------------------------------------------------

const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "DC", label: "District of Columbia" },
];

// ---------------------------------------------------------------------------
// Household form
// ---------------------------------------------------------------------------

const HouseholdSchema = z.object({
  label: z.string().min(1, "Enter a name for this household.").max(80),
  state: z.string().length(2, "Select a state."),
  zip5: z.string().regex(/^\d{5}$|^$/, "Enter a 5-digit ZIP or leave blank."),
});

type HouseholdFormValues = z.infer<typeof HouseholdSchema>;

function HouseholdForm() {
  const household = useHouseholdRow();
  const updateHousehold = useUpdateHousehold();
  const [saved, setSaved] = useState(false);

  const form = useForm<HouseholdFormValues>({
    resolver: zodResolver(HouseholdSchema),
    values: {
      label: household?.label ?? "",
      state: household?.state ?? "CA",
      zip5: household?.zip5 ?? "",
    },
  });

  async function onSubmit(values: HouseholdFormValues) {
    if (!household) return;
    await updateHousehold.mutateAsync({
      id: household.id,
      patch: {
        label: values.label,
        state: values.state,
        zip5: values.zip5 || null,
      },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Household name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. The Smith Household" {...field} />
              </FormControl>
              <FormDescription className="text-xs">
                A friendly name to identify this account.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-60">
                    {US_STATES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs">
                  Used to contextualize educational content.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="zip5"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  ZIP code{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 90210" maxLength={5} {...field} />
                </FormControl>
                <FormDescription className="text-xs">
                  5-digit ZIP. Not shared with any third party.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            size="sm"
            disabled={updateHousehold.isPending}
          >
            <Save className="h-4 w-4" />
            {updateHousehold.isPending ? "Saving…" : "Save changes"}
          </Button>
          {saved && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400">
              Saved ✓
            </span>
          )}
        </div>
      </form>
    </Form>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AccountPage() {
  const { user } = useAuth();

  async function handleSignOut() {
    await signOut();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Account
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your household settings and account.
        </p>
      </div>

      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>Your sign-in information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{user?.email ?? "—"}</p>
            </div>
            <Badge variant="secondary" className="text-xs shrink-0">
              Signed in
            </Badge>
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Sign out</p>
              <p className="text-sm text-muted-foreground">
                You can sign back in at any time — your data is saved.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Household settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Household</CardTitle>
          <CardDescription>
            Name and location used to contextualize your insurance data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HouseholdForm />
        </CardContent>
      </Card>

      {/* Data & privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Data & privacy
          </CardTitle>
          <CardDescription>What InsureWise stores and how it is used.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            InsureWise stores only the information you enter: your household
            profile, policies, coverage limits, and vehicle or property details.
          </p>
          <div className="space-y-2">
            {[
              "No real premium quotes are generated — all figures are your own entries.",
              "Your data is stored in Supabase and tied to your account only.",
              "Nothing is shared with insurers, brokers, or data aggregators.",
              "All calculations run in your browser — no data is sent to a third-party AI.",
            ].map((item) => (
              <div key={item} className="flex gap-2">
                <span className="text-primary mt-0.5">•</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
          <p className="text-xs">
            InsureWise is an educational portfolio project. It is not a licensed
            insurance product or service.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
