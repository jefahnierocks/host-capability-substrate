import { z } from 'zod';
import {
  entityIdSchema,
  evidenceRefSchema,
  schemaVersionSchema,
  sha256DigestSchema,
} from '../common.ts';
import { coordinationTargetRefSchema } from './coordination-common.ts';
import { knowledgeSecurityLabelSchema } from './knowledge-source.ts';

export const knowledgeChunkKindSchema = z
  .enum(['prose', 'code', 'schema_block', 'table', 'audit_record'])
  .describe('Chunk content kind for ADR 0019 retrieval-index records.');

export const knowledgeChunkSchema = z
  .object({
    schema_version: schemaVersionSchema,
    knowledge_chunk_id: entityIdSchema,
    knowledge_source_id: entityIdSchema,
    source_content_hash: sha256DigestSchema,
    chunk_index: z.number().int().min(0),
    text_hash: sha256DigestSchema,
    heading_path: z.array(z.string().min(1)).default([]),
    token_count: z.number().int().min(0),
    embedding_ref: z.string().min(1).nullable(),
    chunk_kind: knowledgeChunkKindSchema,
    metadata: z.record(z.string(), z.json()).default({}),
    security_label: knowledgeSecurityLabelSchema,
    execution_context_id: entityIdSchema,
    target_refs: z.array(coordinationTargetRefSchema).default([]),
    evidence_refs: z.array(evidenceRefSchema).min(1),
  })
  .strict()
  .refine((value) => value.security_label !== 'secret_referenced' || value.embedding_ref === null, {
    message: 'secret_referenced chunks must not carry embedding_ref.',
    path: ['embedding_ref'],
  })
  .describe('Ring 0 KnowledgeChunk entity from ADR 0019 and ADR 0038 Phase 2.1.3.');

export type KnowledgeChunkKind = z.infer<typeof knowledgeChunkKindSchema>;
export type KnowledgeChunk = z.infer<typeof knowledgeChunkSchema>;
