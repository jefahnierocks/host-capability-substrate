import { describe, expect, it } from 'vitest';
import { evidenceAuthoritySchema, evidenceSchema } from '../src/index.ts';

describe('evidenceAuthoritySchema self-asserted enum extension', () => {
  it('accepts self-asserted as a member of the authority enum', () => {
    expect(evidenceAuthoritySchema.parse('self-asserted')).toBe('self-asserted');
  });

  it('rejects misspelled or legacy variants of the new class', () => {
    expect(evidenceAuthoritySchema.safeParse('self_asserted').success).toBe(false);
    expect(evidenceAuthoritySchema.safeParse('selfAsserted').success).toBe(false);
    expect(evidenceAuthoritySchema.safeParse('self-assertion').success).toBe(false);
  });

  it('parses an Evidence record with authority self-asserted via the non-sandbox branch', () => {
    const evidence = evidenceSchema.parse({
      schema_version: '0.10.0',
      evidence_id: 'evidence:agent-self-claim:permission-mode',
      evidence_kind: 'observation',
      subject_refs: [
        {
          subject_kind: 'agent_client',
          subject_id: 'agent_client:codex-cli',
        },
      ],
      source: 'agent-self-report',
      observed_at: '2026-05-09T00:00:00Z',
      valid_until: null,
      authority: 'self-asserted',
      confidence: 'unknown',
      parser_version: 'agent-self-report:v1',
    });

    expect(evidence.authority).toBe('self-asserted');
    expect(evidence.evidence_kind).toBe('observation');
  });

  it('does not require execution_context_id for self-asserted Evidence (unlike sandbox-observation)', () => {
    const result = evidenceSchema.safeParse({
      schema_version: '0.10.0',
      evidence_id: 'evidence:self-asserted-without-context',
      evidence_kind: 'observation',
      subject_refs: [
        {
          subject_kind: 'agent_client',
          subject_id: 'agent_client:codex-cli',
        },
      ],
      source: 'agent-self-report',
      observed_at: '2026-05-09T00:00:00Z',
      valid_until: null,
      authority: 'self-asserted',
      confidence: 'unknown',
      parser_version: 'agent-self-report:v1',
    });

    expect(result.success).toBe(true);
  });
});
