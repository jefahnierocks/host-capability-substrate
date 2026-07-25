---
adr_number: 0003
title: Transport topology — stdio + Streamable HTTP
status: accepted
date: 2026-04-22
charter_version: 1.1.0
tags: [transport, mcp, stdio, http]
---

# ADR 0003: Transport topology — stdio + Streamable HTTP

## Status

`accepted` — 2026-07-25 (D-084).

Accepted **as written**. Phase 1 Thread B was retired as a decision gate; no
finding it could have produced would change a localhost-only topology, which is
the conservative option in every direction and is already the operative posture
across the repo (`PLAN.md` out-of-scope list names remote non-localhost MCP;
charter invariant 10 keeps deployment private).

The ledger has listed this decision as accepted since 2026-04-22 (D-009); only
the ADR's own status field lagged. Remote transport, if ever wanted, remains a
separate ADR as this one states.

## Context

HCS needs to serve local stdio clients (Claude Code, Codex) and local HTTP clients (Claude Desktop, future GPT-5.4 remote, dashboard). MCP Streamable HTTP per 2025-11-25 spec says localhost servers bind 127.0.0.1 with auth.

## Options considered

### Option A: Single Hono process fronting stdio + Streamable HTTP

**Pros:** one cache, one audit writer, simpler lifecycle.
**Cons:** single point of failure; stdio subprocess lifecycle differs from HTTP listener.

### Option B: Separate processes sharing SQLite over WAL

**Pros:** failure isolation between stdio and HTTP.
**Cons:** cache coherence, audit-writer arbitration, twice the launchd lifecycle.

## Decision

Pending Phase 1 Thread B measurements. Default recommendation: **Option A** with clean separation of transport layer from kernel.

Localhost-only at Phase 0/1 per D-009. Remote tunnel = separate ADR later.

## Consequences

### Accepts

- Kernel knows nothing about transport; adapters are thin.
- Dashboard uses the same Hono process.

### Rejects

- Exposing beyond 127.0.0.1 without an explicit ADR.

### Future amendments

- GPT-5.4 remote MCP hosting (separate ADR if needed).
- Dashboard auth token rotation (ADR 0008).

## References

### Internal

- Research plan §22, Thread B
- Decision ledger: `DECISIONS.md` entry D-009

### External

- [MCP Transports](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)
