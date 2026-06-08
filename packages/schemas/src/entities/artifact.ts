import { z } from 'zod';
import { entityIdSchema, isoDateTimeSchema, sha256DigestSchema } from '../common.ts';

export const artifactSchemaVersionSchema = z
  .literal('0.1.0')
  .describe(
    'Artifact schema version (ADR 0070; non-minted Ring 0 entity; D-068). New entities start at 0.1.0.',
  );

export const artifactKindSchema = z
  .enum(['command_diff', 'log_chunk', 'exit_code', 'signed_summary', 'unknown'])
  .describe(
    'The output shape of a run artifact (ADR 0070): a `command_diff`, a `log_chunk`, an `exit_code`, a `signed_summary`, or `unknown` (the universal house sentinel). A descriptive FACT that Ring 1 policy READS as input, never a trust verdict or policy content the entity carries (inv. 1). Widening via the registered §Procedure rule.',
  );

export const artifactSourceProvenanceSchema = z
  .object({
    authority: z
      .literal('artifact_declaration')
      .describe(
        'Declaration-site marker (a durable record, NOT an observation); deliberately DISJOINT from evidenceAuthoritySchema and conferring no authority by itself. Producing the output from host-authoritative inputs + non-sandbox authority (charter inv. 8) are Ring 1 producer obligations, not encoded here.',
      ),
    observed_at: isoDateTimeSchema,
  })
  .strict()
  .describe(
    'Binds an Artifact declaration to its declaration site. Carries no secret/sensitive material. Mirrors the ToolInstallation / ResolvedTool / HostProfile non-minted provenance pattern.',
  );

export const artifactSchema = z
  .object({
    schema_version: artifactSchemaVersionSchema,
    artifact_id: entityIdSchema.describe(
      'Stable Artifact id. SHOULD be opaque/derived — `entityIdSchema` accepts a raw machine-ish shape, which Ring 0 cannot reject (a Ring-0 denylist would violate inv. 1), so id-opacity is a Ring 1 producer obligation (recorded accept-and-trap, mirroring the tool-resolution chain peers).',
    ),
    run_id: entityIdSchema.describe(
      'REQUIRED FK to the `Run` (ADR 0053) that produced the output. The `_id` (not `_ref`) suffix is deliberate per the registry field-name discipline — the reference is required, monomorphic, and its target already exists. FK existence is a Ring 1 obligation.',
    ),
    artifact_kind: artifactKindSchema,
    content_sha256: sha256DigestSchema.describe(
      'The content ADDRESS: a non-reversible sha256 digest of the canonical bytes of the output. NEVER the bytes, NEVER a secret value (inv. 5). The digest is the artifact content identity; the bytes and their storage location are Ring 1 runtime state. The byte_size<->digest cross-consistency and the canonical-encoding rule the digest is taken over are Ring 1 obligations.',
    ),
    byte_size: z
      .number()
      .int()
      .min(0)
      .describe(
        'A non-negative integer size FACT (the encoded byte length of the addressed content). A descriptive fact Ring 1 reads; carries no value/secret. byte_size<->content_sha256 cross-consistency is a Ring 1 obligation.',
      ),
    source_provenance: artifactSourceProvenanceSchema,
  })
  .strict()
  .describe(
    'Ring 0 Artifact entity from ADR 0070 (D-068). A NON-MINTED, DIGEST-ADDRESSED, IMMUTABLE descriptor of a run output (structural peer of ToolInstallation/ResolvedTool/HostProfile, minus their active/retired lifecycle — immutability replaces in-place state). The first storage-primitive entity. Holds content_sha256 (the content ADDRESS) + byte_size (a fact) + artifact_kind + the owning run_id FK + source_provenance; NO inline bytes, NO storage-location pointer, NO inline value, NO lifecycle state. Charter discipline: Ring 0 holds no runtime blobs (they live in Ring 1 runtime state, not the repo) and no secret-shaped values at rest (inv. 5) — the sha256 digest IS the identity. IMMUTABLE: a corrected/re-run output is a NEW Artifact with a NEW digest. Fulfills the pre-reserved Evidence.subject_kind `artifact` with no Evidence schema change. No `audit_chain_link_hash`, no producer-mint field, no `evidence_refs`; absent from the ADR 0057 mint scope. An output is a FACT and a read-only policy INPUT to Ring 1, never policy content (inv. 1). The bytes + storage location, run_id FK existence, content_sha256 digest verification + byte_size<->digest cross-consistency, the canonical-encoding rule, artifact_id opacity, sandbox non-promotion (inv. 8), and retention/GC are Ring 1 obligations.',
  );

export type Artifact = z.infer<typeof artifactSchema>;
export type ArtifactKind = z.infer<typeof artifactKindSchema>;
export type ArtifactSourceProvenance = z.infer<typeof artifactSourceProvenanceSchema>;
