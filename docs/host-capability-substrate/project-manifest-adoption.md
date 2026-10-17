# HCS Project Manifest Specification 1 adoption

`project.yaml` is HCS's derived repository lookup declaration. `PLAN.md`
Current Focus remains status authority. This migration records active source
development (`active-build`), the retained `working-prototype` posture, and the
review date `2026-10-17`; it claims no running HCS service. An empty platforms
list makes no additional portability claim. Empty stacks and host requirements
declare no Compose stack or container/Android prerequisite.

This is Ring 3 repository tooling under ADRs 0001, 0011 and 0073, recorded in
D-091. It adds no HCS ontology entity, runtime capability, mutation endpoint,
policy, secret-delivery path, WorkspaceContext projection or Q-014 admission
implementation. The existing charter, phase and D-028/D-090 seam stay binding.

## Approved release and executable bytes

HCS adopts the owner-approved
[Project Manifest Release 1](https://github.com/jefahnierocks/project-manifest/releases/tag/release-1),
source `56e3920089726e585eaa0fd7f4dc94e6938a1e0c`, with the exact
[vendored byte binding and MIT license](../../vendor/project-manifest/README.md).
The closed unit contains all 20 table-listed files and canonical `release.json`;
the separately pinned bootstrap remains outside it. Candidate-named APIs/files
inside the release are retained exactly; HCS uses the actual released API,
`acquire.observe_released_repository`.

The fresh HCS adapter first reads bounded regular no-follow bootstrap bytes,
checks their literal SHA-256, and only then executes those captured bytes.
It asks the bootstrap to verify the explicit released format and complete
closed namespace against the literal domain-separated table digest, then
checks origin, source revision, release/spec IDs and observation protocol.
It captures all six runtime module byte strings, checks their table sizes and
hashes, verifies the closed unit again, and checks each captured module again
at execution. The private import namespace has no filesystem or installed
package fallback. No bootstrap or released payload is imported before its
corresponding authentication step.

HCS's outer `declaration_validity` is `valid`, `invalid` or `not_checked`.
It combines HCS's literal release approval, successful byte binding and exactly
one real released observation. Nested release approval/complete-v1 diagnostics
remain `not_checked`; they are not rewritten into producer claims. Runtime
acceptance and producer admission remain `not_checked` in the outer report.
Validation failures expose fixed codes/locations, never raw Git stderr,
repository values, paths or environment values. `--status` returns a declared
status projection only after that same observation succeeds.

## Prepared native entry

Use existing prepared tools and dependencies; these commands do not install:

```sh
MISE_EXEC_AUTO_INSTALL=0 mise exec -- just manifest-check
MISE_EXEC_AUTO_INSTALL=0 mise exec -- just manifest-status
MISE_EXEC_AUTO_INSTALL=0 mise exec -- just project-manifest-fixture
MISE_EXEC_AUTO_INSTALL=0 HCS_SKIP_HOST_FIXTURES=1 mise exec -- just verify
```

Python is isolated with `-I -S -B`; the existing project pin remains `3.13.16`
(released API minimum `3.11`). Native Git `>=2.56.0` is required. Set
`HCS_MANIFEST_GIT` to an explicit absolute native `git` executable when needed;
otherwise the adapter resolves native Git from the incoming PATH. Script shims
are refused before execution. The native-header check establishes executable
format, not binary authenticity: selection assumes an already trusted installed
Git. To accommodate the released API's Git resolution,
only the standalone observation temporarily prefixes that executable's parent;
the incoming PATH is restored even on failure. No project role or other tool
is dispatched through this prefix. Node/npm/Just selection is unchanged.

Normal local checks observe tracked working bytes. A linked worktree requires
explicit common-storage authority, for example `HCS_MANIFEST_COMMON_DIR` set
to the owning repository's physical `.git` directory, or the equivalent
`--common-dir` argument. The adapter does not discover and silently authorize
external storage. Inherited Git overrides remain subject to the released
API's refusal; they are never erased to obtain a pass.

Revision mode accepts only a full lowercase 40/64-character object ID:
`python3 -I -S -B scripts/ci/project-manifest.py --mode rev --revision <oid>`.
GitHub Actions always observes the literal `GITHUB_SHA` selected by its event;
conflicting mode/revision arguments are refused. No `HEAD`/branch/tag fallback
is available. The adapter supplies an explicit UTC reference day to the API;
`--reference-date` makes synthetic fixtures reproducible.

## Declared roles

Only the released `mise` runner token is used. Existing Just recipes retain
their implementations, and native mise aliases expose the declaration:

| Specification role | Mise target | Existing implementation / effect |
| --- | --- | --- |
| setup | `setup` | `just bootstrap`: tool and Node dependency installation, explicit owner action |
| check | `verify` | `just verify`: existing full gate; CI/source scope explicitly skips host fixtures |
| test | `test` | `just test`: source tests |
| build | null | No application build declared |
| dev | null | No HCS service or development server declared |
| format_check | `format-check` | `just format-check`: no writes |
| format_write | `format-write` | `just format-fix`: source writes in a prepared checkout |

The older mise `bootstrap` task remains npm-only; the new `setup` alias does
not silently change it. The validator checks declarations and reference paths;
it never executes any declared role, setup, formatter or service. HCS fixtures
separately assert its own mappings. `environment.owner: mise` records current
ownership; null template/secret launcher introduces no ambient secret delivery.
The prior dated setup/native-entry receipts remain historical evidence.

## CI preparation and remaining acceptance

The existing macOS job prepares a native Git 2.56.0 reader in a unique
`RUNNER_TEMP/hcs-manifest-git-*` prefix. Its helper is adapted from the explicitly
provided public-safe Dicee helper, source
`48ab6258979324d72b3bc04810ad2356eb962716`, SHA-256
`22864eed7eacbdccadcf71ae7006971b6f2441e0aebea10fe4007d77e7d55695`,
whose header traces public project-manifest source
`9797b48786f6da0e4e5167a25c2a873e6945269c`.
HCS binds macOS runner identity/architecture, its unchanged Python pin and
system `/usr/bin/make` + `/usr/bin/clang`. After Homebrew changes PATH, CI uses
`mise which python` to obtain the actual prepared executable, checks that
`mise exec -- python3` selects that same Python3.13.16, and retains its absolute
path for Git preparation. The full gate also runs through prepared mise with
auto-install disabled. The source URL and SHA-256 are fixed:

```text
https://www.kernel.org/pub/software/scm/git/git-2.56.0.tar.xz
26c56c296b38c0695b26fa95f475f1d01704d2d38e73465ca30b0b2f5dc789d3
```

Downloads and build occur only in this explicit CI preparation step, with size,
time and archive-path limits and an isolated build-child environment. The
checksum is checked before extraction/build; no tar-signature verification is
claimed. The helper does not install globally, replace runner tools, append
to `GITHUB_PATH`, or change the caller's PATH. Its output sets only
`HCS_MANIFEST_GIT` for the following gate step. The output is opened through
anchored directory descriptors under runner temp, retained across preparation,
and identity-checked before publication. The JSON diagnostic record contains closed stage/failure codes and numeric
Python/Git versions; it does not echo paths, exception strings, environment
values or child stderr. Make/clang build stdout and stderr remain separate
ordinary CI logs and may contain build paths and compiler diagnostics. The
build child receives only its explicit PATH, owned HOME and LC_ALL values. The pinned runner/system-tool
recipe is a source proposal until actual hosted qualification succeeds.

The native workflow runs for push and pull_request without branch/path filters
or job conditions; its verify job/check identity and cancellation behavior are
preserved. `just verify` includes the declaration check and focused consumer fixtures.
These cover actual worktree/revision/linked acquisition, literal CI binding,
invalid/legacy/unavailable results, inherited override refusal, bootstrap/
payload/namespace/captured-byte tampering, value-blind failures, native Git
selection, prefix traps, exception-path PATH restoration, preloaded import
namespace refusal, one-observation status, helper preflight/checksum refusals,
anchored output path/replacement refusal, archive symlink filtering, coded build
timeout/version failures and closed diagnostics. They do not rerun or re-label the producer's full qualification suite.

Source review and source-only verification establish only their recorded
scope. Hosted macOS qualification, normal signed publication, Dicee Pilot 2,
controller adoption acceptance, remaining fleet rollout, producer operational
acceptance and baseline 0.2 are separate gates. No Linux qualification,
workstation repair, HCS runtime installation or live-provider acceptance is
claimed by this migration.
