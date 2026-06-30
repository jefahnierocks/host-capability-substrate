# policies/generated-snapshot/

This directory now contains the HCS-generated snapshot fixture for the first
live HCS policy lane.

## Current Snapshot

- Snapshot file: `policies/generated-snapshot/tiers.yaml`
- Binding manifest: `policies/generated-snapshot/snapshot-binding.json`
- Source repository: `jefahnierocks/system-config`
- Source commit: `551419064422d00a9bcac3e58aa3e41287c6b6c8`
- Source path: `policies/host-capability-substrate/tiers.yaml`
- Source policy SHA-256:
  `sha256:7e30b768700a479464d1fb3af363764ca42f6d1249f5f4f7100cc745dae10a9d`

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
