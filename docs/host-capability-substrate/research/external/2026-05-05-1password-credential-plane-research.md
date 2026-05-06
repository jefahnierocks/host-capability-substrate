# 1Password Credential-Plane Research Intake

## Status

This file is an HCS quarantine wrapper for the raw 1Password credential-plane
research note. The byte-for-byte source is preserved at:

`docs/host-capability-substrate/research/external/2026-05-05-1password-credential-plane-research.raw.md`

Raw source SHA-256:

`06abfe184c7c781ce4fc6d4ee7f18cf5c38265061a23323e22176f17ed0d9dba`

The raw source is source-author planning input only. It is not an HCS
implementation directive and it does not authorize schemas, generated JSON
Schema, canonical policy YAML, OpenTofu modules, reconciler source code, vault
inventory, service-account tokens, runtime artifacts, broker changes, or
credential-plane operation classes.

Do not cite the raw source as a first-party HCS decision. Cite this wrapper,
the local synthesis, and Q-013 in `DECISIONS.md`.

## Quarantined Claims

The raw source contains useful candidate design material, but several sections
use binding language or organization-specific examples. HCS resolves those
sections as follows until Q-013 is accepted:

- Raw lines 337-343 correctly state posture-only intent, but later directive
  wording is source-author proposal language, not HCS authority.
- Raw lines 382-432 include Nash, Citadel, subsidiary, vault, project, and
  manifest examples. Those are not HCS core ontology, schema, fixture, or
  policy commitments.
- Raw lines 460-481 propose `credential_source_kind` values and authority
  classes. Q-013 may consider credential-source vocabulary, but authority is
  evidence-bound provenance minted by HCS records, not a producer-selected
  property of a source kind.
- Raw lines 507-518 and 611-623 sketch `ApprovalGrant.scope`, canonical-policy
  enforcement, and "commitment" wording. These remain candidate policy ideas
  only. No `credential_plane_mutation` policy row or grant-scope extension is
  accepted.
- Raw lines 582-624 describe forbidden-pattern additions and charter posture
  as commitments. Q-013 may decide whether existing invariants are sufficient
  or whether an amendment is needed; no charter or canonical-policy change is
  accepted by this intake.
- Raw lines 650-663 prescribe a landing order. The landing order is not
  accepted. Q-013 must decide whether this is Phase 2 Wave-2 / Phase 2.7 or an
  explicit amendment to ADR 0038 sequencing.

## Reconciled HCS Posture

HCS should treat 1Password as a credential authority surface it may model, not
as a secret manager HCS owns. HCS owns the generic substrate concepts:

- typed evidence and provenance
- `CredentialSource` refinement
- broker contracts
- mutation receipts
- policy gates and forbidden patterns

`system-config` or Citadel-owned implementation docs own workstation
configuration, organization-specific vault inventory, aliases, manifests,
service-account wiring, and rollout details. HCS core ontology must not bake in
Nash, Covenant, Citadel, Jefahnierocks, subsidiary, or project vault names.

Until Q-013 is accepted, the following remain blocked:

- `CredentialSource` discriminator or field changes
- new credential-plane evidence subtype schemas or proof composites
- `credential_plane_mutation` policy or ApprovalGrant scope extensions
- SDK reconciler implementation
- service-account token creation or vault access mutation
- vault inventory manifests or fixture snapshots derived from live inventory
- OpenTofu provider changes involving 1Password or credential material
- runtime changes to `host_secret_*`, `op run`, SSH Agent, or Environments

## Sources

- Raw source:
  `docs/host-capability-substrate/research/external/2026-05-05-1password-credential-plane-research.raw.md`
- Citadel guidance source note:
  `docs/host-capability-substrate/research/external/2026-05-05-citadel-credential-plane-guidance.md`
- Local synthesis:
  `docs/host-capability-substrate/research/local/2026-05-05-credential-plane-integration-synthesis.md`
- Decision row:
  `DECISIONS.md` Q-013
