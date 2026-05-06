import { z } from 'zod';
import {
  entityIdSchema,
  evidenceRefSchema,
  isoDateTimeSchema,
  schemaVersionSchema,
  sha256DigestSchema,
} from '../common.ts';
import { coordinationTargetRefSchema } from './coordination-common.ts';

export const knowledgeSourceKindSchema = z
  .enum([
    'charter',
    'adr',
    'decision_ledger',
    'runbook',
    'vendor_doc',
    'audit_summary',
    'schema',
    'code',
    'audit_profile_yaml',
    'cycle_history',
  ])
  .describe('Canonical source kind for ADR 0019 KnowledgeSource records.');

export const knowledgeSecurityLabelSchema = z
  .enum(['public', 'internal', 'confidential', 'secret_pointer', 'secret_referenced'])
  .describe('Security label for a KnowledgeSource and its derived KnowledgeChunk records.');

export const knowledgeSourceSchema = z
  .object({
    schema_version: schemaVersionSchema,
    knowledge_source_id: entityIdSchema,
    uri: z.string().min(1),
    content_hash: sha256DigestSchema,
    source_kind: knowledgeSourceKindSchema,
    security_label: knowledgeSecurityLabelSchema,
    indexable: z.boolean(),
    indexed_at: isoDateTimeSchema,
    execution_context_id: entityIdSchema,
    target_refs: z.array(coordinationTargetRefSchema).default([]),
    evidence_refs: z.array(evidenceRefSchema).min(1),
  })
  .strict()
  .describe('Ring 0 KnowledgeSource entity from ADR 0019 and ADR 0038 Phase 2.1.3.');

export type KnowledgeSourceKind = z.infer<typeof knowledgeSourceKindSchema>;
export type KnowledgeSecurityLabel = z.infer<typeof knowledgeSecurityLabelSchema>;
export type KnowledgeSource = z.infer<typeof knowledgeSourceSchema>;
