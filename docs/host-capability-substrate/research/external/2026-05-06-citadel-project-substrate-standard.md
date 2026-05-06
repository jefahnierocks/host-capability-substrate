---
title: Citadel project-substrate standard source note
category: research
component: host_capability_substrate
status: input-evidence
version: 0.1.0
last_updated: 2026-05-06
tags: [citadel, project-substrate, runner-substrate, admission, machine-identity, resource-budget, opentofu, q-014]
priority: high
---

# Citadel Project-Substrate Standard Source Note

## Status

Source note for the Citadel project-substrate admission standard delivered to
HCS on 2026-05-06. This is external compatibility input, not HCS operating
authority and not an implementation directive.

Observed source authority:

- Citadel PR #37 merged to `The-Nash-Group/citadel-config`.
- Local checkout:
  `/Users/verlyn13/Organizations/the-nash-group/the-citadel`.
- Observed commit:
  `46c55857427af4b887194277bac2218c20b595b6`.
- Observed source paths:
  - `docs/project-substrate-control-plane-standard.md`
  - `docs/reference/project-substrate-contract.example.yaml`
  - `docs/runner-substrate-boundary.md`

## HCS Intake Posture

HCS treats this standard as a compatibility and admission input for future
typed evidence, validation, and operation-gating design.

HCS does not own:

- GitHub runner groups or selected repository access.
- GitHub workflow policy checks or repository rulesets.
- Proxmox host operations, VM templates, storage, networking, or backups.
- Runner registration, deregistration, or registration-token custody.
- Project workload provisioning, teardown, runtime secrets, or application
  data.

Those remain owned by Citadel, `runner-substrate`, `system-config`, or the
project repo depending on the surface.

## Normalized Signal

The Citadel standard introduces a project-owned substrate contract envelope
that declares:

- workload lane: CI execution, project infrastructure, or both;
- trust class and data classification;
- resource budget;
- network, storage, backup, and teardown posture;
- scoped machine identities;
- secret references by name or canonical path only;
- IaC owner and state boundary;
- evidence required before active use;
- approval evidence and lifecycle status.

The standard is compatible with HCS's existing direction: HCS should consume
non-secret evidence records and validate contract posture through typed
schemas and policy gates once the relevant HCS lane is accepted. HCS should
not become a runner or infrastructure control plane.

## Required Local Synthesis

The HCS-owned synthesis lives at:

`docs/host-capability-substrate/research/local/2026-05-06-project-substrate-compatibility-synthesis.md`

That synthesis maps the Citadel fields to HCS vocabulary and opens Q-014 as
the future project-substrate contract compatibility and admission-validation
decision lane.

## Stop Rules

This intake does not authorize:

- schema changes;
- generated JSON Schema changes;
- canonical policy YAML changes;
- runner registration or deregistration behavior;
- Proxmox, GitHub, or OpenTofu mutation behavior;
- service-account or machine-identity issuance;
- project workload provisioning;
- adapter, dashboard, hook, or runtime endpoints.
