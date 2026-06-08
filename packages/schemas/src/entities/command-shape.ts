import { z } from 'zod';
import { entityIdSchema, envVariableNameSchema } from '../common.ts';

export const commandShapeSchemaVersionSchema = z
  .literal('0.1.0')
  .describe(
    'CommandShape schema version (ADR 0063; non-minted Ring 0 entity; D-061). New-entity introduction at 0.1.0; not a breaking bump.',
  );

const commandShapeEnvSecretReferenceSourceSchema = z
  .object({
    kind: z.literal('secret_reference'),
    secret_reference_ref: entityIdSchema.describe(
      'Typed FK to the SecretReference entity (built by ADR 0065 / D-063); follows the `_ref` optional/forward cross-record-FK precedent, not the resolvable `_id` suffix. FK existence verification remains a Ring 1 obligation. An opaque reference id — NOT a secret value, NOT an `op://` URI, NOT a resolved token. The Ring 1 broker resolves the value at execution time.',
    ),
  })
  .strict();

const commandShapeEnvInheritedSourceSchema = z
  .object({
    kind: z.literal('execution_context_inherited'),
  })
  .strict();

export const commandShapeEnvValueSourceSchema = z
  .discriminatedUnion('kind', [
    commandShapeEnvSecretReferenceSourceSchema,
    commandShapeEnvInheritedSourceSchema,
  ])
  .describe(
    'Typed source of an env variable VALUE, discriminated on `kind`. `secret_reference` carries an opaque `secret_reference_ref` (resolved by the Ring 1 broker at execution time); `execution_context_inherited` stores no value (inherited from the target execution context at execution time). NO variant carries an inline resolved value (charter inv. 5).',
  );

export const commandShapeEnvEntrySchema = z
  .object({
    name: envVariableNameSchema,
    value_source: commandShapeEnvValueSourceSchema,
  })
  .strict()
  .describe(
    'One environment entry: a variable NAME plus a typed value-SOURCE reference. The value itself is never stored at Ring 0 (charter inv. 5).',
  );

export const commandShapeCwdSchema = z
  .string()
  .regex(/^(?!.*\.\.)\/?[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/)
  .describe(
    'Working-directory path for the plan. Optional leading `/` (absolute) or relative; no `..` traversal, no URI scheme, no secret shape. Ring 0 cannot know the allowed roots — confining `cwd` to permitted roots (e.g. blocking `/etc`, `/Users/.../.ssh`) is a Ring 1 broker obligation. It is not a secret value.',
  );

export const commandShapeSchema = z
  .object({
    schema_version: commandShapeSchemaVersionSchema,
    command_shape_id: entityIdSchema,
    operation_shape_ref: entityIdSchema.describe(
      'Typed FK to the OperationShape this plan was rendered from (the render source and provenance). A bare format-validated id at Ring 0; FK existence + the OperationShape.operation_class linkage (so the gateway can resolve the governing PolicyRule/Capability) are Ring 1 obligations. `operation_class` is intentionally NOT echoed onto CommandShape — it is derivable via this FK and would otherwise duplicate live-policy-adjacent content (charter inv. 1).',
    ),
    argv: z
      .array(z.string().min(1))
      .min(1)
      .describe(
        'Typed argv VECTOR; `argv[0]` is the executable, every element a non-empty string. There is NO shell-string field anywhere on the entity (charter inv. 2): the plan is a typed vector by construction and can never be a shell string. NOTE: a flat string vector cannot distinguish a SecretReference / ProviderObjectReference / PublicClientId / PolicySelectorValue / raw secret inside an element — the argument-class distinction (charter line 98) is a deferred Ring 1 gateway obligation, recorded by a seeded regression trap; Ring 0 accepts an inlined secret-shaped element.',
      ),
    env: z
      .array(commandShapeEnvEntrySchema)
      .describe(
        'Environment profile: variable NAMES plus typed value-SOURCE references, never resolved values (charter inv. 5). May be empty. Env `name`s are unique within the array (envelope superRefine).',
      ),
    cwd: commandShapeCwdSchema,
    timeout_seconds: z
      .number()
      .int()
      .positive()
      .max(86400)
      .describe(
        'Bounded positive timeout in seconds. The 86400 (24h) bound is a hard CEILING, not a default and not an authorization; the Ring 1 broker is expected to apply its own tighter per-operation budget (cross-referencing the future ResourceBudget entity). A plan parameter, never an execution trigger.',
      ),
  })
  .strict()
  .superRefine((value, ctx) => {
    const seenEnvNames = new Set<string>();
    for (const [index, entry] of value.env.entries()) {
      if (seenEnvNames.has(entry.name)) {
        ctx.addIssue({
          code: 'custom',
          message: `duplicate env name '${entry.name}' — env entry names must be unique within the array.`,
          path: ['env', index, 'name'],
        });
      }
      seenEnvNames.add(entry.name);
    }
  })
  .describe(
    'Ring 0 CommandShape entity from ADR 0063 (D-061). A NON-MINTED typed PLAN (argv + env + cwd + timeout) rendered from an OperationShape (`operation_shape_ref` provenance). Central boundary: a typed plan, NOT an execution authorization — it carries no execution semantics and unblocks no execute lane (charter inv. 7; the broker stays blocked until the approval-grant + dashboard-review stack exists). No audit_chain_link_hash, no producer-mint field, no evidence_refs (absent from the ADR 0057 mint scope); no operation_class echo. The schema embodies inv. 2 (typed argv vector, no shell string) and inv. 5 (env names + value-source references, no resolved values) and enforces ONLY field formats, argv/env typing, and env-name uniqueness. Deprecated-verb render-refusal (inv. 11), cwd absolute-root confinement, SecretReference FK closure + env value resolution, operation_shape_ref FK existence, the argv argument-class distinction (charter line 98), and lease/approval/dashboard gating are Ring 1 renderer/broker/gateway obligations.',
  );

export type CommandShape = z.infer<typeof commandShapeSchema>;
export type CommandShapeEnvEntry = z.infer<typeof commandShapeEnvEntrySchema>;
export type CommandShapeEnvValueSource = z.infer<typeof commandShapeEnvValueSourceSchema>;
