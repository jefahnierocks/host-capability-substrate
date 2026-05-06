import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import {
  agentClientSchema,
  boundaryObservationSchema,
  coordinationFactSchema,
  credentialSourceSchema,
  derivedSummarySchema,
  envProvenanceSchema,
  evidenceSchema,
  executionContextSchema,
  knowledgeChunkSchema,
  knowledgeSourceSchema,
  startupPhaseSchema,
  verificationCommandSpecSchema,
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
    file: 'StartupPhase.schema.json',
    title: 'StartupPhase',
    schema: startupPhaseSchema,
  },
  {
    file: 'VerificationCommandSpec.schema.json',
    title: 'VerificationCommandSpec',
    schema: verificationCommandSpecSchema,
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
