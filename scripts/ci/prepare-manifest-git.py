#!/usr/bin/env -S python3 -I -S -B
"""Prepare pinned Git in an owned macOS CI prefix; never replace runner tools.

Adapted from the public-safe MIT Dicee scripts/prepare-manifest-git.py,
source 48ab6258979324d72b3bc04810ad2356eb962716, helper SHA-256
22864eed7eacbdccadcf71ae7006971b6f2441e0aebea10fe4007d77e7d55695.
Its upstream is public project-manifest scripts/prepare-linux-tools.py at
9797b48786f6da0e4e5167a25c2a873e6945269c; release LICENSE is vendored.
HCS binds its macOS runner/Python pin and system tools. Source trust is the
pinned official HTTPS SHA-256, not a tar-signature or qualification claim.
"""

import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import platform
import re
import signal
import stat
import subprocess
import sys
import tarfile
import tempfile
import time
from urllib.request import urlopen

URL = "https://www.kernel.org/pub/software/scm/git/git-2.56.0.tar.xz"
SHA256 = "26c56c296b38c0695b26fa95f475f1d01704d2d38e73465ca30b0b2f5dc789d3"
PYTHON_PIN = "3.13.16"


class PreparationFailure(ValueError):
    """Only fixed codes are serialized, never exception text or input values."""


def require(condition, code):
    if not condition:
        raise PreparationFailure(code)


def clean_path(path):
    return (path.is_absolute() and ".." not in path.parts
            and all(ord(c) >= 32 and ord(c) != 127 for c in str(path)))


def fingerprint(info):
    return (info.st_dev, info.st_ino, info.st_mode, info.st_nlink,
            info.st_size, info.st_mtime_ns, info.st_ctime_ns)


def runtime_preflight():
    require(os.environ.get("GITHUB_ACTIONS") == "true", "CI_REQUIRED")
    require(platform.system() == "Darwin" and os.environ.get("RUNNER_OS") == "macOS",
            "MACOS_REQUIRED")
    require((platform.machine(), os.environ.get("RUNNER_ARCH"))
            in (("arm64", "ARM64"), ("x86_64", "X64")), "ARCHITECTURE_MISMATCH")
    require(sys.version_info[:3] == (3, 13, 16), "PYTHON_PIN_MISMATCH")
    require(sys.flags.isolated and sys.flags.no_site and sys.dont_write_bytecode,
            "ISOLATED_RUNTIME_REQUIRED")


def preflight():
    runtime_preflight()
    parent = Path(os.environ["RUNNER_TEMP"])
    root = Path(__file__).resolve().parents[2]
    require(clean_path(parent) and parent.is_dir() and not parent.is_symlink()
            and root != parent.resolve() and root not in parent.resolve().parents,
            "TEMP_SCOPE")
    for name in ("/usr/bin/make", "/usr/bin/clang"):
        require(Path(name).is_file() and os.access(name, os.X_OK), "BUILD_TOOL_UNAVAILABLE")
    output = Path(os.environ["GITHUB_OUTPUT"])
    require(clean_path(output) and not output.is_symlink()
            and output.resolve().is_relative_to(parent.resolve()), "OUTPUT_SCOPE")
    info = output.stat()
    require(stat.S_ISREG(info.st_mode) and info.st_nlink == 1, "OUTPUT_FILE_TYPE")
    return parent, output


