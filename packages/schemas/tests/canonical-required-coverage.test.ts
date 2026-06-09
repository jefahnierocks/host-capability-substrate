import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Meta-guard (post-M1 coverage). Every canonical Ring-0 entity must carry a
// generated-schema required-field assertion — i.e. some test reads its
// generated/<Entity>.schema.json and asserts the required set. This locks in the
// coverage standardized by PR #45 (ExecutionContext) and completed for the
// remaining 11 entities, so it cannot silently regress, and forces any future
// canonical entity to add the same guard.
//
// The 22-entity set is the Milestone 1 ontology definition (PLAN.md §Milestone 1).
const CANONICAL_ENTITIES = [
  'HostProfile',
  'WorkspaceContext',
  'Principal',
  'AgentClient',
  'Session',
  'ToolProvider',
  'ToolInstallation',
  'ResolvedTool',
  'Capability',
  'OperationShape',
  'CommandShape',
  'Evidence',
  'ExecutionContext',
  'PolicyRule',
  'Decision',
  'ApprovalGrant',
  'Run',
  'Artifact',
  'Lease',
  'Lock',
  'SecretReference',
  'ResourceBudget',
];

const SELF = 'canonical-required-coverage.test.ts';

// Concatenate every OTHER test file's source (exclude this meta file so its
// template literal does not self-satisfy the check).
const testsDir = new URL('.', import.meta.url);
const allTestSource = readdirSync(testsDir)
  .filter((f) => f.endsWith('.test.ts') && f !== SELF)
  .map((f) => readFileSync(new URL(f, testsDir), 'utf8'))
  .join('\n');

describe('canonical Ring-0 entity required-field coverage (meta-guard)', () => {
  it('tracks exactly the 22 canonical entities', () => {
    expect(CANONICAL_ENTITIES).toHaveLength(22);
    expect(new Set(CANONICAL_ENTITIES).size).toBe(22);
  });

  it.each(
    CANONICAL_ENTITIES,
  )('%s has a generated-schema required-field assertion in some test', (entity) => {
    expect(allTestSource).toContain(`generated/${entity}.schema.json`);
  });
});
