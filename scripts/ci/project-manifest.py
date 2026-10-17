#!/usr/bin/env -S python3 -I -S -B
"""HCS consumer of the approved, byte-bound Project Manifest Release 1.

No role execution, repository writes, network, installed-package fallback, or
HCS runtime/admission verdict. See the HCS project-manifest adoption document.
"""

import argparse
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import importlib.abc
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import stat
import sys
import types


BOOTSTRAP_SHA256 = "2ccf58e0da97bbbd9dae173d1cca047d465c4a2d950ee6e56052309a9689cf4f"
TABLE_DIGEST = "f7ff9dd0972af5d3a6a3348c3e092de1a6acd97fa3975e13e522cf80ce5e7df2"
SOURCE_REVISION = "56e3920089726e585eaa0fd7f4dc94e6938a1e0c"
RELEASE_FORMAT = "project-manifest-release-1"
PACKAGE = "_hcs_project_manifest_release1"
MODULES = ("__init__", "__main__", "candidate", "validation", "acquire", "cli")
OID = re.compile(r"(?:[0-9a-f]{40}|[0-9a-f]{64})")
NATIVE_MAGIC = frozenset((
    b"\x7fELF", b"\xfe\xed\xfa\xce", b"\xce\xfa\xed\xfe",
    b"\xfe\xed\xfa\xcf", b"\xcf\xfa\xed\xfe", b"\xca\xfe\xba\xbe",
    b"\xbe\xba\xfe\xca", b"\xca\xfe\xba\xbf", b"\xbf\xba\xfe\xca",
))


class Refusal(Exception):
    """Only fixed, consumer-authored codes cross the diagnostic boundary."""


@dataclass(frozen=True)
class CapturedCode:
    data: bytes
    size: int
    sha256: str


def require(condition, code):
    if not condition:
        raise Refusal(code)


def fingerprint(info):
    return (info.st_dev, info.st_ino, info.st_mode, info.st_nlink,
            info.st_size, info.st_mtime_ns, info.st_ctime_ns)


