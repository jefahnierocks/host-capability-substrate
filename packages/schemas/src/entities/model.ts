import { z } from 'zod';
import { entityIdSchema, isoDateTimeSchema } from '../common.ts';

export const modelSchemaVersionSchema = z
  .literal('0.1.0')
  .describe(
    'Model schema version (ADR 0076; non-minted Ring 0 entity; D-077). New entities start at 0.1.0.',
  );

export const modelVendorSchema = z
  .enum(['anthropic', 'openai', 'google', 'unknown'])
  .describe(
    'Who built the model (ADR 0076): `anthropic`, `openai`, `google`, or `unknown` (the universal house sentinel). A descriptive FACT Ring 1 policy READS as input, never a trust verdict or policy content (inv. 1). Distinct from AgentClient.product_family (the harness/product, not the model vendor). Widening via the registered §Procedure rule.',
  );

export const modelRuntimeFamilySchema = z
  .enum(['claude', 'codex', 'gemini_adk', 'unknown'])
  .describe(
    'The agent runtime/family the model belongs to (ADR 0076): `claude`, `codex`, `gemini_adk`, or `unknown`. This is the durable axis the de-versioning rule (ADR 0075) names everywhere outside the single-source baseline — it does NOT churn like a version. `gemini_adk` is a first-class eval-scope runtime even though it is not (yet) an AgentClient.product_family / ExecutionContext surface. A descriptive FACT, never a verdict (inv. 1). Widening via the registered §Procedure rule.',
  );

export const modelPinFormSchema = z
  .enum(['alias', 'exact_id', 'profile_handle'])
  .describe(
    'How the model is pinned (ADR 0076; the typed Fable lesson): `alias` (e.g. `opus` — resolves to the latest matching model at runtime; survives vendor retraction/rename; the post-D-075 default), `exact_id` (e.g. `claude-opus-4-8` — fails closed; a rationale-bearing exception per inv. 12, so `pin_form: exact_id` SHOULD carry a `decision_ledger_row` — a Ring 1 obligation, accepted at Ring 0), or `profile_handle` (e.g. the Codex `hcs-implement` profile — the resolution mechanism on the Codex side). A descriptive FACT, never a verdict (inv. 1).',
  );

export const modelStateSchema = z
  .enum(['announced', 'active', 'deprecated', 'retracted', 'superseded'])
  .describe(
    'Model lifecycle (ADR 0076): `announced`, `active`, `deprecated`, `retracted` (the vendor un-shipped it — the Fable-5 case), or `superseded` (rolled over to a successor). A re-baseline produces a NEW `active` Model and transitions the prior; a retraction is ONE typed transition (not the D-071->D-076 prose scramble). Uses the `_state` lifecycle-suffix convention (peer of host_state / capability_state / budget_state / ...); `deprecated`/`retracted`/`superseded` are valid historical records, NOT policy-denied states (a retracted-model guard is a Ring 1 obligation, never Ring 0 content — inv. 1).',
  );

export const modelSourceAuthoritySchema = z
  .enum(['vendor_published', 'observed_runtime', 'operator_attested'])
  .describe(
    "Declaration-site provenance class for a Model record (ADR 0076), typing the inv-14 authority order: `observed_runtime` (the top rung — backed by a `subject_kind: model` Evidence record, e.g. an alias resolved against `claude --version`/`codex --version`), `vendor_published` (static vendor docs / a model card), or `operator_attested` (a fresh human observation, ABOVE model-memory). DISJOINT from evidenceAuthoritySchema and conferring no authority by itself; the relative ordering is a Ring 1 obligation. This is HCS's first non-minted entity whose declaration-site authority is a multi-value enum rather than a single literal — justified by the provenance split (G5).",
  );

export const modelSourceProvenanceSchema = z
  .object({
    authority: modelSourceAuthoritySchema,
    observed_at: isoDateTimeSchema,
    valid_until: isoDateTimeSchema.nullable().optional(),
  })
  .strict()
  .describe(
    'Binds a Model declaration to its declaration site (ADR 0076). Carries no secret/sensitive material. Mirrors the HostProfile / ResourceBudget non-minted provenance pattern, but with a multi-value `authority` (the inv-14 split). Observed-runtime sourcing and NOT promoting a sandbox-observed model fact to host-authoritative (charter inv. 8) are Ring 1 producer obligations, not encoded here.',
  );

