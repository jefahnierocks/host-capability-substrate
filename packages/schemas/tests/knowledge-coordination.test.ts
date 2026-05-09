import { describe, expect, it } from 'vitest';
import {
  coordinationFactSchema,
  derivedSummarySchema,
  evidenceSchema,
  knowledgeChunkSchema,
  knowledgeSourceSchema,
} from '../src/index.ts';

const hash = 'sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

const evidenceRef = {
  evidence_id: 'evidence:adr-0019-accepted',
  source: 'docs/host-capability-substrate/adr/0019-knowledge-and-coordination-store.md',
  observed_at: '2026-05-04T00:00:00Z',
  authority: 'host-observation',
  confidence: 'high',
} as const;

const derivedEvidenceRef = {
  ...evidenceRef,
  evidence_id: 'evidence:audit-profile-derived',
  authority: 'derived',
  confidence: 'best-effort',
} as const;

describe('Knowledge and coordination schemas', () => {
  it('validates KnowledgeSource records with ADR 0036 source_kind and security_label extensions', () => {
    const source = knowledgeSourceSchema.parse({
      schema_version: '0.2.0',
      knowledge_source_id: 'knowledge-source:hcs:audit-profile',
      uri: 'repo://docs/audit/project_profile.yaml',
      content_hash: hash,
      source_kind: 'audit_profile_yaml',
      security_label: 'secret_pointer',
      indexable: true,
      indexed_at: '2026-05-04T00:00:00Z',
      execution_context_id: 'ctx:hcs:phase-2-1-3',
      target_refs: [
        {
          target_kind: 'workspace_context',
          target_id: 'workspace-context:host-capability-substrate',
          relation: 'describes_workspace',
        },
      ],
      evidence_refs: [evidenceRef],
    });

    expect(source.source_kind).toBe('audit_profile_yaml');
    expect(source.security_label).toBe('secret_pointer');

    const projectContractSource = knowledgeSourceSchema.parse({
      ...source,
      knowledge_source_id: 'knowledge-source:project-substrate-contract:hcs',
      uri: 'repo://project-substrate-contract.yaml',
      source_kind: 'project_substrate_contract',
      security_label: 'internal',
      target_refs: [
        {
          target_kind: 'workspace_context',
          target_id: 'workspace-context:host-capability-substrate',
          relation: 'declares_project_substrate_contract',
        },
      ],
    });

    expect(projectContractSource.source_kind).toBe('project_substrate_contract');
    expect(
      knowledgeSourceSchema.safeParse({
        ...source,
        schema_version: '0.1.0',
        knowledge_source_id: 'knowledge-source:hcs:old-schema-version',
      }).success,
    ).toBe(false);
  });

  it('keeps secret_referenced KnowledgeChunk records out of embedding storage', () => {
    expect(
      knowledgeChunkSchema.parse({
        schema_version: '0.1.0',
        knowledge_chunk_id: 'knowledge-chunk:hcs:audit-profile:0',
        knowledge_source_id: 'knowledge-source:hcs:audit-profile',
        source_content_hash: hash,
        chunk_index: 0,
        text_hash: hash,
        heading_path: ['Audit Profile', 'Claims'],
        token_count: 42,
        embedding_ref: 'hcs-vector://local/chunk-0',
        chunk_kind: 'audit_record',
        metadata: {
          line_start: 12,
        },
        security_label: 'secret_pointer',
        execution_context_id: 'ctx:hcs:phase-2-1-3',
        evidence_refs: [evidenceRef],
      }).embedding_ref,
    ).toBe('hcs-vector://local/chunk-0');

    expect(
      knowledgeChunkSchema.safeParse({
        schema_version: '0.1.0',
        knowledge_chunk_id: 'knowledge-chunk:hcs:resolved-secret:0',
        knowledge_source_id: 'knowledge-source:hcs:audit-profile',
        source_content_hash: hash,
        chunk_index: 0,
        text_hash: hash,
        token_count: 42,
        embedding_ref: 'hcs-vector://local/chunk-secret',
        chunk_kind: 'audit_record',
        security_label: 'secret_referenced',
        execution_context_id: 'ctx:hcs:phase-2-1-3',
        evidence_refs: [evidenceRef],
      }).success,
    ).toBe(false);
  });

  it('validates CoordinationFact subject_ref shape and promotion grounding', () => {
    const promoted = coordinationFactSchema.parse({
      schema_version: '0.1.0',
      coordination_fact_id: 'coordination-fact:hcs:workspace-contains-schema',
      subject_kind: 'workspace_context',
      subject_ref: {
        workspace_context_id: 'workspace-context:host-capability-substrate',
      },
      predicate_kind: 'confirmed_to_contain',
      object_kind: 'scoped_assertion',
      object: {
        assertion: {
          bounded_context: 'packages/schemas',
        },
      },
      evidence_refs: [evidenceRef],
      authority: 'host-observation',
      confidence: 'high',
      valid_until: '2026-05-05T00:00:00Z',
      allowed_for_gate: true,
      promoted_at: '2026-05-04T01:00:00Z',
      promotion_grant_id: 'promotion-grant:hcs:workspace-contains-schema',
      execution_context_id: 'ctx:hcs:phase-2-1-3',
    });

    expect(promoted.allowed_for_gate).toBe(true);

    expect(
      coordinationFactSchema.safeParse({
        ...promoted,
        coordination_fact_id: 'coordination-fact:hcs:bad-subject-ref',
        subject_ref: {
          repository_id: 'repository:host-capability-substrate',
        },
      }).success,
    ).toBe(false);

    expect(
      coordinationFactSchema.safeParse({
        ...promoted,
        coordination_fact_id: 'coordination-fact:hcs:derived-only-promotion',
        evidence_refs: [derivedEvidenceRef],
      }).success,
    ).toBe(false);
  });

  it('enforces the ADR 0031 worktree leased_to CoordinationFact shape', () => {
    const leasedToFact = coordinationFactSchema.parse({
      schema_version: '0.1.0',
      coordination_fact_id: 'coordination-fact:hcs:worktree-leased',
      subject_kind: 'worktree',
      subject_ref: {
        repository_id: 'repository:host-capability-substrate',
        worktree_path: '/Users/verlyn13/Organizations/jefahnierocks/host-capability-substrate',
      },
      predicate_kind: 'leased_to',
      object_kind: 'scoped_assertion',
      object: {
        session_id: 'session:phase-2-1-3',
        lease_id: 'lease:worktree:phase-2-1-3',
        valid_until: '2026-05-05T00:00:00Z',
        lease_acquired_at: '2026-05-04T00:00:00Z',
      },
      evidence_refs: [evidenceRef],
      authority: 'host-observation',
      confidence: 'high',
      valid_until: '2026-05-05T00:00:00Z',
      allowed_for_gate: true,
      promoted_at: '2026-05-04T01:00:00Z',
      promotion_grant_id: 'promotion-grant:hcs:worktree-leased',
      execution_context_id: 'ctx:hcs:phase-2-1-3',
    });

    expect(leasedToFact.predicate_kind).toBe('leased_to');

    expect(
      coordinationFactSchema.safeParse({
        ...leasedToFact,
        subject_ref: {
          repository_id: 'repository:host-capability-substrate',
          worktree_path: '/Users/verlyn13/Organizations/jefahnierocks/host-capability-substrate',
          workspace_context_id: 'workspace-context:host-capability-substrate',
        },
      }).success,
    ).toBe(false);

    expect(
      coordinationFactSchema.safeParse({
        ...leasedToFact,
        object: {
          session_id: 'session:phase-2-1-3',
          valid_until: '2026-05-05T00:00:00Z',
          lease_acquired_at: '2026-05-04T00:00:00Z',
        },
      }).success,
    ).toBe(false);
  });

  it('keeps DerivedSummary derived and blocks KnowledgeChunk promotion laundering', () => {
    const unpromoted = derivedSummarySchema.parse({
      schema_version: '0.1.0',
      derived_summary_id: 'derived-summary:hcs:workspace-diagnose',
      derived_from: [
        {
          source_record_kind: 'knowledge_chunk',
          source_record_id: 'knowledge-chunk:hcs:audit-profile:0',
          source: evidenceRef.source,
          observed_at: evidenceRef.observed_at,
          authority: evidenceRef.authority,
          confidence: evidenceRef.confidence,
        },
      ],
      generated_by: 'kernel_workspace_diagnose',
      generated_at: '2026-05-04T00:30:00Z',
      summary_kind: 'operational_summary',
      summary_text: 'Workspace diagnose projection for human review.',
      authority: 'derived',
      confidence: 'best-effort',
      allowed_for_gate: false,
      promoted_at: null,
      promotion_grant_id: null,
      execution_context_id: 'ctx:hcs:phase-2-1-3',
    });

    expect(unpromoted.authority).toBe('derived');

    expect(
      derivedSummarySchema.safeParse({
        ...unpromoted,
        allowed_for_gate: true,
        promoted_at: '2026-05-04T01:00:00Z',
        promotion_grant_id: 'promotion-grant:hcs:summary',
      }).success,
    ).toBe(false);

    expect(
      derivedSummarySchema.safeParse({
        ...unpromoted,
        derived_summary_id: 'derived-summary:hcs:run-source',
        derived_from: [
          {
            source_record_kind: 'run',
            source_record_id: 'run:unexpected',
            source: evidenceRef.source,
            observed_at: evidenceRef.observed_at,
            authority: evidenceRef.authority,
            confidence: evidenceRef.confidence,
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('keeps knowledge and coordination entities as Evidence subject kinds with current Evidence schema', () => {
    const evidence = evidenceSchema.parse({
      schema_version: '0.10.0',
      evidence_id: 'evidence:knowledge-coordination-subjects',
      evidence_kind: 'observation',
      subject_refs: [
        {
          subject_kind: 'knowledge_source',
          subject_id: 'knowledge-source:hcs:audit-profile',
        },
        {
          subject_kind: 'knowledge_chunk',
          subject_id: 'knowledge-chunk:hcs:audit-profile:0',
        },
        {
          subject_kind: 'coordination_fact',
          subject_id: 'coordination-fact:hcs:workspace-contains-schema',
        },
        {
          subject_kind: 'derived_summary',
          subject_id: 'derived-summary:hcs:workspace-diagnose',
        },
      ],
      source: 'docs/host-capability-substrate/adr/0019-knowledge-and-coordination-store.md',
      observed_at: '2026-05-04T00:00:00Z',
      valid_until: null,
      authority: 'host-observation',
      confidence: 'high',
      parser_version: 'human-review:v1',
      redaction_mode: 'reference_only',
    });

    expect(evidence.subject_refs.map((ref) => ref.subject_kind)).toEqual([
      'knowledge_source',
      'knowledge_chunk',
      'coordination_fact',
      'derived_summary',
    ]);
  });
});
