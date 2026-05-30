import { z } from 'zod';
import { entityIdSchema, isoDateTimeSchema, sha256DigestSchema } from '../common.ts';
import { operationShapeOperationClassSchema } from './operation-shape.ts';

export const capabilitySchemaVersionSchema = z
  .literal('0.1.0')
  .describe('Capability schema version. New entities start at 0.1.0.');

export const capabilityOperationNameSchema = z
  .string()
  .regex(/^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9_]*)+$/)
  .describe(
    'A declared kernel operation name (e.g. `service.activate`): a lowercase dotted identifier of at least two segments. Intentionally DISTINCT from `operation_class` (a closed enum) — the schema does not constrain one to the other; an operation_class groups many operation_names. The first segment forbids `_`; later segments allow it. The regex forbids path/URI/secret shapes by construction (no `/`, no `://`, no `op://`). It is not a secret value.',
  );

export const capabilityStateSchema = z
  .enum(['active', 'deprecated', 'retired'])
  .describe(
    'Capability registry lifecycle. `active` = renderable; `deprecated` = registered but render-refused (charter inv. 11, enforced by the CommandShape renderer, NOT this schema); `retired` = retained historical record, render-refused. Deliberately DISJOINT from the BoundaryObservation capability-STATE observation vocabulary (sense 3) and the AgentClient containment-class axis (sense 2).',
  );

export const capabilitySourceRegistryPathSchema = z
  .string()
  .regex(/^(?!.*\.\.)[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/)
  .describe(
    'Relative path to the capability-registry blob a Capability declaration was read from. No `..` traversal, no absolute path, no URI scheme. It is not a secret value.',
  );

export const capabilitySourceProvenanceSchema = z
  .object({
    authority: z
      .literal('capability_registry')
      .describe(
        'Source-of-truth marker; deliberately disjoint from evidenceAuthoritySchema and confers no authority by itself.',
      ),
    source_registry_path: capabilitySourceRegistryPathSchema,
    source_registry_sha256: sha256DigestSchema.describe(
      'Digest of the bound capability-registry blob. Format-only at Ring 0; the digest-vs-bound-registry trust check is a Ring 1 capability-registration obligation.',
    ),
    source_registry_sha256_basis: z.literal('capability_registry_blob'),
    observed_at: isoDateTimeSchema,
  })
  .strict()
  .describe(
    'Binds a Capability declaration to the capability-registry blob it was read from. Mirrors PolicyRule.source_provenance.',
  );

export const capabilitySchema = z
  .object({
    schema_version: capabilitySchemaVersionSchema,
    capability_id: entityIdSchema,
    operation_name: capabilityOperationNameSchema,
    operation_class: operationShapeOperationClassSchema,
    capability_state: capabilityStateSchema,
    source_provenance: capabilitySourceProvenanceSchema,
  })
  .strict()
  .describe(
    'A non-minted Ring-0 registry declaration of a known kernel operation (ADR 0062). NOT minted, NOT audit-chain-committed.',
  );

export type Capability = z.infer<typeof capabilitySchema>;
export type CapabilitySourceProvenance = z.infer<typeof capabilitySourceProvenanceSchema>;
export type CapabilityState = z.infer<typeof capabilityStateSchema>;
