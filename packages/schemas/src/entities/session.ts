import { z } from 'zod';
import {
  entityIdSchema,
  evidenceRefSchema,
  isoDateTimeSchema,
  sha256DigestSchema,
} from '../common.ts';

export const sessionSchemaVersionSchema = z
  .literal('0.1.0')
  .describe('Session schema version (ADR 0055; M1 foundational entity #5; D-044).');

export const sessionKindSchema = z
  .enum(['agent_invocation'])
  .describe(
    'Session session_kind values (ADR 0055 v1; closed enum, single value). `dashboard` (paired with future kernel_dashboard producer ADR per ADRs 0051 v4 / 0052 / 0053 / 0054 deferral) and `system_task` (paired with system_principal Zod-defined extension per ADR 0054) are registry-canonical reservations pending future schema PRs via the registered §Procedure rule.',
  );

export const sessionStateSchema = z
  .enum(['active', 'ended'])
  .describe(
    'Lifecycle state for a Session record (ADR 0055). Cardinality matches AgentClient/WorkspaceContext/Principal long-lived precedents (1 active + 1 terminal at v1) but value-name diverges intentionally: Session uses `ended` (not `retired`) because Session is a transient invocation rather than a long-lived identity. Future state extensions (`terminated`, `crashed`, `suspended`) may land via the §Procedure rule per operational evidence.',
  );

export const sessionProducerSchema = z
  .enum(['kernel_session_resolver'])
  .describe(
    'Kernel-trusted producer allowlist for Session records (ADR 0055). NEW producer mirroring ADR 0037 `kernel_agent_client_resolver` + ADR 0054 `kernel_principal_resolver` precedents; resolves Session records from invocation evidence (MCP server connection / CLI invocation / IDE workspace open kernel-observation paths). Ring 1 implementation at `packages/kernel/src/session/` MUST enforce sandbox-source rejection (invocation evidence MUST NOT carry `authority: sandbox-observation` or `self-asserted`) + chain-walk transitively via `derived_from` per ADR 0019 v3 with walk-depth budget ≤ 64 (security N1 + N4 v2 absorptions). `kernel_dashboard` deferred to coordinated future ADR per ADRs 0051 v4 / 0052 / 0053 / 0054 / 0055 scope discipline. Named enum schema for forward-compatible allowlist widening.',
  );

export const sessionSchema = z
  .object({
    schema_version: sessionSchemaVersionSchema,
    session_id: entityIdSchema,
    session_kind: sessionKindSchema,
    session_state: sessionStateSchema,
    agent_client_id: entityIdSchema,
    principal_id: entityIdSchema,
    execution_context_id: entityIdSchema,
    started_at: isoDateTimeSchema,
    ended_at: isoDateTimeSchema.nullable(),
    producer: sessionProducerSchema,
    audit_chain_link_hash: sha256DigestSchema,
    evidence_refs: z.array(evidenceRefSchema).min(1),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.session_state === 'active' && value.ended_at !== null) {
      ctx.addIssue({
        code: 'custom',
        message: 'active Session records must have ended_at null.',
        path: ['ended_at'],
      });
    }
    if (value.session_state === 'ended' && value.ended_at === null) {
      ctx.addIssue({
        code: 'custom',
        message: 'ended Session records must carry ended_at (end timestamp).',
        path: ['ended_at'],
      });
    }
    if (value.ended_at !== null && Date.parse(value.ended_at) < Date.parse(value.started_at)) {
      ctx.addIssue({
        code: 'custom',
        message:
          'ended_at must be greater than or equal to started_at (ADR 0055 §Decision Zod superRefine; reason_kind session_started_at_after_ended_at).',
        path: ['ended_at'],
      });
    }
  })
  .describe(
    'Ring 0 Session entity from ADR 0055. Typed identity for an agent-invocation session that holds Leases, invokes Runs, and is consumed by ApprovalGrant self-approval rejection comparison. Envelope-only-kernel-set with NO field-level exceptions. NO chain-walk envelope superRefine — typed-identity-envelope precedent per AgentClient + WorkspaceContext + Principal; charter inv. 8 + inv. 18 deferred to Ring 1 mint API via producer-allowlist closure on `kernel_session_resolver` + transitive chain-walk per security N1 + N4. YES `execution_context_id` field at the entity layer — Session is execution-context-BOUND (mirrors WorkspaceContext per ADR 0031 v1 Mechanical Tweak #8 / Security-C, NOT Principal which is execution-context-independent); cross-context invocations are NEW Session records, NOT the same Session re-bound. Same-record refinement enforces session_state ↔ ended_at correlation AND ended_at >= started_at temporal consistency. Cross-record refinements (FK liveness verification at Session mint for agent_client_id/principal_id/execution_context_id; cross-context binding equality enforcement at consuming-record mint per ADR 0031 v1 + ADR 0052 + ADR 0053 + ADR 0054 self-approval rejection FK consumption) live at Ring 1 mint API per registry §Cross-context enforcement layer §Schema validation alone is not an enforcement layer. Closes 4 forward-reference typed FK targets: Lease.held_by_session_id (ADR 0052), Run.invoker_session_id (ADR 0053), ADR 0030 v2 owning_session_id, "consuming/requesting session" references in ADRs 0031 v1 / 0051 v4 / 0052 / 0054.',
  );

export type Session = z.infer<typeof sessionSchema>;
export type SessionKind = z.infer<typeof sessionKindSchema>;
export type SessionState = z.infer<typeof sessionStateSchema>;
export type SessionProducer = z.infer<typeof sessionProducerSchema>;
