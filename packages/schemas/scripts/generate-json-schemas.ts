import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import {
  agentClientSchema,
  approvalGrantSchema,
  backupCredentialCustodyObservationSchema,
  backupReadinessObservationSchema,
  boundaryObservationSchema,
  cleanRoomSmokeReceiptSchema,
  coordinationFactSchema,
  credentialAuthorityObservationSchema,
  credentialSourceSchema,
  decisionSchema,
  derivedSummarySchema,
  envProvenanceSchema,
  evidenceSchema,
  executionContextSchema,
  gitBranchAncestryObservationSchema,
  gitDirtyStateObservationSchema,
  githubMutationAuthoritySchema,
  gitIdentityBindingSchema,
  gitRemoteObservationSchema,
  gitRepositoryObservationSchema,
  gitWorktreeInventoryObservationSchema,
  gitWorktreeObservationSchema,
  knowledgeChunkSchema,
  knowledgeSourceSchema,
  leaseSchema,
  machineIdentityBindingObservationSchema,
  mcpCredentialAudienceObservationSchema,
  operationShapeSchema,
  policyPlanReceiptSchema,
  principalSchema,
  projectSubstrateAdmissionObservationSchema,
  projectSubstrateBackupRequirementObservationSchema,
  projectSubstrateContractValidationReceiptSchema,
  projectTeardownCompletionReceiptSchema,
  projectTeardownPlanReceiptSchema,
  pullRequestAbsenceReceiptSchema,
  pullRequestReceiptSchema,
  qualityGateSchema,
  remoteAgentBaseImageObservationSchema,
  remoteAgentNetworkPostureObservationSchema,
  remoteAgentSetupReceiptSchema,
  repositoryIdentityReconciliationObservationSchema,
  resourceBudgetObservationSchema,
  restoreDrillReceiptSchema,
  rulesetObservationSchema,
  runnerHostObservationSchema,
  runnerIsolationObservationSchema,
  runSchema,
  sessionSchema,
  startupPhaseSchema,
  statusCheckSourceObservationSchema,
  toolProvenanceSchema,
  verificationCommandSpecSchema,
  workflowRunReceiptSchema,
  workspaceContextSchema,
} from '../src/index.ts';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const generatedDir = resolve(packageRoot, 'generated');
const checkMode = process.argv.includes('--check');

type JsonSchemaObject = Record<string, unknown>;

type SchemaEntry = {
  file: string;
  title: string;
  schema: z.ZodType;
  jsonSchemaTransform?: (schema: JsonSchemaObject) => JsonSchemaObject;
};

const withJsonSchemaAllOf =
  (clauses: JsonSchemaObject[]) =>
  (schema: JsonSchemaObject): JsonSchemaObject => ({
    ...schema,
    allOf: [...(Array.isArray(schema.allOf) ? schema.allOf : []), ...clauses],
  });

const jsonSchemaThenKey = 'then';

const backupReadinessReadyGuard = {
  if: {
    required: ['payload'],
    properties: {
      payload: {
        required: ['readiness_state_kind'],
        properties: {
          readiness_state_kind: { const: 'ready' },
        },
      },
    },
  },
  [jsonSchemaThenKey]: {
    properties: {
      payload: {
        required: ['restore_drill_evidence_refs', 'tombstone_state_kind'],
        properties: {
          restore_drill_evidence_refs: { minItems: 1 },
          tombstone_state_kind: { const: 'not_tombstoned' },
        },
      },
    },
  },
};

const restoreDrillSucceededGuard = {
  if: {
    required: ['payload'],
    properties: {
      payload: {
        required: ['drill_result_kind'],
        properties: {
          drill_result_kind: { const: 'succeeded' },
        },
      },
    },
  },
  [jsonSchemaThenKey]: {
    properties: {
      payload: {
        required: [
          'boot_verification_kind',
          'service_verification_kind',
          'boot_verification_evidence_refs',
          'service_verification_evidence_refs',
        ],
        properties: {
          boot_verification_kind: { const: 'verified' },
          service_verification_kind: { const: 'verified' },
          boot_verification_evidence_refs: { minItems: 1 },
          service_verification_evidence_refs: { minItems: 1 },
        },
      },
    },
  },
};

const projectBackupRequirementDisposableGuard = {
  if: {
    required: ['payload'],
    properties: {
      payload: {
        required: ['persistent_data_kind'],
        properties: {
          persistent_data_kind: { const: 'disposable_rebuildable' },
        },
      },
    },
  },
  [jsonSchemaThenKey]: {
    properties: {
      payload: {
        required: ['disposability_declared', 'teardown_evidence_refs'],
        properties: {
          disposability_declared: { const: true },
          teardown_evidence_refs: { minItems: 1 },
        },
      },
    },
  },
};

