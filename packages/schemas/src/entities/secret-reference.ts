import { z } from 'zod';
import { entityIdSchema, envVariableNameSchema, isoDateTimeSchema } from '../common.ts';

export const secretReferenceSchemaVersionSchema = z
  .literal('0.1.0')
  .describe(
    'SecretReference schema version (ADR 0065; non-minted Ring 0 entity; D-063). New entities start at 0.1.0.',
  );

export const secretReferenceReferenceKindSchema = z
  .enum(['op_uri', 'hcs_uri', 'keychain_item', 'env_var_name', 'broker_handle'])
  .describe(
    'The form of the secret reference (ADR 0065). `op_uri` (`op://vault/item[/field]`) and `keychain_item` (`keychain://service/account`) are STRUCTURED — Ring 0 structurally rejects a mis-shaped or raw-value locator. `env_var_name` (an env var NAME), `hcs_uri` (`hcs://<opaque>`), and `broker_handle` (`hcs-broker:<opaque>`) are PERMISSIVE — a token-shaped value can satisfy the grammar, so Ring 0 ACCEPTS it (a recorded accept-and-trap gap; the deep reference-vs-secret check is a Ring 1 broker obligation, charter inv. 5). The locator NEVER holds a resolved value.',
  );

type SecretReferenceReferenceKindLiteral = z.infer<typeof secretReferenceReferenceKindSchema>;

// Per-kind reference-shape validation for the scheme-prefixed kinds. `env_var_name`
// is validated separately by reusing `envVariableNameSchema` (no redefinition).
const referenceLocatorPatternByKind: Record<
  Exclude<SecretReferenceReferenceKindLiteral, 'env_var_name'>,
  RegExp
> = {
  op_uri: /^op:\/\/[^/\s]+\/[^/\s]+(?:\/[^/\s]+)*$/,
  hcs_uri: /^hcs:\/\/\S+$/,
  keychain_item: /^keychain:\/\/[^/\s]+\/[^/\s]+$/,
  broker_handle: /^hcs-broker:\S+$/,
};

export const secretReferenceSourceProvenanceSchema = z
  .object({
    authority: z
      .literal('secret_reference_declaration')
      .describe(
        'Declaration-site marker; deliberately DISJOINT from evidenceAuthoritySchema and conferring no authority by itself.',
      ),
    observed_at: isoDateTimeSchema,
  })
  .strict()
  .describe(
    'Binds a SecretReference declaration to its declaration site. Lighter than the registry-bound PolicyRule/Capability provenance (no source-blob digest): a SecretReference is constructed per-use, not read from a hash-bound blob. Carries no secret material.',
  );

export const secretReferenceSchema = z
  .object({
    schema_version: secretReferenceSchemaVersionSchema,
    secret_reference_id: entityIdSchema,
    reference_kind: secretReferenceReferenceKindSchema,
    reference_locator: z
      .string()
      .min(1)
      .describe(
        'The opaque secret REFERENCE, validated per reference_kind by the envelope superRefine. NEVER a resolved value (charter inv. 5): `op://` is a reference URI, `env_var_name` is a NAME, etc. For the permissive kinds a token-shaped value can pass (recorded accept-and-trap); the deep reference-vs-secret check and resolution are Ring 1 broker obligations.',
      ),
    credential_source_ref: entityIdSchema
      .nullable()
      .optional()
      .describe(
        'Optional FK to a durable CredentialSource (ADR 0018) backing this reference. The `_ref` suffix follows the optional/forward cross-record-FK precedent (`grantor_principal_ref` / `policy_rule_ref` / `operation_shape_ref`); intentionally distinct from the kernel-set `BoundaryObservation.credential_source_id`. FK existence and the `reference_locator`-vs-bound-source resolution precedence are Ring 1 obligations.',
      ),
    source_provenance: secretReferenceSourceProvenanceSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    const { reference_kind: kind, reference_locator: locator } = value;
    const ok =
      kind === 'env_var_name'
        ? envVariableNameSchema.safeParse(locator).success
        : referenceLocatorPatternByKind[kind].test(locator);
    if (!ok) {
      // Do NOT echo the locator value — for the permissive kinds it could be
      // secret-shaped (charter: never echo secret-shaped values). Cite the kind only.
      ctx.addIssue({
        code: 'custom',
        message: `reference_locator does not match the required reference shape for reference_kind '${kind}'.`,
        path: ['reference_locator'],
      });
    }
  })
  .describe(
    'Ring 0 SecretReference entity from ADR 0065 (D-063). A NON-MINTED typed secret reference (structural peer of PolicyRule/Capability/CommandShape): a `reference_kind` plus an opaque `reference_locator` that NEVER holds a value (charter inv. 5), an optional `credential_source_ref` FK to the durable CredentialSource (ADR 0018), and a `.strict()` `source_provenance`. Closes `CommandShape.secret_reference_ref` (ADR 0063). The secret-reference slot is DISJOINT from ProviderObjectReference / PublicClientId / PolicySelectorValue / raw secret material (charter inv. 16 / line 98). Ring 0 validates only the structural reference shape per kind: STRUCTURED kinds (op_uri, keychain_item) reject mis-shaped/raw-value locators; PERMISSIVE kinds (env_var_name, hcs_uri, broker_handle) accept token-shaped locators (recorded accept-and-trap, backstopped by forbidden-string-scan + the Ring 1 deep check). It does NOT embed a policy-tier denylist (charter inv. 1). No audit_chain_link_hash, no producer-mint field, no evidence_refs; absent from the ADR 0057 mint scope. Value resolution, FK existence, the deep reference-vs-secret check, and locator-vs-bound-CredentialSource precedence are Ring 1 broker obligations.',
  );

export type SecretReference = z.infer<typeof secretReferenceSchema>;
export type SecretReferenceReferenceKind = SecretReferenceReferenceKindLiteral;
export type SecretReferenceSourceProvenance = z.infer<typeof secretReferenceSourceProvenanceSchema>;
