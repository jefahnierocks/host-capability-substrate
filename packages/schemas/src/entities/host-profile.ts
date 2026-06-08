import { z } from 'zod';
import { entityIdSchema, isoDateTimeSchema, sha256DigestSchema } from '../common.ts';

export const hostProfileSchemaVersionSchema = z
  .literal('0.1.0')
  .describe(
    'HostProfile schema version (ADR 0066; non-minted Ring 0 entity; D-064). New entities start at 0.1.0.',
  );

export const hostProfileStateSchema = z
  .enum(['active', 'retired'])
  .describe(
    'HostProfile lifecycle. A materially-changed host produces a NEW `active` HostProfile and retires the prior (a Ring 1 supersession obligation); `retired` is a valid historical record, NOT a policy-denied state.',
  );

export const hostProfileOsNameSchema = z
  .enum(['macos', 'linux', 'windows', 'unknown'])
  .describe('Host OS family (ADR 0066). Widening via the registered §Procedure rule.');

export const hostProfileArchSchema = z
  .enum(['arm64', 'x86_64', 'unknown'])
  .describe('Host CPU architecture (ADR 0066). Widening via the registered §Procedure rule.');

export const hostProfileOsVersionSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9._+-]+$/)
  .describe(
    'Observed host OS version string (e.g. `26.5`). No whitespace, no `/`, no `:` (so no `://` / `op://`), no path/secret shape; bounded length. A version FACT, never an identity field. Ring 0 cannot bar a UUID/hex shape here without a policy denylist (inv. 1) — `host_identity.digest` is the `sha256:`-locked identity field.',
  );

export const hostProfileHostIdentityKindSchema = z
  .enum(['platform_uuid_sha256', 'install_id_sha256', 'unknown'])
  .describe(
    'What stable identifier `host_identity.digest` was computed over: `platform_uuid_sha256` = SHA-256 of the platform UUID; `install_id_sha256` = SHA-256 of a per-install HCS id (the always-derivable fallback); `unknown` = unclassified, but still a real digest.',
  );

export const hostProfileHostIdentitySchema = z
  .object({
    kind: hostProfileHostIdentityKindSchema,
    digest: sha256DigestSchema.describe(
      'A NON-REVERSIBLE sha256 digest of the stable identifier — NEVER the raw serial / UUID / machine-id. The `sha256:` shape structurally bars a raw identifier from landing here (charter sensitive-data discipline).',
    ),
  })
  .strict()
  .describe(
    'The host fingerprint: a `kind` + a non-reversible `sha256:` digest, always present. NEVER stores a raw machine identifier.',
  );

export const hostProfileSourceProvenanceSchema = z
  .object({
    authority: z
      .literal('host_profile_declaration')
      .describe(
        'Declaration-site marker (a durable record, NOT an observation); deliberately DISJOINT from evidenceAuthoritySchema and conferring no authority by itself. Installed-runtime sourcing + non-sandbox authority (charter inv. 8) are Ring 1 producer obligations, not encoded here.',
      ),
    observed_at: isoDateTimeSchema,
  })
  .strict()
  .describe(
    'Binds a HostProfile declaration to its declaration site. Carries no secret/sensitive material.',
  );

export const hostProfileSchema = z
  .object({
    schema_version: hostProfileSchemaVersionSchema,
    host_profile_id: entityIdSchema.describe(
      'Stable HostProfile id. MUST be opaque/derived, NOT the raw machine identifier — Ring 0 cannot reject a raw-UUID shape (`entityIdSchema` accepts it), so non-raw-id is a Ring 1 producer obligation (recorded accept-and-trap).',
    ),
    host_state: hostProfileStateSchema,
    os_name: hostProfileOsNameSchema,
    os_version: hostProfileOsVersionSchema,
    arch: hostProfileArchSchema,
    host_identity: hostProfileHostIdentitySchema,
    source_provenance: hostProfileSourceProvenanceSchema,
  })
  .strict()
  .describe(
    'Ring 0 HostProfile entity from ADR 0066 (D-064). A NON-MINTED canonical host identity + stable facts record (structural peer of Capability/SecretReference), closing `RunnerHostObservation.host_id` (ADR 0032) with NO RunnerHostObservation shape change. The host fingerprint lives only as a non-reversible `sha256:` digest in `host_identity.digest` (a raw serial/UUID cannot land there); `host_profile_id`-opaque, installed-runtime + non-sandbox observation (inv. 8), digest computation, FK existence, and supersession are Ring 1 obligations. No `audit_chain_link_hash`, no producer-mint field, no `evidence_refs`; absent from the ADR 0057 mint scope. Host facts are read-only policy INPUTS to Ring 1, never policy content (inv. 1).',
  );

export type HostProfile = z.infer<typeof hostProfileSchema>;
export type HostProfileState = z.infer<typeof hostProfileStateSchema>;
export type HostProfileOsName = z.infer<typeof hostProfileOsNameSchema>;
export type HostProfileArch = z.infer<typeof hostProfileArchSchema>;
export type HostProfileHostIdentityKind = z.infer<typeof hostProfileHostIdentityKindSchema>;
export type HostProfileHostIdentity = z.infer<typeof hostProfileHostIdentitySchema>;
export type HostProfileSourceProvenance = z.infer<typeof hostProfileSourceProvenanceSchema>;