def read_bound(path, maximum):
    """Bounded bytes from one stable regular file, no followed path component."""
    path = Path(path)
    require(path.is_absolute() and ".." not in path.parts, "BYTE_PATH")
    current = os.open("/", os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        for part in path.parts[1:-1]:
            before = os.stat(part, dir_fd=current, follow_symlinks=False)
            require(stat.S_ISDIR(before.st_mode), "BYTE_DIRECTORY")
            child = os.open(part, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW,
                            dir_fd=current)
            if fingerprint(os.fstat(child)) != fingerprint(before):
                os.close(child)
                raise Refusal("BYTE_CHANGED")
            os.close(current)
            current = child
        file_fd = os.open(path.name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK,
                          dir_fd=current)
        try:
            before = os.fstat(file_fd)
            require(stat.S_ISREG(before.st_mode) and before.st_nlink == 1,
                    "BYTE_FILE_TYPE")
            require(0 <= before.st_size <= maximum, "BYTE_BOUND")
            chunks, size = [], 0
            while True:
                chunk = os.read(file_fd, min(65536, maximum + 1 - size))
                if not chunk:
                    break
                size += len(chunk)
                require(size <= maximum, "BYTE_BOUND")
                chunks.append(chunk)
            require(fingerprint(before) == fingerprint(os.fstat(file_fd)) ==
                    fingerprint(os.stat(path.name, dir_fd=current, follow_symlinks=False))
                    and size == before.st_size, "BYTE_CHANGED")
            return b"".join(chunks)
        finally:
            os.close(file_fd)
    finally:
        os.close(current)


def approved_payload(vendor):
    """Authenticate bootstrap before execution, then capture authenticated code."""
    data = read_bound(vendor / "bootstrap.py", 65536)
    require(hashlib.sha256(data).hexdigest() == BOOTSTRAP_SHA256, "BOOTSTRAP_DIGEST")
    name = "_hcs_project_manifest_bootstrap1"
    require(name not in sys.modules, "IMPORT_NAMESPACE")
    bootstrap = types.ModuleType(name)
    bootstrap.__file__ = "<authenticated-project-manifest-bootstrap>"
    sys.modules[name] = bootstrap
    try:
        exec(compile(data, bootstrap.__file__, "exec"), bootstrap.__dict__)
        root = vendor / "release-1"
        verified = bootstrap.verify_release(root, expected_digest=TABLE_DIGEST,
                                            expected_format=RELEASE_FORMAT)
        require(verified.exit_code == 0, "RELEASE_BINDING")
        descriptor = verified.descriptor
        require(descriptor["source_revision"] == SOURCE_REVISION
                and descriptor["origin"] == "jefahnierocks/project-manifest"
                and descriptor["release_id"] == "1"
                and descriptor["spec_version"] == "1"
                and descriptor["format"] == RELEASE_FORMAT
                and descriptor["observation_protocol"] == "project-manifest-git-observation-1",
                "RELEASE_IDENTITY")
        rows = {row["path"]: row for row in descriptor["files"]}
        captured = {}
        for module in MODULES:
            path = "src/project_manifest/" + module + ".py"
            row = rows[path]
            code = read_bound(root / path, 1048576)
            require(len(code) == row["bytes"] and
                    hashlib.sha256(code).hexdigest() == row["sha256"],
                    "CAPTURE_DIGEST")
            captured[module] = CapturedCode(code, row["bytes"], row["sha256"])
        # A closed namespace must still verify after the code capture.
        rebound = bootstrap.verify_release(root, expected_digest=TABLE_DIGEST,
                                           expected_format=RELEASE_FORMAT)
        require(rebound.exit_code == 0 and rebound.descriptor == descriptor,
                "RELEASE_CHANGED")
        return captured, verified.diagnostics()
    finally:
        sys.modules.pop(name, None)


class CapturedModules(importlib.abc.MetaPathFinder, importlib.abc.Loader):
    """The private package namespace has no filesystem or installed fallback."""

    def __init__(self, captured):
        self.captured = dict(captured)

    def find_spec(self, fullname, path=None, target=None):
        if fullname == PACKAGE:
            return importlib.util.spec_from_loader(fullname, self, is_package=True)
        if fullname.startswith(PACKAGE + "."):
            module = fullname[len(PACKAGE) + 1:]
            if module not in self.captured or module == "__init__":
                raise ModuleNotFoundError("CAPTURE_NAMESPACE")
            return importlib.util.spec_from_loader(fullname, self, is_package=False)
        return None

    def create_module(self, spec):
        return None

    def exec_module(self, module):
        key = "__init__" if module.__name__ == PACKAGE else module.__name__[len(PACKAGE) + 1:]
        captured = self.captured[key]
        require(type(captured) is CapturedCode and type(captured.data) is bytes
                and len(captured.data) == captured.size
                and hashlib.sha256(captured.data).hexdigest() == captured.sha256,
                "CAPTURE_DIGEST")
        module.__file__ = "<authenticated-project-manifest:" + key + ">"
        exec(compile(captured.data, module.__file__, "exec"), module.__dict__)


@contextmanager
def released_api(captured):
    require(set(captured) == set(MODULES), "CAPTURE_NAMESPACE")
    require(not any(name == PACKAGE or name.startswith(PACKAGE + ".")
                    for name in sys.modules), "IMPORT_NAMESPACE")
    loader = CapturedModules(captured)
    sys.meta_path.insert(0, loader)
    try:
        yield __import__(PACKAGE + ".acquire", fromlist=["observe_released_repository"])
    finally:
        sys.meta_path.remove(loader)
        for name in tuple(sys.modules):
            if name == PACKAGE or name.startswith(PACKAGE + "."):
                sys.modules.pop(name, None)


def native_git(selection):
    selected = selection if selection is not None else shutil.which("git")
    require(type(selected) is str and Path(selected).is_absolute(), "GIT_SELECTION")
    selected = Path(selected).resolve(strict=True)
    require(selected.name == "git" and os.access(selected, os.X_OK), "GIT_SELECTION")
    # Read only the header; read_bound intentionally limits whole *payload* files.
    fd = os.open(selected, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    try:
        info = os.fstat(fd)
        require(stat.S_ISREG(info.st_mode), "GIT_FILE_TYPE")
        require(os.read(fd, 4) in NATIVE_MAGIC, "GIT_NATIVE_REQUIRED")
        require(fingerprint(info) == fingerprint(os.fstat(fd)) ==
                fingerprint(os.stat(selected, follow_symlinks=False)), "GIT_CHANGED")
    finally:
        os.close(fd)
    return selected


@contextmanager
def git_selection(selected):
    # The released API selects Git through PATH. Confine this prefix to this
    # standalone acquisition; no project roles or other tools are dispatched.
    original = os.environ.get("PATH")
    os.environ["PATH"] = str(selected.parent) + (os.pathsep + original if original else "")
    try:
        require(Path(shutil.which("git") or "").resolve() == selected, "GIT_SELECTION")
        yield
    finally:
        if original is None:
            os.environ.pop("PATH", None)
        else:
            os.environ["PATH"] = original


class Parser(argparse.ArgumentParser):
    def error(self, message):
        raise Refusal("ARGUMENTS")


def parser():
    result = Parser(description=__doc__)
    result.add_argument("--root", default=str(Path(__file__).resolve().parents[2]))
    result.add_argument("--mode", choices=("worktree", "rev"))
    result.add_argument("--revision")
    result.add_argument("--common-dir")
    result.add_argument("--reference-date")
    result.add_argument("--status", action="store_true")
    return result


def source_selection(args):
    ci = os.environ.get("GITHUB_ACTIONS") == "true"
    if ci:
        revision = os.environ.get("GITHUB_SHA", "")
        require(OID.fullmatch(revision) is not None, "CI_REVISION")
        require(args.mode in (None, "rev") and args.revision in (None, revision),
                "CI_REVISION")
        return "rev", revision
    mode = args.mode or "worktree"
    require((mode == "rev" and type(args.revision) is str and
             OID.fullmatch(args.revision) is not None) or
            (mode == "worktree" and args.revision is None), "SOURCE_SELECTION")
    return mode, args.revision


def evaluate(args):
    report = {
        "scope": "hcs-project-manifest-declaration-1", "exit_code": 2,
        "declaration_validity": "not_checked", "findings": [],
        "release_approval": "HCS-owner-approved-release-1",
        "source_revision": SOURCE_REVISION, "table_digest": TABLE_DIGEST,
        "byte_binding": None, "observation": None,
        "runtime_acceptance": "not_checked", "producer_admission": "not_checked",
    }
    if args.status:
        report["status_projection"] = None
    try:
        mode, revision = source_selection(args)
        day = args.reference_date or datetime.now(timezone.utc).date().isoformat()
        vendor = Path(__file__).resolve().parents[2] / "vendor/project-manifest"
        captured, report["byte_binding"] = approved_payload(vendor)
        selected = native_git(os.environ.get("HCS_MANIFEST_GIT"))
        with released_api(captured) as api, git_selection(selected):
            observed = api.observe_released_repository(
                args.root, mode=mode, reference_date=day, rev=revision,
                common_dir=args.common_dir or os.environ.get("HCS_MANIFEST_COMMON_DIR"))
        report["exit_code"] = observed.exit_code
        report["declaration_validity"] = ("valid", "invalid", "not_checked")[observed.exit_code]
        report["observation"] = observed.diagnostics
        if args.status and observed.exit_code == 0:
            report["status_projection"] = {
                "project_id": observed.record["project"]["id"],
                "authority": observed.record["authority"]["status_of_record"],
                "status": observed.record["status"],
                "scope": "declared-status-from-one-observation",
            }
    except Refusal as error:
        report.update(exit_code=2, declaration_validity="not_checked", observation=None)
        if args.status:
            report["status_projection"] = None
        report["findings"] = [{"code": str(error)}]
    except Exception:
        report.update(exit_code=2, declaration_validity="not_checked", observation=None)
        if args.status:
            report["status_projection"] = None
        report["findings"] = [{"code": "CONSUMER_UNAVAILABLE"}]
    return report


def main(argv=None):
    try:
        require(sys.version_info >= (3, 11) and os.name == "posix" and
                sys.flags.isolated and sys.flags.no_site and sys.dont_write_bytecode,
                "ISOLATED_RUNTIME_REQUIRED")
        args = parser().parse_args(argv)
    except Refusal as error:
        print(json.dumps({"scope": "hcs-project-manifest-declaration-1", "exit_code": 2,
                          "declaration_validity": "not_checked",
                          "findings": [{"code": str(error)}]}, sort_keys=True))
        return 2
    report = evaluate(args)
    print(json.dumps(report, sort_keys=True))
    return report["exit_code"]


if __name__ == "__main__":
    raise SystemExit(main())
