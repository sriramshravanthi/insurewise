import { z } from "zod";
import { ProvenanceSchema } from "./provenance";

// docs/CALCULATIONS.md §4: a rule is
// {id, appliesTo, requiredInputs, condition, severity, messageTemplateId,
// sourceIds, parameters}. `condition` is data (docs/DATA-MODEL.md: "rules
// are data"), never executable code.
export const ConditionOperatorSchema = z.enum([
  "gt",
  "gte",
  "lt",
  "lte",
  "eq",
  "ne",
]);
export type ConditionOperator = z.infer<typeof ConditionOperatorSchema>;

export interface ComparisonCondition {
  kind: "comparison";
  /** Key into the evaluation inputs record. */
  inputKey: string;
  operator: ConditionOperator;
  /** A literal, or a reference to one of the rule's own declared parameters. */
  value: number | { parameterKey: string };
}

export type Condition =
  | ComparisonCondition
  | { kind: "and"; conditions: Condition[] }
  | { kind: "or"; conditions: Condition[] }
  | { kind: "not"; condition: Condition };

const ConditionValueSchema = z.union([
  z.number(),
  z.object({ parameterKey: z.string().min(1) }),
]);

const ComparisonConditionSchema = z.object({
  kind: z.literal("comparison"),
  inputKey: z.string().min(1),
  operator: ConditionOperatorSchema,
  value: ConditionValueSchema,
});

export const ConditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    ComparisonConditionSchema,
    z.object({
      kind: z.literal("and"),
      conditions: z.array(ConditionSchema).min(1),
    }),
    z.object({
      kind: z.literal("or"),
      conditions: z.array(ConditionSchema).min(1),
    }),
    z.object({ kind: z.literal("not"), condition: ConditionSchema }),
  ]),
);

// "Parameters that encode judgment ... carry provenance: Illustrative and a
// rationale, or the rule is not shipped" — enforced here, not left to the
// evaluator to notice.
export const RuleParameterSchema = z
  .object({
    value: z.number(),
    provenance: ProvenanceSchema,
    rationale: z.string().min(1).optional(),
  })
  .refine((p) => p.provenance !== "illustrative" || p.rationale !== undefined, {
    message:
      "An Illustrative parameter must carry a rationale, or the rule should not be shipped.",
    path: ["rationale"],
  });
export type RuleParameter = z.infer<typeof RuleParameterSchema>;

export const ReviewRuleAppliesToSchema = z.enum(["car", "home", "both"]);

export const ReviewRuleSchema = z.object({
  id: z.string().min(1),
  appliesTo: ReviewRuleAppliesToSchema,
  requiredInputs: z.array(z.string().min(1)).min(1),
  condition: ConditionSchema,
  severity: z.string().min(1),
  messageTemplateId: z.string().min(1),
  sourceIds: z.array(z.string().min(1)).min(1),
  parameters: z.record(z.string(), RuleParameterSchema),
});
export type ReviewRule = z.infer<typeof ReviewRuleSchema>;