class OutputBinding:
    """Open under the runner-temp directory, retain FDs, and recheck before write."""

    def __init__(self, parent, output):
        self.fd = None
        self.parent_fd = None
        require(clean_path(parent) and clean_path(output), "OUTPUT_SCOPE")
        base = parent.resolve(strict=True)
        require(output.is_relative_to(base) and not output.is_symlink(), "OUTPUT_SCOPE")
        relative = output.relative_to(base)
        require(relative.parts, "OUTPUT_SCOPE")
        current = os.open("/", os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
        try:
            for part in base.parts[1:] + relative.parts[:-1]:
                before = os.stat(part, dir_fd=current, follow_symlinks=False)
                require(stat.S_ISDIR(before.st_mode), "OUTPUT_DIRECTORY")
                child = os.open(part, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW,
                                dir_fd=current)
                if fingerprint(before) != fingerprint(os.fstat(child)):
                    os.close(child)
                    raise PreparationFailure("OUTPUT_CHANGED")
                os.close(current)
                current = child
            self.name = relative.name
            fd = os.open(self.name, os.O_WRONLY | os.O_APPEND | os.O_NOFOLLOW | os.O_NONBLOCK,
                         dir_fd=current)
            try:
                info = os.fstat(fd)
                require(stat.S_ISREG(info.st_mode) and info.st_nlink == 1, "OUTPUT_FILE_TYPE")
                require(fingerprint(info) == fingerprint(os.stat(
                    self.name, dir_fd=current, follow_symlinks=False)), "OUTPUT_CHANGED")
            except BaseException:
                os.close(fd)
                raise
            self.identity = fingerprint(info)
            self.fd = fd
            self.parent_fd = current
            current = None
        finally:
            if current is not None:
                os.close(current)

    def publish(self, git):
        require(clean_path(git), "GIT_OUTPUT_PATH")
        require(self.identity == fingerprint(os.fstat(self.fd)) == fingerprint(os.stat(
            self.name, dir_fd=self.parent_fd, follow_symlinks=False)), "OUTPUT_CHANGED")
        data = ("git=" + str(git) + "\n").encode()
        require(os.write(self.fd, data) == len(data), "OUTPUT_WRITE")

    def close(self):
        if self.fd is not None:
            os.close(self.fd)
            self.fd = None
        if self.parent_fd is not None:
            os.close(self.parent_fd)
            self.parent_fd = None


def source_members(tar):
    members = tar.getmembers()
    require(len(members) <= 25000 and sum(m.size for m in members) <= 512 * 1024 * 1024,
            "ARCHIVE_BOUND")
    names = set()
    for member in members:
        parts = PurePosixPath(member.name).parts
        require(parts and parts[0] == "git-2.56.0" and ".." not in parts
                and not member.name.startswith("/") and "\\" not in member.name
                and (member.isfile() or member.isdir() or member.issym())
                and member.name not in names and member.size >= 0, "ARCHIVE_MEMBER")
        names.add(member.name)
    return members


def extract_source(archive, source):
    with tarfile.open(archive, "r:xz") as tar:
        tar.extractall(source, members=source_members(tar), filter="data")


def build_git(source, prefix, build_env, state):
    flags = ["NO_OPENSSL", "NO_CURL", "NO_EXPAT", "NO_GETTEXT", "NO_TCLTK",
             "NO_PERL", "NO_PYTHON", "NO_RUST"]
    argv = ["/usr/bin/make", "-j2", "CC=/usr/bin/clang", "prefix=" + str(prefix),
            *(flag + "=YesPlease" for flag in flags), "all", "install"]
    state["stage"] = "build"
    child = subprocess.Popen(argv, cwd=source / "git-2.56.0", env=build_env,
                             start_new_session=True)
    try:
        require(child.wait(timeout=600) == 0, "BUILD_FAILED")
    except subprocess.TimeoutExpired:
        try:
            os.killpg(child.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        child.wait()
        raise PreparationFailure("BUILD_TIMEOUT") from None
    state["stage"] = "built-version"
    git = prefix / "bin/git"
    require(not git.is_symlink() and git.is_file(), "BUILT_GIT_FILE")
    result = subprocess.run([str(git), "--version"], env=build_env,
                            capture_output=True, timeout=10, check=True)
    match = re.fullmatch(rb"git version ([0-9]{1,4}\.[0-9]{1,4}\.[0-9]{1,4})\n", result.stdout)
    state["git_version"] = match[1].decode("ascii") if match else "unrecognized"
    require(result.stdout == b"git version 2.56.0\n", "BUILT_GIT_VERSION")
    require(git.stat().st_size <= 64 * 1024 * 1024, "BUILT_GIT_BOUND")
    return git


def prepare(state):
    state["stage"] = "preflight"
    parent, output_path = preflight()
    state["stage"] = "output-binding"
    output = OutputBinding(parent, output_path)
    try:
        state["stage"] = "owned-prefix"
        owned = Path(tempfile.mkdtemp(prefix="hcs-manifest-git-", dir=parent))
        archive = owned / "git.tar.xz"
        digest, count, deadline = hashlib.sha256(), 0, time.monotonic() + 60
        state["stage"] = "download"
        with urlopen(URL, timeout=30) as response, archive.open("xb") as downloaded:
            require(response.url.startswith("https://"), "DOWNLOAD_HTTPS")
            while chunk := response.read(65536):
                count += len(chunk)
                require(count <= 64 * 1024 * 1024, "DOWNLOAD_BOUND")
                require(time.monotonic() <= deadline, "DOWNLOAD_TIMEOUT")
                digest.update(chunk)
                downloaded.write(chunk)
        state["stage"] = "source-checksum"
        require(digest.hexdigest() == SHA256, "SOURCE_CHECKSUM")
        source = owned / "source"
        state["stage"] = "archive"
        extract_source(archive, source)
        prefix = owned / "prefix"
        home = owned / "home"
        home.mkdir()
        # This build-child environment does not change the caller's PATH.
        build_env = {"PATH": "/usr/bin:/bin:/usr/sbin:/sbin", "HOME": str(home), "LC_ALL": "C"}
        git = build_git(source, prefix, build_env, state)
        state["stage"] = "publish-output"
        output.publish(git)
        return hashlib.sha256(git.read_bytes()).hexdigest()
    finally:
        output.close()


def diagnostics(state, failure=None, binary_sha256=None):
    runner_os = os.environ.get("RUNNER_OS")
    runner_arch = os.environ.get("RUNNER_ARCH")
    return {
        "scope": "hcs-manifest-git-preparation", "stage": state["stage"],
        "exit_code": 2 if failure else 0, "failure": failure,
        "python_expected": PYTHON_PIN,
        "python_observed": ".".join(str(v) for v in sys.version_info[:3]),
        "runner_os": runner_os if runner_os in ("macOS", "Linux", "Windows") else "unrecognized",
        "runner_arch": runner_arch if runner_arch in ("ARM64", "X64", "X86") else "unrecognized",
        "git_expected": "2.56.0", "git_observed": state.get("git_version"),
        "source_sha256": SHA256, "binary_sha256": binary_sha256,
        "trust": "official-HTTPS-published-SHA256; tar-signature-not-verified",
    }


def main(argv=None):
    state = {"stage": "arguments", "git_version": None}
    binary = None
    try:
        args = sys.argv[1:] if argv is None else argv
        require(args in ([], ["--check-runtime"]), "ARGUMENTS")
        if args:
            state["stage"] = "runtime-binding"
            runtime_preflight()
            expected = Path(os.environ["HCS_MANIFEST_EXPECTED_PYTHON"])
            require(clean_path(expected) and expected.resolve(strict=True) ==
                    Path(sys.executable).resolve(strict=True), "PYTHON_SELECTION")
            state["stage"] = "runtime-bound"
        else:
            binary = prepare(state)
            state["stage"] = "complete"
        report = diagnostics(state, binary_sha256=binary)
    except PreparationFailure as error:
        report = diagnostics(state, failure=str(error))
    except KeyError:
        report = diagnostics(state, failure="REQUIRED_CONTEXT_MISSING")
    except tarfile.TarError:
        report = diagnostics(state, failure="ARCHIVE_UNAVAILABLE")
    except subprocess.TimeoutExpired:
        report = diagnostics(state, failure="CHILD_TIMEOUT")
    except subprocess.SubprocessError:
        report = diagnostics(state, failure="CHILD_UNAVAILABLE")
    except (OSError, ValueError):
        report = diagnostics(state, failure="OS_OR_VALUE_UNAVAILABLE")
    print(json.dumps(report, sort_keys=True))
    return report["exit_code"]


if __name__ == "__main__":
    raise SystemExit(main())