export const modelSchema = z
  .object({
    schema_version: modelSchemaVersionSchema,
    model_id: entityIdSchema.describe(
      'Stable Model id. SHOULD be opaque/derived — `entityIdSchema` accepts a raw shape, which Ring 0 cannot reject (a Ring-0 denylist would violate inv. 1), so id-opacity is a Ring 1 producer obligation (recorded accept-and-trap, mirroring the HostProfile / storage-primitive peers).',
    ),
    vendor: modelVendorSchema,
    runtime_family: modelRuntimeFamilySchema,
    tier: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[A-Za-z0-9._+-]+$/)
      .nullable()
      .optional()
      .describe(
        'The model capability RUNG (e.g. `opus`, `sonnet`, `haiku`) — NOT a policy tier (the live policy tiers are read-safe/write-local/.../forbidden; this is vocabulary-disjoint and carries no verdict, inv. 1). Bounded token on `/^[A-Za-z0-9._+-]+$/` (no whitespace, no `/`/`:`, so no `://`/`op://`). Nullable-optional — absent/null when unclassified.',
      ),
    pin_form: modelPinFormSchema,
    pin_value: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[A-Za-z0-9._+-]+$/)
      .describe(
        'What is configured as the pin: an alias (`opus`), an exact model id (`claude-opus-4-8`), or a profile handle (`hcs-implement`), per `pin_form`. Bounded token; no path/secret shape. The `[1m]` context suffix is NOT stored here as a bracketed literal — it is parsed into `context_window` (the D-072 exact-string brittleness, structurally fixed).',
      ),
    resolved_model_name: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[A-Za-z0-9._+-]+$/)
      .nullable()
      .optional()
      .describe(
        'The concrete model the pin resolves to (e.g. `claude-opus-4-8`). Nullable-optional — null until observed (the alias/profile case); when present it is an observed-runtime fact whose backing lives in a `subject_kind: model` Evidence record (inv. 14). A divergence between `pin_value` (alias) and `resolved_model_name` over time is the typed surface for a silent vendor rollover (G4).',
      ),
    context_window: z
      .number()
      .int()
      .positive()
      .nullable()
      .optional()
      .describe(
        'Context-window size in tokens, typed as DATA (e.g. the `1m` from a `[1m]` id suffix). A positive integer FACT; nullable-optional when unknown. The only model-card attribute carried at v1 (modalities/knowledge_cutoff/pricing/dates are a deferred additive slice).',
      ),
    model_state: modelStateSchema,
    supersedes_model_id: entityIdSchema
      .nullable()
      .optional()
      .describe(
        'Nullable-optional self-FK to the Model this one supersedes — reproduces the re-baseline chain (D-054 -> D-071 -> D-072 -> D-075) as QUERYABLE history. FK existence + opacity are Ring 1 obligations.',
      ),
    decision_ledger_row: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[A-Za-z0-9._+-]+$/)
      .nullable()
      .optional()
      .describe(
        'The `DECISIONS.md` re-baseline row id (e.g. `D-075`) that is the authority of record for this baseline. NOT a typed FK to the Decision entity (so NOT `_ref`): a bounded ledger-row token. This is the typed anchor to the ADR 0075 / inv-12 single-source authority of record — the Model record MIRRORS that authority via this field, it does NOT replace it. Nullable-optional.',
      ),
    source_provenance: modelSourceProvenanceSchema,
  })
  .strict()
  .describe(
    'Ring 0 Model entity from ADR 0076 (D-077). A NON-MINTED, first-class typed record of a served LLM/agent model — identity (vendor / runtime_family / tier), the typed pin form (alias / exact_id / profile_handle + pin_value + resolved_model_name; context_window types the `[1m]` suffix), a model_state lifecycle (announced/active/deprecated/retracted/superseded) + supersedes_model_id self-FK, a typed decision_ledger_row anchor to the AGENTS.md §Tool baseline authority of record, and a .strict() source_provenance with the inv-14 authority split. It COMPLETES ADR 0075 (single-sourced the model STRING in prose) by making the model an object; it MIRRORS, never competes with, the AGENTS.md §Tool baseline + DECISIONS.md re-baseline-row authority of record (project.yaml "never a competing authority" framing). A model is a host/vendor FACT and a read-only policy INPUT to Ring 1, never policy content (inv. 1). Observed via `subject_kind: model` Evidence (the ToolInstallation/ResolvedTool pattern). No `audit_chain_link_hash`, no producer-mint field, no `evidence_refs`; absent from the ADR 0057 mint scope. model_id / supersedes_model_id opacity + FK existence, sandbox non-promotion (inv. 8), the `pin_form: exact_id => decision_ledger_row` rule, the retracted-model guard + inv-12 floor-rejection, and the pin_value -> resolved_model_name resolver are Ring 1 obligations.',
  );

export type Model = z.infer<typeof modelSchema>;
export type ModelVendor = z.infer<typeof modelVendorSchema>;
export type ModelRuntimeFamily = z.infer<typeof modelRuntimeFamilySchema>;
export type ModelPinForm = z.infer<typeof modelPinFormSchema>;
export type ModelState = z.infer<typeof modelStateSchema>;
export type ModelSourceAuthority = z.infer<typeof modelSourceAuthoritySchema>;
export type ModelSourceProvenance = z.infer<typeof modelSourceProvenanceSchema>;
