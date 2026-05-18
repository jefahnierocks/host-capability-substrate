# policies/generated-snapshot/

This directory now contains the HCS-generated snapshot fixture for the first
live HCS policy lane.

## Current Snapshot

- Snapshot file: `policies/generated-snapshot/tiers.yaml`
- Binding manifest: `policies/generated-snapshot/snapshot-binding.json`
- Source repository: `jefahnierocks/system-config`
- Source commit: `136dbaa`
- Source path: `policies/host-capability-substrate/tiers.yaml`
- Source policy SHA-256:
  `sha256:e06442e02db50604e8ae8cbc1572a4ecec91ae87bfac6705e52161fd450ae68b`

The vendored `tiers.yaml` must remain byte-for-byte identical to the live
policy file at the recorded source commit. HCS-specific binding metadata lives
in `snapshot-binding.json`, not inside the vendored YAML.

## Validation

`just snapshot-binding-check` verifies:

- the binding manifest has the required source-binding triple;
- the recorded digest matches the vendored snapshot file;
- schema refs in the snapshot match current HCS Zod schema-version literals;
- `operation_class_defaults` covers every current HCS operation class;
- policy reason-kind references exist in the current HCS Decision schema;
- the vendored file is at the expected generated-snapshot path.

This check is wired into `just verify`.

## Refresh Policy

When `system-config/policies/host-capability-substrate/tiers.yaml` changes:

1. Re-vendor the live file from the intended system-config commit, using
   `git show <commit>:policies/host-capability-substrate/tiers.yaml`.
2. Recompute the digest with `shasum -a 256 policies/generated-snapshot/tiers.yaml`.
3. Update `snapshot-binding.json` with the new commit and digest.
4. Run `just snapshot-binding-check` and `just verify`.

This is the HCS-side completion of the HCS-unblock-fast generated snapshot
lane. It does not activate Ring 1 service behavior, execution brokering,
mutating endpoints, or provider operations.
