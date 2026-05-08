import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import {
  agentClientSchema,
  boundaryObservationSchema,
  cleanRoomSmokeReceiptSchema,
  coordinationFactSchema,
  credentialAuthorityObservationSchema,
  credentialSourceSchema,
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
  machineIdentityBindingObservationSchema,
  mcpCredentialAudienceObservationSchema,
  operationShapeSchema,
  policyPlanReceiptSchema,
  projectSubstrateAdmissionObservationSchema,
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
  rulesetObservationSchema,
  runnerHostObservationSchema,
  runnerIsolationObservationSchema,
  startupPhaseSchema,
  statusCheckSourceObservationSchema,
  toolProvenanceSchema,
  verificationCommandSpecSchema,
  workflowRunReceiptSchema,
} from '../src/index.ts';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const generatedDir = resolve(packageRoot, 'generated');
const checkMode = process.argv.includes('--check');

const schemaEntries = [
  {
    file: 'AgentClient.schema.json',
    title: 'AgentClient',
    schema: agentClientSchema,
  },
  {
    file: 'BoundaryObservation.schema.json',
    title: 'BoundaryObservation',
    schema: boundaryObservationSchema,
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
] as const;

const drifted: string[] = [];

await mkdir(generatedDir, { recursive: true });

for (const entry of schemaEntries) {
  const generated = {
    $id: `https://jefahnierocks.local/host-capability-substrate/schemas/${entry.file}`,
    title: entry.title,
    ...z.toJSONSchema(entry.schema),
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
