import { readFileSync } from 'node:fs';
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
      schema_version: '0.11.0',
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
      schema_version: '0.11.0',
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

describe('Evidence generated schema (anyOf branches)', () => {
  // Evidence is an anyOf of 4 branches with no top-level `required`. Assert the
  // shared 10-key core is present in every branch AND pin each branch's exact
  // required set (the source_ref / execution_context_id / session_id / run_id
  // discriminator deltas).
  const schema = JSON.parse(
    readFileSync(new URL('../generated/Evidence.schema.json', import.meta.url), 'utf8'),
  ) as { anyOf: { required: string[] }[] };
  const CORE = [
    'schema_version',
    'evidence_id',
    'evidence_kind',
    'subject_refs',
    'source',
    'observed_at',
    'valid_until',
    'authority',
    'confidence',
    'parser_version',
  ];

  it('exposes four branches each containing the shared required core', () => {
    expect(schema.anyOf).toHaveLength(4);
    for (const branch of schema.anyOf) {
      for (const key of CORE) {
        expect(branch.required).toContain(key);
      }
    }
  });

  it('pins each branch exact required set (discriminator deltas)', () => {
    const sets = schema.anyOf.map((branch) => branch.required);
    // base (direct) evidence
    expect(sets).toContainEqual([
      'schema_version',
      'evidence_id',
      'evidence_kind',
      'subject_refs',
      'source',
      'observed_at',
      'valid_until',
      'authority',
      'confidence',
      'parser_version',
    ]);
    // + source_ref + execution_context_id
    expect(sets).toContainEqual([
      'schema_version',
      'evidence_id',
      'evidence_kind',
      'subject_refs',
      'source',
      'source_ref',
      'observed_at',
      'valid_until',
      'authority',
      'confidence',
      'parser_version',
      'execution_context_id',
    ]);
    // + execution_context_id + session_id
    expect(sets).toContainEqual([
      'schema_version',
      'evidence_id',
      'evidence_kind',
      'subject_refs',
      'source',
      'observed_at',
      'valid_until',
      'authority',
      'confidence',
      'parser_version',
      'execution_context_id',
      'session_id',
    ]);
    // + execution_context_id + run_id
    expect(sets).toContainEqual([
      'schema_version',
      'evidence_id',
      'evidence_kind',
      'subject_refs',
      'source',
      'observed_at',
      'valid_until',
      'authority',
      'confidence',
      'parser_version',
      'execution_context_id',
      'run_id',
    ]);
  });
});
