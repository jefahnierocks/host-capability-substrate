#!/usr/bin/env -S python3 -I -S -B
"""Focused HCS consumer trust-boundary fixtures, separate from producer tests."""

from contextlib import contextmanager
from contextlib import redirect_stdout
from dataclasses import replace
import importlib.util
import io
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tarfile
import tempfile
import types
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
ADAPTER = ROOT / "scripts/ci/project-manifest.py"
VENDOR = ROOT / "vendor/project-manifest"
MANIFEST = b'''spec_version: "1"
project:
  id: hcs-fixture
  display_name: "HCS fixture"
  owner_entity: jefahnierocks
role: canonical
canonical: null
peers: []
status:
  posture: working-prototype
  operational_state: active-build
  local_phase: "Synthetic source fixture"
  as_of: "2026-10-17"
authority:
  status_of_record: "PLAN.md"
presentation:
  visibility: public-available
  public_alias: null
  link_policy: link-ok
development:
  platforms: []
  commands:
    setup: null
    check:
      runner: mise
      target: "verify"
    test: null
    build: null
    dev: null
    format_check: null
    format_write: null
  environment:
    owner: none
    template: null
    secret_launcher: null
  stacks: {}
  host_requirements: []
'''


def load_source(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


consumer = load_source(ADAPTER, "hcs_manifest_consumer_fixture")
prepare = load_source(ROOT / "scripts/ci/prepare-manifest-git.py", "hcs_git_prepare_fixture")


class ConsumerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="hcs-manifest-fixture-")
        self.addCleanup(self.temp.cleanup)
        self.owned = Path(self.temp.name).resolve()
        home = self.owned / "home"
        home.mkdir()
        self.git = consumer.native_git(os.environ.get("HCS_MANIFEST_GIT"))
        # This private synthetic fixture environment is never used to publish
        # source, mutate the workstation, or normalize a real repository.
        self.env = {"PATH": os.environ.get("PATH", ""), "HOME": str(home),
                    "HCS_MANIFEST_GIT": str(self.git), "GITHUB_ACTIONS": "false",
                    "LC_ALL": "C", "GIT_CONFIG_NOSYSTEM": "1"}
        self.repo = self.owned / "repo"
        self.repo.mkdir()
        self.git_run("init", str(self.repo))
        self.git_run("config", "core.hooksPath", "/dev/null")
        (self.repo / "project.yaml").write_bytes(MANIFEST)
        (self.repo / "PLAN.md").write_text("Synthetic status authority.\n")
        (self.repo / ".mise.toml").write_text('[tasks.verify]\nrun = "false"\n')
        self.git_run("add", "project.yaml", "PLAN.md", ".mise.toml")
        self.git_run("-c", "user.name=HCS synthetic fixture", "-c", "user.email=hcs-fixture@example.invalid",
                     "-c", "commit.gpgsign=false", "commit", "-m", "Synthetic fixture")
        self.oid = self.git_run("rev-parse", "HEAD").stdout.decode().strip()

    def git_run(self, *args):
        return subprocess.run([str(self.git), *args], cwd=self.repo, env=self.env,
                              capture_output=True, check=True, timeout=20)

    def run_consumer(self, *args, env=None, code=0):
        result = subprocess.run([sys.executable, "-I", "-S", "-B", str(ADAPTER),
                                 "--root", str(self.repo), "--reference-date", "2026-10-17", *args],
                                env=self.env | (env or {}), cwd=self.owned,
                                capture_output=True, timeout=60)
        self.assertEqual(result.returncode, code, result.stdout.decode())
        self.assertEqual(result.stderr, b"")
        report = json.loads(result.stdout)
        self.assertEqual(report["exit_code"], code)
        self.assertNotIn(b"HCS_PRIVATE_SENTINEL", result.stdout + result.stderr)
        return report

    def test_actual_worktree_and_status_are_one_observation(self):
        args = consumer.parser().parse_args(["--root", str(self.repo), "--status",
                                             "--reference-date", "2026-10-17"])
        real_api = consumer.released_api
        calls = []

        @contextmanager
        def observed_api(captured):
            with real_api(captured) as api:
                original = api.observe_released_repository

                def once(*argv, **kwargs):
                    calls.append(1)
                    return original(*argv, **kwargs)

                with patch.object(api, "observe_released_repository", once):
                    yield api

        original_path = os.environ.get("PATH")
        with patch.dict(os.environ, self.env, clear=True), patch.object(consumer, "released_api", observed_api):
            selected_path = os.environ.get("PATH")
            report = consumer.evaluate(args)
            self.assertEqual(os.environ.get("PATH"), selected_path)
        self.assertEqual(os.environ.get("PATH"), original_path)
        self.assertEqual(calls, [1])
        self.assertEqual(report["exit_code"], 0)
        self.assertEqual(report["declaration_validity"], "valid")
        self.assertEqual(report["observation"]["complete_v1_validity"], "not_checked")
        self.assertEqual(report["byte_binding"]["release_approval"], "not_checked")
        self.assertEqual(report["runtime_acceptance"], "not_checked")
        self.assertEqual(report["producer_admission"], "not_checked")
        self.assertEqual(report["status_projection"]["project_id"], "hcs-fixture")

    def test_cli_validity_does_not_run_declared_mise_role(self):
        # The fixture's mise verify would fail. Observation reads its declaration.
        self.assertEqual(self.run_consumer()["declaration_validity"], "valid")

    def test_observation_exception_restores_path_and_import_namespace(self):
        args = consumer.parser().parse_args(["--root", str(self.repo)])
        real_api = consumer.released_api

        @contextmanager
        def failing_api(captured):
            with real_api(captured) as api:
                with patch.object(api, "observe_released_repository",
                                  side_effect=RuntimeError("HCS_PRIVATE_SENTINEL")):
                    yield api

        with patch.dict(os.environ, self.env, clear=True), \
                patch.object(consumer, "released_api", failing_api):
            original_path = os.environ["PATH"]
            report = consumer.evaluate(args)
            self.assertEqual(os.environ["PATH"], original_path)
        self.assertEqual(report["declaration_validity"], "not_checked")
        self.assertEqual(report["findings"], [{"code": "CONSUMER_UNAVAILABLE"}])
        self.assertNotIn("HCS_PRIVATE_SENTINEL", json.dumps(report))
        self.assertFalse(any(n == consumer.PACKAGE or n.startswith(consumer.PACKAGE + ".")
                             for n in sys.modules))

    def test_preloaded_import_namespace_is_refused_and_preserved(self):
        captured, _ = consumer.approved_payload(VENDOR)
        existing = types.ModuleType(consumer.PACKAGE)
        with patch.dict(sys.modules, {consumer.PACKAGE: existing}):
            with self.assertRaisesRegex(consumer.Refusal, "^IMPORT_NAMESPACE$"):
                with consumer.released_api(captured):
                    self.fail("preloaded namespace accepted")
            self.assertIs(sys.modules[consumer.PACKAGE], existing)

    def test_invalid_and_legacy_are_value_blind(self):
        for data in (MANIFEST.replace(b"active-build", b"HCS_PRIVATE_SENTINEL"),
                     b'spec_version: "0.1"\nprivate: HCS_PRIVATE_SENTINEL\n'):
            with self.subTest(data_hash=__import__("hashlib").sha256(data).hexdigest()):
                (self.repo / "project.yaml").write_bytes(data)
                self.assertEqual(self.run_consumer(code=1)["declaration_validity"], "invalid")

    def test_unavailable_and_git_overrides_are_closed(self):
        report = self.run_consumer("--root", str(self.owned / "absent"), code=2)
        self.assertEqual(report["declaration_validity"], "not_checked")
        report = self.run_consumer(env={"GIT_DIR": "HCS_PRIVATE_SENTINEL"}, code=2)
        self.assertEqual(report["observation"]["findings"][0]["code"], "NOT_CHECKED")

    def test_literal_revision_and_ci_event_binding(self):
        (self.repo / "project.yaml").write_bytes(b"invalid HCS_PRIVATE_SENTINEL\n")
        report = self.run_consumer("--mode", "rev", "--revision", self.oid)
        self.assertEqual(report["observation"]["commit_oid"], self.oid)
        self.run_consumer("--mode", "rev", "--revision", "HEAD", code=2)
        ci = {"GITHUB_ACTIONS": "true", "GITHUB_SHA": self.oid}
        self.assertEqual(self.run_consumer(env=ci)["observation"]["commit_oid"], self.oid)
        self.run_consumer("--mode", "worktree", env=ci, code=2)
        self.run_consumer("--revision", "0" * 40, env=ci, code=2)
        self.run_consumer(env=ci | {"GITHUB_SHA": "HEAD"}, code=2)

    def test_real_linked_worktree_needs_explicit_common_authority(self):
        linked = self.owned / "linked"
        self.git_run("worktree", "add", "-b", "fixture-linked", str(linked), self.oid)
        self.run_consumer("--root", str(linked), code=2)
        report = self.run_consumer("--root", str(linked), "--common-dir", str(self.repo / ".git"))
        self.assertEqual(report["declaration_validity"], "valid")

    def copy_vendor(self):
        target = self.owned / "vendor"
        shutil.copytree(VENDOR, target)
        return target

    def test_bootstrap_is_hashed_before_execution(self):
        vendor = self.copy_vendor()
        with (vendor / "bootstrap.py").open("ab") as output:
            output.write(b'\nraise RuntimeError("BOOTSTRAP_EXECUTED")\n')
        with self.assertRaisesRegex(consumer.Refusal, "^BOOTSTRAP_DIGEST$"):
            consumer.approved_payload(vendor)

    def test_payload_tamper_and_namespace_refusal(self):
        vendor = self.copy_vendor()
        member = vendor / "release-1/src/project_manifest/candidate.py"
        original = member.read_bytes()
        member.write_bytes(original + b"\n# tamper\n")
        with self.assertRaisesRegex(consumer.Refusal, "^RELEASE_BINDING$"):
            consumer.approved_payload(vendor)
        member.write_bytes(original)
        extra = vendor / "release-1/unapproved.py"
        extra.write_text("raise RuntimeError('UNAPPROVED_EXECUTED')\n")
        with self.assertRaisesRegex(consumer.Refusal, "^RELEASE_BINDING$"):
            consumer.approved_payload(vendor)
        extra.unlink()
        member.unlink()
        member.symlink_to(VENDOR / "release-1/src/project_manifest/candidate.py")
        with self.assertRaisesRegex(consumer.Refusal, "^RELEASE_BINDING$"):
            consumer.approved_payload(vendor)

    def test_captured_code_tamper_and_missing_module_have_no_fallback(self):
        captured, _ = consumer.approved_payload(VENDOR)
        captured["candidate"] = replace(captured["candidate"], data=b"raise RuntimeError('TAMPER_EXECUTED')")
        with self.assertRaisesRegex(consumer.Refusal, "^CAPTURE_DIGEST$"):
            with consumer.released_api(captured):
                self.fail("tampered import succeeded")
        captured.pop("candidate")
        with self.assertRaisesRegex(consumer.Refusal, "^CAPTURE_NAMESPACE$"):
            with consumer.released_api(captured):
                self.fail("missing module fell back")
        captured, _ = consumer.approved_payload(VENDOR)
        with consumer.released_api(captured):
            with self.assertRaisesRegex(ModuleNotFoundError, "CAPTURE_NAMESPACE"):
                __import__(consumer.PACKAGE + ".unapproved")

    def test_selected_script_git_is_never_executed(self):
        selected = self.owned / "git"
        marker = self.owned / "executed"
        selected.write_text("#!/bin/sh\ntouch " + str(marker) + "\n")
        selected.chmod(0o700)
        report = self.run_consumer(env={"HCS_MANIFEST_GIT": str(selected)}, code=2)
        self.assertEqual(report["findings"], [{"code": "GIT_NATIVE_REQUIRED"}])
        self.assertFalse(marker.exists())

    def test_native_git_prefix_does_not_dispatch_node_or_pnpm(self):
        prefix = self.owned / "native-prefix"
        prefix.mkdir()
        selected = prefix / "git"
        shutil.copy2(self.git, selected)
        marker = self.owned / "tool-dispatched"
        for tool in ("node", "pnpm"):
            trap = prefix / tool
            trap.write_text("#!/bin/sh\ntouch " + str(marker) + "\nexit 97\n")
            trap.chmod(0o700)
        self.run_consumer(env={"HCS_MANIFEST_GIT": str(selected)})
        self.assertFalse(marker.exists())

    def test_invalid_cli_is_value_blind(self):
        report = self.run_consumer("--unknown-HCS_PRIVATE_SENTINEL", code=2)
        self.assertEqual(report["findings"], [{"code": "ARGUMENTS"}])


