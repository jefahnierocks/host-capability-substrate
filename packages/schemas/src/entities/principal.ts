import { z } from 'zod';
import {
  entityIdSchema,
  evidenceRefSchema,
  isoDateTimeSchema,
  sha256DigestSchema,
} from '../common.ts';

export const principalSchemaVersionSchema = z
  .literal('0.1.0')
  .describe('Principal schema version (ADR 0054; M1 foundational entity #3; D-043).');

export const principalKindSchema = z
  .enum(['human', 'service_principal'])
  .describe(
    'Principal principal_kind values (ADR 0054 v1; 2 Zod-defined values). `pseudo_principal` (cycle-history.md ratification per ADR 0036 future Q-row) and `system_principal` (kernel-emitted record attribution) are registry-canonical reservations pending future schema PRs via the registered §Procedure rule.',
  );

export const principalStateSchema = z
  .enum(['active', 'retired'])
  .describe(
    'Lifecycle state for a Principal record (ADR 0054; mirrors agentClientStateSchema / workspaceContextStateSchema).',
  );

export const principalProducerSchema = z
  .enum(['kernel_principal_resolver'])
  .describe(
    'Kernel-trusted producer allowlist for Principal records (ADR 0054). NEW producer mirroring ADR 0037 `kernel_agent_client_resolver` precedent; resolves Principal records from binding evidence (GitIdentityBinding for `human`; MachineIdentityBindingObservation for `service_principal`; future Q-row commit-signature-to-principal mappings). `kernel_dashboard` deferred to coordinated future ADR per ADRs 0051 v4 / 0052 / 0053 / 0054 scope discipline. Named enum schema for forward-compatible allowlist widening.',
  );

export const principalSchema = z
  .object({
    schema_version: principalSchemaVersionSchema,
    principal_id: entityIdSchema,
    principal_kind: principalKindSchema,
    principal_state: principalStateSchema,
    kernel_observed_at: isoDateTimeSchema,
    valid_until: isoDateTimeSchema.nullable(),
    producer: principalProducerSchema,
    audit_chain_link_hash: sha256DigestSchema,
    evidence_refs: z.array(evidenceRefSchema).min(1),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.principal_state === 'active' && value.valid_until !== null) {
      ctx.addIssue({
        code: 'custom',
        message: 'active Principal records must have valid_until null.',
        path: ['valid_until'],
      });
    }
    if (value.principal_state === 'retired' && value.valid_until === null) {
      ctx.addIssue({
        code: 'custom',
        message: 'retired Principal records must carry valid_until (retirement timestamp).',
        path: ['valid_until'],
      });
    }
  })
  .describe(
    'Ring 0 Principal entity from ADR 0054. Typed identity for human or service-principal actors. Envelope-only kernel-set with NO field-level exceptions. NO chain-walk envelope superRefine — typed-identity-envelope precedent per AgentClient + WorkspaceContext; charter inv. 8 + inv. 18 deferred to Ring 1 mint API via producer-allowlist closure on `kernel_principal_resolver`. NO `execution_context_id` field at the entity layer — Principal identity is execution-context-independent (mirrors AgentClient); binding evidence cited via evidence_refs carries its own execution_context_id per inv. 19. Same-record refinement enforces principal_state ↔ valid_until correlation. Cross-record refinements (binding-evidence verification per principal_kind, synthetic-identity rejection, self-approval rejection typed-FK comparison with 4-step canonicalization-at-mint recipe per §Self-approval rejection rule registry section, `requesting_principal_id` FK liveness) live at Ring 1 mint API per registry §Cross-context enforcement layer.',
  );

export type Principal = z.infer<typeof principalSchema>;
export type PrincipalKind = z.infer<typeof principalKindSchema>;
export type PrincipalState = z.infer<typeof principalStateSchema>;
export type PrincipalProducer = z.infer<typeof principalProducerSchema>;
