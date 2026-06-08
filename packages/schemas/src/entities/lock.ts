import { z } from 'zod';
import { entityIdSchema, isoDateTimeSchema } from '../common.ts';

export const lockSchemaVersionSchema = z
  .literal('0.1.0')
  .describe(
    'Lock schema version (ADR 0071; non-minted Ring 0 entity; D-069). New entities start at 0.1.0.',
  );

export const lockKindSchema = z
  .enum(['package_manager_global', 'host_mutation_global', 'unknown'])
  .describe(
    'The CLOSED coarse-mutex class (ADR 0071): `package_manager_global` (e.g. the mise/brew global install lock), `host_mutation_global` (a host-wide write mutex), or `unknown` (the universal house sentinel). A descriptive FACT that Ring 1 policy READS as input, never a trust verdict or policy content the entity carries (inv. 1). Distinct from the per-resource `Lease` scope — a Lock is a COARSE named mutex, not a specific resource. Widening via the registered §Procedure rule.',
  );

export const lockStatusSchema = z
  .enum(['held', 'released'])
  .describe(
    'Lock lifecycle status. Named `lock_status`, NOT `lock_state`, to avoid the shipped same-name `GitWorktreeObservation.payload.lock_state` (`gitWorktreeLockStateSchema`, a semantically different git-worktree posture). `released` is a valid historical record, NOT a policy-denied state. Acquire/release transitions, holder-only release, and mutual-exclusion enforcement are Ring 1 obligations.',
  );

export const lockSourceProvenanceSchema = z
  .object({
    authority: z
      .literal('lock_declaration')
      .describe(
        'Declaration-site marker (a coordination record, NOT an observation); deliberately DISJOINT from evidenceAuthoritySchema and conferring no authority by itself. Sourcing the holder + lock_status from host-authoritative coordination state, and NOT promoting a sandbox-observed holder or status to a host-authoritative Lock (charter inv. 8), are Ring 1 producer obligations, not encoded here.',
      ),
    observed_at: isoDateTimeSchema,
  })
  .strict()
  .describe(
    'Binds a Lock declaration to its declaration site. Carries no secret/sensitive material. Mirrors the Artifact / ToolInstallation non-minted provenance pattern.',
  );

export const lockSchema = z
  .object({
    schema_version: lockSchemaVersionSchema,
    lock_id: entityIdSchema.describe(
      'Stable Lock id. SHOULD be opaque/derived — `entityIdSchema` accepts a raw machine-ish shape, which Ring 0 cannot reject (a Ring-0 denylist would violate inv. 1), so id-opacity is a Ring 1 producer obligation (recorded accept-and-trap, mirroring the storage-primitive peers).',
    ),
    lock_kind: lockKindSchema,
    held_by_session_id: entityIdSchema.describe(
      'REQUIRED FK to the `Session` (ADR 0055) that holds the lock. Reuses `Lease.held_by_session_id` (same semantic — held by a session); the `_id` (not `_ref`) suffix is correct (required, monomorphic, target exists). FK existence is a Ring 1 obligation.',
    ),
    lock_status: lockStatusSchema,
    source_provenance: lockSourceProvenanceSchema,
  })
  .strict()
  .describe(
    'Ring 0 Lock entity from ADR 0071 (D-069). A NON-MINTED coarse-mutex coordination record (the second storage primitive) — the COARSE, lighter, non-minted cousin of the MINTED Lease (ADR 0052): a named global/coarse mutex (e.g. the package-manager global lock), carrying NONE of the Lease minting/authorization machinery (no audit_chain_link_hash, no producer-mint field, no evidence_refs, no per-resource scope, no force_break_grant_id; absent from the ADR 0057 mint scope) so it cannot stand in for or bypass a Lease. lock_id + a CLOSED lock_kind enum + a REQUIRED held_by_session_id FK to Session (reusing the Lease FK name, same semantic) + a lock_status (held|released; named lock_status NOT lock_state, which is the shipped GitWorktreeObservation.payload.lock_state) + a .strict() source_provenance (disjoint lock_declaration authority). A lock is a coordination FACT and a read-only policy INPUT to Ring 1, never policy content (inv. 1). Fulfills the pre-reserved Evidence.subject_kind `lock` with no Evidence schema change. Mutual-exclusion enforcement (one held Lock per lock_kind), acquire/release transitions, holder-only release, held_by_session_id FK existence, holder + lock_status sandbox non-promotion (inv. 8), lock_id opacity, and supersession are Ring 1 obligations.',
  );

export type Lock = z.infer<typeof lockSchema>;
export type LockKind = z.infer<typeof lockKindSchema>;
export type LockStatus = z.infer<typeof lockStatusSchema>;
export type LockSourceProvenance = z.infer<typeof lockSourceProvenanceSchema>;