class PreparationAndMappingTests(unittest.TestCase):
    def test_helper_refuses_non_ci_before_network_or_build(self):
        with patch.dict(os.environ, {"GITHUB_ACTIONS": "false"}, clear=True), \
                patch.object(prepare, "urlopen", side_effect=AssertionError("NETWORK")), \
                patch.object(prepare.subprocess, "Popen", side_effect=AssertionError("BUILD")):
            log = io.StringIO()
            with redirect_stdout(log):
                self.assertEqual(prepare.main([]), 2)
            report = json.loads(log.getvalue())
            self.assertEqual(report["stage"], "preflight")
            self.assertEqual(report["failure"], "CI_REQUIRED")
            self.assertEqual(report["python_expected"], "3.13.16")
            self.assertEqual(report["git_expected"], "2.56.0")

    def test_helper_checksum_failure_precedes_archive_or_build(self):
        with tempfile.TemporaryDirectory(prefix="hcs-git-prep-fixture-") as temp:
            owned = Path(temp).resolve()
            output = owned / "output"
            output.touch()
            response = io.BytesIO(b"wrong source checksum")
            response.url = prepare.URL
            with patch.object(prepare, "preflight", return_value=(owned, output)), \
                    patch.object(prepare, "urlopen", return_value=response), \
                    patch.object(prepare.tarfile, "open", side_effect=AssertionError("ARCHIVE")), \
                    patch.object(prepare.subprocess, "Popen", side_effect=AssertionError("BUILD")):
                state = {}
                with self.assertRaisesRegex(prepare.PreparationFailure, "^SOURCE_CHECKSUM$"):
                    prepare.prepare(state)
                self.assertEqual(state["stage"], "source-checksum")
            self.assertEqual(output.read_bytes(), b"")

    def test_helper_rejects_escaping_or_special_archive_members(self):
        for name, kind in (("../outside", tarfile.REGTYPE), ("/absolute", tarfile.REGTYPE),
                           ("git-2.56.0/device", tarfile.CHRTYPE)):
            stream = io.BytesIO()
            with tarfile.open(fileobj=stream, mode="w") as tar:
                info = tarfile.TarInfo(name)
                info.type = kind
                tar.addfile(info)
            stream.seek(0)
            with tarfile.open(fileobj=stream, mode="r:") as tar:
                with self.assertRaisesRegex(prepare.PreparationFailure, "^ARCHIVE_MEMBER$"):
                    prepare.source_members(tar)

    def test_helper_output_binding_refuses_unsafe_paths(self):
        with tempfile.TemporaryDirectory(prefix="hcs-output-fixture-") as temp, \
                tempfile.TemporaryDirectory(prefix="hcs-outside-fixture-") as other:
            owned, outside = Path(temp).resolve(), Path(other).resolve()
            original = owned / "original"
            original.touch()
            foreign = outside / "output"
            foreign.touch()
            symlink = owned / "symlink"
            symlink.symlink_to(original)
            hardlink = owned / "hardlink"
            hardlink.hardlink_to(original)
            newline = owned / "bad\noutput"
            newline.touch()
            for target in (foreign, symlink, hardlink, newline):
                with self.subTest(kind=target.name.replace("\n", "escaped")):
                    with self.assertRaises(prepare.PreparationFailure):
                        prepare.OutputBinding(owned, target)
            self.assertEqual(original.read_bytes(), b"")
            self.assertEqual(foreign.read_bytes(), b"")

    def test_helper_bound_output_replacement_is_refused(self):
        with tempfile.TemporaryDirectory(prefix="hcs-output-fixture-") as temp:
            owned = Path(temp).resolve()
            output = owned / "output"
            output.touch()
            binding = prepare.OutputBinding(owned, output)
            try:
                preserved = owned / "original"
                output.rename(preserved)
                output.write_bytes(b"replacement")
                with self.assertRaisesRegex(prepare.PreparationFailure, "^OUTPUT_CHANGED$"):
                    binding.publish(owned / "git")
                self.assertEqual(preserved.read_bytes(), b"")
                self.assertEqual(output.read_bytes(), b"replacement")
            finally:
                binding.close()

    def test_helper_tar_filter_refuses_escaping_symlink(self):
        with tempfile.TemporaryDirectory(prefix="hcs-tar-fixture-") as temp:
            owned = Path(temp).resolve()
            archive = owned / "git.tar.xz"
            with tarfile.open(archive, mode="w:xz") as tar:
                info = tarfile.TarInfo("git-2.56.0/link")
                info.type = tarfile.SYMTYPE
                info.linkname = "../../outside"
                tar.addfile(info)
            with self.assertRaises(tarfile.TarError):
                prepare.extract_source(archive, owned / "source")
            self.assertFalse((owned / "outside").exists())

    def test_helper_wrong_version_and_timeout_are_coded(self):
        with tempfile.TemporaryDirectory(prefix="hcs-build-fixture-") as temp:
            owned = Path(temp).resolve()
            git = owned / "prefix/bin/git"
            git.parent.mkdir(parents=True)
            git.write_bytes(b"synthetic; never executed")
            child = types.SimpleNamespace(wait=lambda **kwargs: 0)
            wrong = subprocess.CompletedProcess([], 0, b"git version 2.55.0\n", b"HCS_PRIVATE_SENTINEL")
            state = {}
            with patch.object(prepare.subprocess, "Popen", return_value=child), \
                    patch.object(prepare.subprocess, "run", return_value=wrong):
                with self.assertRaisesRegex(prepare.PreparationFailure, "^BUILT_GIT_VERSION$"):
                    prepare.build_git(owned, owned / "prefix", {}, state)
            self.assertEqual(state, {"stage": "built-version", "git_version": "2.55.0"})
            calls = []

            def wait(**kwargs):
                calls.append(kwargs)
                if kwargs:
                    raise subprocess.TimeoutExpired("HCS_PRIVATE_SENTINEL", 600)
                return -9

            child = types.SimpleNamespace(wait=wait, pid=12345)
            with patch.object(prepare.subprocess, "Popen", return_value=child), \
                    patch.object(prepare.os, "killpg") as kill:
                with self.assertRaisesRegex(prepare.PreparationFailure, "^BUILD_TIMEOUT$"):
                    prepare.build_git(owned, owned / "prefix", {}, {})
                kill.assert_called_once_with(12345, prepare.signal.SIGKILL)
            self.assertEqual(calls, [{"timeout": 600}, {}])

    def test_helper_failure_diagnostics_do_not_echo_context(self):
        state = {"stage": "built-version", "git_version": "unrecognized"}
        with patch.dict(os.environ, {"RUNNER_OS": "HCS_PRIVATE_SENTINEL",
                                     "RUNNER_ARCH": "HCS_PRIVATE_SENTINEL"}, clear=True):
            report = prepare.diagnostics(state, failure="BUILT_GIT_VERSION")
        self.assertNotIn("HCS_PRIVATE_SENTINEL", json.dumps(report))
        self.assertEqual(report["runner_os"], "unrecognized")
        self.assertEqual(report["runner_arch"], "unrecognized")

    def test_hcs_native_mapping_uses_existing_just_implementations(self):
        import tomllib
        tasks = tomllib.loads((ROOT / ".mise.toml").read_text())["tasks"]
        expected = {"setup": "just bootstrap", "verify": "just verify", "test": "just test",
                    "format-check": "just format-check", "format-write": "just format-fix"}
        self.assertEqual({key: tasks[key]["run"] for key in expected}, expected)
        self.assertEqual(tasks["bootstrap"]["run"], "npm install")
        # No declared setup, formatter write, service or bootstrap is executed.


if __name__ == "__main__":
    unittest.main(verbosity=2)
