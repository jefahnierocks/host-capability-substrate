import { z } from 'zod';
import {
  entityIdSchema,
  envVariableNameSchema,
  evidenceRefSchema,
  isoDateTimeSchema,
  schemaVersionSchema,
} from '../common.ts';

const exitCodeSchema = z.number().int().min(0).max(255).describe('POSIX-style process exit code.');

const secretLikeEnvNamePattern = /(^|_)(KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL)(_|$)/;
const envReferencePattern = /\$(?:\{([A-Za-z_][A-Za-z0-9_]*)\}|([A-Za-z_][A-Za-z0-9_]*))/g;

export const verificationCommandEnvCaptureModeSchema = z
  .enum(['name_only', 'existence_only'])
  .describe(
    'Secret-safe capture mode for environment-variable names referenced by a verify command.',
  );

export const verificationCommandEnvRefSchema = z
  .object({
    variable_name: envVariableNameSchema,
    env_capture_mode: verificationCommandEnvCaptureModeSchema,
    required: z.boolean().default(false),
  })
  .strict()
  .describe('Environment variable reference carried by name only, never by value.');

export const verificationCommandShapeSchema = z
  .object({
    operation_class: z.literal('workspace_verify'),
    mutation_scope: z.literal('verify_workspace'),
    argv: z.array(z.string().min(1)).min(1),
    env_refs: z.array(verificationCommandEnvRefSchema).default([]),
  })
  .strict()
  .superRefine((value, ctx) => {
    const declaredEnvRefs = new Set(value.env_refs.map((ref) => ref.variable_name));

    for (const [index, arg] of value.argv.entries()) {
      const matches = arg.matchAll(envReferencePattern);

      for (const match of matches) {
        const variableName = match[1] ?? match[2];

        if (
          variableName &&
          secretLikeEnvNamePattern.test(variableName) &&
          !declaredEnvRefs.has(variableName)
        ) {
          ctx.addIssue({
            code: 'custom',
            message:
              'secret-shaped env var references in argv require an env_refs entry with name_only or existence_only capture mode.',
            path: ['argv', index],
          });
        }
      }
    }
  })
  .describe('Verification command OperationShape-like payload: typed argv, not a shell string.');

export const verificationCommandExpectedExitCodesSchema = z
  .object({
    success_codes: z.array(exitCodeSchema).min(1),
    allowed_failure_codes: z.array(exitCodeSchema).default([]),
  })
  .strict()
  .refine(
    (value) => !value.allowed_failure_codes.some((code) => value.success_codes.includes(code)),
    {
      message: 'allowed_failure_codes must not overlap success_codes.',
      path: ['allowed_failure_codes'],
    },
  )
  .describe('Exit-code classification for a verification command.');

export const verificationCommandOutputEvidenceKindSchema = z
  .enum(['verification_receipt', 'diagnostic_report'])
  .describe('Expected evidence family produced by a verification command run.');

export const verificationCommandSpecStateSchema = z
  .enum(['active', 'deprecated', 'retired'])
  .describe('Lifecycle state for a VerificationCommandSpec record.');

export const verificationCommandSpecSchema = z
  .object({
    schema_version: schemaVersionSchema,
    verification_command_spec_id: entityIdSchema,
    workspace_context_id: entityIdSchema,
    command_shape: verificationCommandShapeSchema,
    expected_exit_codes: verificationCommandExpectedExitCodesSchema,
    output_evidence_kind: verificationCommandOutputEvidenceKindSchema,
    verification_command_spec_state: verificationCommandSpecStateSchema,
    author_session_id: entityIdSchema,
    author_agent_client_id: entityIdSchema,
    kernel_observed_at: isoDateTimeSchema,
    valid_until: isoDateTimeSchema.nullable(),
    evidence_refs: z.array(evidenceRefSchema).min(1),
  })
  .strict()
  .describe('Ring 0 VerificationCommandSpec entity from ADR 0036 and ADR 0038 Phase 2.1.2.');

export type VerificationCommandEnvCaptureMode = z.infer<
  typeof verificationCommandEnvCaptureModeSchema
>;
export type VerificationCommandEnvRef = z.infer<typeof verificationCommandEnvRefSchema>;
export type VerificationCommandShape = z.infer<typeof verificationCommandShapeSchema>;
export type VerificationCommandExpectedExitCodes = z.infer<
  typeof verificationCommandExpectedExitCodesSchema
>;
export type VerificationCommandOutputEvidenceKind = z.infer<
  typeof verificationCommandOutputEvidenceKindSchema
>;
export type VerificationCommandSpecState = z.infer<typeof verificationCommandSpecStateSchema>;
export type VerificationCommandSpec = z.infer<typeof verificationCommandSpecSchema>;