const schemaEntries: SchemaEntry[] = [
  {
    file: 'AgentClient.schema.json',
    title: 'AgentClient',
    schema: agentClientSchema,
  },
  {
    file: 'ApprovalGrant.schema.json',
    title: 'ApprovalGrant',
    schema: approvalGrantSchema,
  },
  {
    file: 'BoundaryObservation.schema.json',
    title: 'BoundaryObservation',
    schema: boundaryObservationSchema,
  },
  {
    file: 'BackupReadinessObservation.schema.json',
    title: 'BackupReadinessObservation',
    schema: backupReadinessObservationSchema,
    jsonSchemaTransform: withJsonSchemaAllOf([backupReadinessReadyGuard]),
  },
  {
    file: 'BackupCredentialCustodyObservation.schema.json',
    title: 'BackupCredentialCustodyObservation',
    schema: backupCredentialCustodyObservationSchema,
  },
  {
    file: 'CredentialSource.schema.json',
    title: 'CredentialSource',
    schema: credentialSourceSchema,
  },
  {
    file: 'CredentialAuthorityObservation.schema.json',
    title: 'CredentialAuthorityObservation',
    schema: credentialAuthorityObservationSchema,
  },
  {
    file: 'CleanRoomSmokeReceipt.schema.json',
    title: 'CleanRoomSmokeReceipt',
    schema: cleanRoomSmokeReceiptSchema,
  },
  {
    file: 'CoordinationFact.schema.json',
    title: 'CoordinationFact',
    schema: coordinationFactSchema,
  },
  {
    file: 'Decision.schema.json',
    title: 'Decision',
    schema: decisionSchema,
  },
  {
    file: 'DerivedSummary.schema.json',
    title: 'DerivedSummary',
    schema: derivedSummarySchema,
  },
  {
    file: 'Evidence.schema.json',
    title: 'Evidence',
    schema: evidenceSchema,
  },
  {
    file: 'GitIdentityBinding.schema.json',
    title: 'GitIdentityBinding',
    schema: gitIdentityBindingSchema,
  },
  {
    file: 'GitHubMutationAuthority.schema.json',
    title: 'GitHubMutationAuthority',
    schema: githubMutationAuthoritySchema,
  },
  {
    file: 'GitRepositoryObservation.schema.json',
    title: 'GitRepositoryObservation',
    schema: gitRepositoryObservationSchema,
  },
  {
    file: 'GitRemoteObservation.schema.json',
    title: 'GitRemoteObservation',
    schema: gitRemoteObservationSchema,
  },
  {
    file: 'GitWorktreeObservation.schema.json',
    title: 'GitWorktreeObservation',
    schema: gitWorktreeObservationSchema,
  },
  {
    file: 'GitWorktreeInventoryObservation.schema.json',
    title: 'GitWorktreeInventoryObservation',
    schema: gitWorktreeInventoryObservationSchema,
  },
  {
    file: 'GitBranchAncestryObservation.schema.json',
    title: 'GitBranchAncestryObservation',
    schema: gitBranchAncestryObservationSchema,
  },
  {
    file: 'GitDirtyStateObservation.schema.json',
    title: 'GitDirtyStateObservation',
    schema: gitDirtyStateObservationSchema,
  },
  {
    file: 'PullRequestReceipt.schema.json',
    title: 'PullRequestReceipt',
    schema: pullRequestReceiptSchema,
  },
  {
    file: 'PullRequestAbsenceReceipt.schema.json',
    title: 'PullRequestAbsenceReceipt',
    schema: pullRequestAbsenceReceiptSchema,
  },
  {
    file: 'RulesetObservation.schema.json',
    title: 'RulesetObservation',
    schema: rulesetObservationSchema,
  },
  {
    file: 'RepositoryIdentityReconciliationObservation.schema.json',
    title: 'RepositoryIdentityReconciliationObservation',
    schema: repositoryIdentityReconciliationObservationSchema,
  },
  {
    file: 'MCPCredentialAudienceObservation.schema.json',
    title: 'MCPCredentialAudienceObservation',
    schema: mcpCredentialAudienceObservationSchema,
  },
  {
    file: 'MachineIdentityBindingObservation.schema.json',
    title: 'MachineIdentityBindingObservation',
    schema: machineIdentityBindingObservationSchema,
  },
  {
    file: 'StatusCheckSourceObservation.schema.json',
    title: 'StatusCheckSourceObservation',
    schema: statusCheckSourceObservationSchema,
  },
  {
    file: 'EnvProvenance.schema.json',
    title: 'EnvProvenance',
    schema: envProvenanceSchema,
  },
  {
    file: 'ExecutionContext.schema.json',
    title: 'ExecutionContext',
    schema: executionContextSchema,
  },
  {
    file: 'KnowledgeChunk.schema.json',
    title: 'KnowledgeChunk',
    schema: knowledgeChunkSchema,
  },
  {
    file: 'KnowledgeSource.schema.json',
    title: 'KnowledgeSource',
    schema: knowledgeSourceSchema,
  },
  {
    file: 'Lease.schema.json',
    title: 'Lease',
    schema: leaseSchema,
  },
  {
    file: 'OperationShape.schema.json',
    title: 'OperationShape',
    schema: operationShapeSchema,
  },
  {
    file: 'PolicyPlanReceipt.schema.json',
    title: 'PolicyPlanReceipt',
    schema: policyPlanReceiptSchema,
  },
  {
    file: 'Principal.schema.json',
    title: 'Principal',
    schema: principalSchema,
  },
  {
    file: 'ProjectSubstrateContractValidationReceipt.schema.json',
    title: 'ProjectSubstrateContractValidationReceipt',
    schema: projectSubstrateContractValidationReceiptSchema,
  },
  {
    file: 'ProjectSubstrateAdmissionObservation.schema.json',
    title: 'ProjectSubstrateAdmissionObservation',
    schema: projectSubstrateAdmissionObservationSchema,
  },
  {
    file: 'ProjectTeardownPlanReceipt.schema.json',
    title: 'ProjectTeardownPlanReceipt',
    schema: projectTeardownPlanReceiptSchema,
  },
  {
    file: 'ProjectTeardownCompletionReceipt.schema.json',
    title: 'ProjectTeardownCompletionReceipt',
    schema: projectTeardownCompletionReceiptSchema,
  },
  {
    file: 'ProjectSubstrateBackupRequirementObservation.schema.json',
    title: 'ProjectSubstrateBackupRequirementObservation',
    schema: projectSubstrateBackupRequirementObservationSchema,
    jsonSchemaTransform: withJsonSchemaAllOf([projectBackupRequirementDisposableGuard]),
  },
  {
    file: 'QualityGate.schema.json',
    title: 'QualityGate',
    schema: qualityGateSchema,
  },
  {
    file: 'RemoteAgentBaseImageObservation.schema.json',
    title: 'RemoteAgentBaseImageObservation',
    schema: remoteAgentBaseImageObservationSchema,
  },
  {
    file: 'RemoteAgentSetupReceipt.schema.json',
    title: 'RemoteAgentSetupReceipt',
    schema: remoteAgentSetupReceiptSchema,
  },
  {
    file: 'RemoteAgentNetworkPostureObservation.schema.json',
    title: 'RemoteAgentNetworkPostureObservation',
    schema: remoteAgentNetworkPostureObservationSchema,
  },
  {
    file: 'ResourceBudgetObservation.schema.json',
    title: 'ResourceBudgetObservation',
    schema: resourceBudgetObservationSchema,
  },
  {
    file: 'Run.schema.json',
    title: 'Run',
    schema: runSchema,
  },
  {
    file: 'RunnerHostObservation.schema.json',
    title: 'RunnerHostObservation',
    schema: runnerHostObservationSchema,
  },
  {
    file: 'RunnerIsolationObservation.schema.json',
    title: 'RunnerIsolationObservation',
    schema: runnerIsolationObservationSchema,
  },
  {
    file: 'RestoreDrillReceipt.schema.json',
    title: 'RestoreDrillReceipt',
    schema: restoreDrillReceiptSchema,
    jsonSchemaTransform: withJsonSchemaAllOf([restoreDrillSucceededGuard]),
  },
  {
    file: 'Session.schema.json',
    title: 'Session',
    schema: sessionSchema,
  },
  {
    file: 'StartupPhase.schema.json',
    title: 'StartupPhase',
    schema: startupPhaseSchema,
  },
  {
    file: 'ToolProvenance.schema.json',
    title: 'ToolProvenance',
    schema: toolProvenanceSchema,
  },
  {
    file: 'VerificationCommandSpec.schema.json',
    title: 'VerificationCommandSpec',
    schema: verificationCommandSpecSchema,
  },
  {
    file: 'WorkflowRunReceipt.schema.json',
    title: 'WorkflowRunReceipt',
    schema: workflowRunReceiptSchema,
  },
  {
    file: 'WorkspaceContext.schema.json',
    title: 'WorkspaceContext',
    schema: workspaceContextSchema,
  },
];

const drifted: string[] = [];

await mkdir(generatedDir, { recursive: true });

for (const entry of schemaEntries) {
  const baseSchema = z.toJSONSchema(entry.schema) as JsonSchemaObject;
  const transformedSchema = entry.jsonSchemaTransform
    ? entry.jsonSchemaTransform(baseSchema)
    : baseSchema;
  const generated = {
    $id: `https://jefahnierocks.local/host-capability-substrate/schemas/${entry.file}`,
    title: entry.title,
    ...transformedSchema,
  };
  const rendered = `${JSON.stringify(generated, null, 2)}\n`;
  const target = resolve(generatedDir, entry.file);

  if (checkMode) {
    const previous = await readFile(target, 'utf8').catch(() => '');
    if (previous !== rendered) {
      drifted.push(entry.file);
    }
    continue;
  }

  await writeFile(target, rendered, 'utf8');
}

if (drifted.length > 0) {
  process.stderr.write(`Schema drift detected: ${drifted.join(', ')}\n`);
  process.exitCode = 1;
} else if (checkMode) {
  process.stdout.write('generated schemas are current\n');
} else {
  process.stdout.write(`generated ${schemaEntries.length} JSON Schema files\n`);
}
