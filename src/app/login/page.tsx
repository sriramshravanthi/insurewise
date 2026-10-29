"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signInWithEmail } from "@/providers/auth";

const schema = z.object({
  email: z.string().email("Enter a valid email address."),
});

type FormValues = z.infer<typeof schema>;

type Phase = "idle" | "sending" | "sent" | "error";

export default function LoginPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: FormValues) {
    setPhase("sending");
    setErrorMsg("");
    const result = await signInWithEmail(values.email);
    if (result.ok) {
      setPhase("sent");
    } else {
      setErrorMsg(result.error ?? "Something went wrong. Try again.");
      setPhase("error");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">InsureWise</CardTitle>
          <CardDescription>
            Understand your insurance — no agent required.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {phase === "sent" ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center dark:border-emerald-800 dark:bg-emerald-950">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                Check your inbox ✓
              </p>
              <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                We emailed you a magic link. Click it to sign in — no password
                needed.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 text-emerald-700 dark:text-emerald-300"
                onClick={() => {
                  setPhase("idle");
                  form.reset();
                }}
              >
                Use a different email
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          autoComplete="email"
                          autoFocus
                          disabled={phase === "sending"}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {phase === "error" && errorMsg && (
                  <p className="text-sm text-destructive">{errorMsg}</p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={phase === "sending"}
                >
                  {phase === "sending" ? "Sending link…" : "Send magic link"}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  We&apos;ll email you a one-click sign-in link.
                  <br />
                  No password, no spam.
                </p>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
