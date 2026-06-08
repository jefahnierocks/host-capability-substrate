import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  codexShellEnvironmentPolicyModeSchema,
  envInheritanceModeSchema,
  executionContextKindSchema,
  executionContextSchema,
  executionContextSurfaceSchema,
  sandboxProfileSchema,
  shellCarrierSchema,
} from '../src/index.ts';

// ExecutionContext is a canonical M1 Ring-0 entity (ADR 0016/0017, surface-extended
// by ADR 0037; on the canonical list per ADR 0021 inv. 17). It was previously only
// exercised indirectly (shell-env-entities / operation-shape / resolved-tool tests);
// this is its dedicated suite.

const evidenceRef = {
  evidence_id: 'evidence:exec-context:probe-1',
  source: 'BoundaryObservation:execution-context',
  observed_at: '2026-06-08T00:00:00Z',
  authority: 'host-observation',
  confidence: 'high',
} as const;

const base = {
  schema_version: '0.2.0',
  execution_context_id: 'ctx:claude-code-cli:tool-call',
  surface: 'claude_code_cli',
  kind: 'cli',
  phase: 'tool_call_subprocess',
  shell: {
    carrier: 'shell_command',
    shell_path: '/bin/zsh',
    argv_flags: ['-c'],
    login_observed: 'observed_absent',
    interactive_observed: 'observed_absent',
    startup_files_observed: ['user_zshenv'],
    marker_env_visible: 'observed_absent',
  },
  sandbox: {
    profile: 'sandbox_exec',
    filesystem: 'observed_denied',
    network: 'observed_denied',
    keychain: 'unknown',
  },
  env_inheritance: {
    mode: 'codex_shell_environment_policy',
    terminal_shell_inherited: 'observed_absent',
    operator_policy: 'include_only',
  },
  evidence_refs: [evidenceRef],
} as const;

describe('ExecutionContext schema (ADR 0016 / 0017 / 0037)', () => {
  it('validates a well-formed ExecutionContext and applies defaults', () => {
    const ctx = executionContextSchema.parse(base);
    expect(ctx.surface).toBe('claude_code_cli');
    expect(ctx.kind).toBe('cli');
    expect(ctx.phase).toBe('tool_call_subprocess');
    // defaults
    expect(ctx.latest_containment_evidence_ref).toBeNull();
    expect(ctx.kernel_sandbox_kind).toBe('unknown');
    expect(ctx.open_questions).toEqual([]);
    // optional FK fields are absent unless provided
    expect(ctx.host_id).toBeUndefined();
    expect(ctx.workspace_id).toBeUndefined();
    expect(ctx.agent_client_id).toBeUndefined();
  });

  it('pins schema_version to the 0.2.0 literal (post ADR 0037 surface + cache extension)', () => {
    for (const bad of ['0.1.0', '0.3.0', '1.0.0', '0.2', '']) {
      expect(executionContextSchema.safeParse({ ...base, schema_version: bad }).success).toBe(
        false,
      );
    }
  });

  it('accepts each surface value and rejects out-of-enum', () => {
    for (const surface of executionContextSurfaceSchema.options) {
      expect(executionContextSchema.safeParse({ ...base, surface }).success).toBe(true);
    }
    for (const bad of ['cli', 'gemini_cli', 'jetbrains_ide', '']) {
      expect(executionContextSchema.safeParse({ ...base, surface: bad }).success).toBe(false);
    }
  });

  it('accepts each kind value and rejects out-of-enum', () => {
    for (const kind of executionContextKindSchema.options) {
      expect(executionContextSchema.safeParse({ ...base, kind }).success).toBe(true);
    }
    for (const bad of ['gui', 'daemon', 'codex_cli', '']) {
      expect(executionContextSchema.safeParse({ ...base, kind: bad }).success).toBe(false);
    }
  });

  it('accepts each shell carrier and sandbox profile, rejecting out-of-enum', () => {
    for (const carrier of shellCarrierSchema.options) {
      expect(
        executionContextSchema.safeParse({ ...base, shell: { ...base.shell, carrier } }).success,
      ).toBe(true);
    }
    expect(
      executionContextSchema.safeParse({ ...base, shell: { ...base.shell, carrier: 'pipe' } })
        .success,
    ).toBe(false);
    for (const profile of sandboxProfileSchema.options) {
      expect(
        executionContextSchema.safeParse({ ...base, sandbox: { ...base.sandbox, profile } })
          .success,
      ).toBe(true);
    }
    expect(
      executionContextSchema.safeParse({ ...base, sandbox: { ...base.sandbox, profile: 'docker' } })
        .success,
    ).toBe(false);
  });

  it('accepts each env-inheritance mode and the optional codex operator_policy vocab', () => {
    for (const mode of envInheritanceModeSchema.options) {
      expect(
        executionContextSchema.safeParse({
          ...base,
          env_inheritance: { ...base.env_inheritance, mode },
        }).success,
      ).toBe(true);
    }
    for (const operator_policy of codexShellEnvironmentPolicyModeSchema.options) {
      expect(
        executionContextSchema.safeParse({
          ...base,
          env_inheritance: { ...base.env_inheritance, operator_policy },
        }).success,
      ).toBe(true);
    }
    // operator_policy is nullable+optional; null and absent both accepted
    expect(
      executionContextSchema.safeParse({
        ...base,
        env_inheritance: { mode: 'none', terminal_shell_inherited: 'not_applicable' },
      }).success,
    ).toBe(true);
  });

  it('requires at least one evidence_ref', () => {
    expect(executionContextSchema.safeParse({ ...base, evidence_refs: [] }).success).toBe(false);
  });

  it('accepts the ADR 0037 containment cache pointer + kernel_sandbox_kind cache', () => {
    const ctx = executionContextSchema.parse({
      ...base,
      latest_containment_evidence_ref: {
        evidence_id: 'bo:containment:claude-cli:tool-call',
        source: 'BoundaryObservation:containment_class',
        observed_at: '2026-06-08T00:00:00Z',
        valid_until: '2026-06-09T00:00:00Z',
        authority: 'host-observation',
        confidence: 'high',
      },
      kernel_sandbox_kind: 'sandbox_exec',
    });
    expect(ctx.latest_containment_evidence_ref?.evidence_id).toBe(
      'bo:containment:claude-cli:tool-call',
    );
    expect(ctx.kernel_sandbox_kind).toBe('sandbox_exec');
  });

  it('rejects extra keys at the envelope and in each nested .strict() object', () => {
    expect(executionContextSchema.safeParse({ ...base, injected: true }).success).toBe(false);
    expect(
      executionContextSchema.safeParse({ ...base, shell: { ...base.shell, injected: true } })
        .success,
    ).toBe(false);
    expect(
      executionContextSchema.safeParse({ ...base, sandbox: { ...base.sandbox, injected: true } })
        .success,
    ).toBe(false);
    expect(
      executionContextSchema.safeParse({
        ...base,
        env_inheritance: { ...base.env_inheritance, injected: true },
      }).success,
    ).toBe(false);
  });

  it('lists the canonical required fields in the generated schema', () => {
    const schema = JSON.parse(
      readFileSync(new URL('../generated/ExecutionContext.schema.json', import.meta.url), 'utf8'),
    ) as { required: string[] };
    // the always-required envelope fields (optional/defaulted fields are excluded)
    for (const key of [
      'schema_version',
      'execution_context_id',
      'surface',
      'kind',
      'phase',
      'shell',
      'sandbox',
      'env_inheritance',
      'evidence_refs',
    ]) {
      expect(schema.required).toContain(key);
    }
  });
});
