# Citadel Credential-Plane Guidance

## Status

Source note for user-provided Citadel guidance delivered inline on 2026-05-05.
This is human guidance and planning input, not an accepted HCS architecture
decision or implementation directive.

## Guidance

Treat `/private/tmp/1password-research.md` as a strong credential-plane design
input, not as an implementation directive.

For HCS:

- Open Q-013 for credential-plane integration.
- Preserve the source note.
- Draft an ADR before schema, reconciler, service-account, vault, OpenTofu, or
  runtime changes.
- Model the abstract credential-plane pattern: `CredentialSource` kinds, typed
  receipts, brokered injection, and forbidden patterns.
- Do not bake Nash, Covenant, Citadel, or project vault names into HCS core
  ontology.
- Keep organization-specific vault hierarchy, aliases, reconciler manifests,
  and rollout details in `system-config` or Citadel-owned implementation docs.

Ownership split:

- 1Password is a credential authority surface HCS models, not the secret
  manager HCS owns.
- HCS owns typed evidence, credential-source refinement, broker contracts,
  mutation receipts, and policy gates.
- `system-config` owns workstation configuration and any future declarative
  1Password inventory location.
- Citadel-owned implementation docs own Nash/Citadel-specific rollout details.
- Jefahnierocks adopts the pattern through local authority without normal
  agents reaching back into Nash/Covenant context unless explicitly directed.

Tension resolutions:

- 1Password is approved bootstrap/workstation custody and may hold material,
  but it is not the preferred unattended machine identity. Automation should
  prefer GitHub Apps, OIDC, and platform-native short-lived credentials first.
  1Password service accounts are scoped exceptions requiring rotation, audit,
  and health evidence.
- The SDK reconciler is the desired-state path only after SDK version pinning
  and runtime evidence. `op` remains runtime read/inject compatibility, not
  infrastructure-as-code.
- `op run` is bounded per-command injection only. No login-shell wrappers,
  daemons, long-running agent sessions, or persistent config materialization.
- OpenTofu may consume secret references and ephemeral reads, but must not own
  SSH key lifecycle or persist secret material in state.
- Covenant per-entity vault isolation and scoped-token enforcement remain
  validation targets until issuance, audit logs, workflow rewrites, and Litecky
  migration proof exist.
- HCS models the generic authority pattern. Citadel and `system-config` carry
  Nash/Jefahnierocks-specific inventory.

Recommended HCS action:

1. Preserve the research note.
2. Draft Q-013 as a planning/ADR track.
3. Dispatch architect, ontology, policy, and security review.
4. Mark all reconciler, schema, policy, vault, service-account, OpenTofu, and
   runtime work as blocked until Q-013 acceptance.
