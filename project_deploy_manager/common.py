#!/usr/bin/env python3
"""
Shared helpers for project_deploy_manager scripts: SSH connect, run_remote, run_local, logging.
"""

import argparse
import logging
import os
import subprocess
import sys
import time
from typing import Optional, Tuple

try:
    import paramiko
except ImportError:
    paramiko = None  # type: ignore

logger = logging.getLogger(__name__)


def configure_logging(verbose: bool, debug: bool, stream: Optional[object] = None) -> None:
    """Configure logging level and format. Default stream is stderr."""
    level = logging.WARNING
    if debug:
        level = logging.DEBUG
    elif verbose:
        level = logging.INFO
    fmt = "%(levelname)s: %(message)s"
    if debug:
        fmt = "%(levelname)s %(name)s: %(message)s"
    logging.basicConfig(
        level=level,
        format=fmt,
        stream=stream or sys.stderr,
    )
    if debug and paramiko:
        logging.getLogger("paramiko").setLevel(logging.DEBUG)


def run_local(
    command: str,
    timeout_sec: int = 60,
    log: Optional[logging.Logger] = None,
    shell: bool = True,
) -> Tuple[int, str, str]:
    """Run a command locally; return (exit_code, stdout, stderr)."""
    log = log or logger
    try:
        result = subprocess.run(
            command if shell else command.split(),
            shell=shell,
            capture_output=True,
            timeout=timeout_sec,
            text=True,
        )
        out = result.stdout or ""
        err = result.stderr or ""
        if out and log.isEnabledFor(logging.DEBUG):
            log.debug("stdout: %s", out.strip())
        if err and log.isEnabledFor(logging.DEBUG):
            log.debug("stderr: %s", err.strip())
        return result.returncode, out, err
    except subprocess.TimeoutExpired:
        log.warning("Command timed out after %s s", timeout_sec)
        return -1, "", "timeout"
    except Exception as e:
        log.warning("run_local failed: %s", e)
        return -1, "", str(e)


def ssh_connect(
    host: str,
    username: str,
    password: str,
    port: int = 22,
    timeout: float = 10.0,
    log: Optional[logging.Logger] = None,
):
    """Connect via SSH; return paramiko.SSHClient. Raises on failure."""
    if paramiko is None:
        raise RuntimeError("paramiko not installed; pip install paramiko")
    log = log or logger
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        hostname=host,
        port=port,
        username=username,
        password=password,
        timeout=timeout,
        allow_agent=False,
        look_for_keys=False,
    )
    return client


def run_remote(
    client,
    command: str,
    timeout_sec: int = 60,
    log: Optional[logging.Logger] = None,
) -> Tuple[int, str, str]:
    """Run a command on the remote host; return (exit_code, stdout, stderr)."""
    log = log or logger
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout_sec)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    exit_code = stdout.channel.recv_exit_status()
    if out and log.isEnabledFor(logging.DEBUG):
        log.debug("stdout: %s", out.strip())
    if err and log.isEnabledFor(logging.DEBUG):
        log.debug("stderr: %s", err.strip())
    return exit_code, out, err


def run_remote_stream(
    client,
    command: str,
    timeout_sec: int = 60,
    log: Optional[logging.Logger] = None,
) -> Tuple[int, str, str]:
    """Run a command on the remote host and stream stdout/stderr to the console. Return (exit_code, stdout, stderr)."""
    if paramiko is None:
        return run_remote(client, command, timeout_sec=timeout_sec, log=log)
    log = log or logger
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout_sec)
    chan = stdout.channel
    chan.settimeout(1.0)
    out_buf = b""
    err_buf = b""
    out_lines = []
    err_lines = []

    def flush_stdout() -> None:
        nonlocal out_buf
        while b"\n" in out_buf:
            line, out_buf = out_buf.split(b"\n", 1)
            decoded = line.decode("utf-8", errors="replace").strip()
            if decoded:
                print(decoded, file=sys.stderr)
                out_lines.append(decoded)

    def flush_stderr() -> None:
        nonlocal err_buf
        while b"\n" in err_buf:
            line, err_buf = err_buf.split(b"\n", 1)
            decoded = line.decode("utf-8", errors="replace").strip()
            if decoded:
                print(decoded, file=sys.stderr)
                err_lines.append(decoded)

    while not chan.exit_status_ready():
        if chan.recv_ready():
            out_buf += chan.recv(4096)
            flush_stdout()
        if chan.recv_stderr_ready():
            err_buf += chan.recv_stderr(4096)
            flush_stderr()
        if not chan.recv_ready() and not chan.recv_stderr_ready():
            time.sleep(0.05)

    while chan.recv_ready():
        out_buf += chan.recv(4096)
        flush_stdout()
    while chan.recv_stderr_ready():
        err_buf += chan.recv_stderr(4096)
        flush_stderr()
    if out_buf:
        decoded = out_buf.decode("utf-8", errors="replace").strip()
        if decoded:
            print(decoded, file=sys.stderr)
            out_lines.append(decoded)
    if err_buf:
        decoded = err_buf.decode("utf-8", errors="replace").strip()
        if decoded:
            print(decoded, file=sys.stderr)
            err_lines.append(decoded)

    exit_code = chan.recv_exit_status()
    return exit_code, "\n".join(out_lines), "\n".join(err_lines)


def add_remote_ssh_args(parser: argparse.ArgumentParser) -> None:
    """Add standard SSH args: host, username, password (optional), -p port, -t timeout."""
    parser.add_argument("host", help="Remote hostname or IP address")
    parser.add_argument("username", help="SSH username")
    parser.add_argument(
        "password",
        nargs="?",
        default=None,
        help="SSH password (or set SSH_PASSWORD env var)",
    )
    parser.add_argument("-p", "--port", type=int, default=22, help="SSH port (default: 22)")
    parser.add_argument(
        "-t",
        "--timeout",
        type=float,
        default=10.0,
        help="SSH connection timeout in seconds (default: 10)",
    )


def add_common_args(parser: argparse.ArgumentParser) -> None:
    """Add -v/--verbose and -d/--debug."""
    parser.add_argument("-v", "--verbose", action="store_true", help="Log progress (INFO)")
    parser.add_argument("-d", "--debug", action="store_true", help="Enable debug logs")


def get_password(args: argparse.Namespace) -> Optional[str]:
    """Return password from args or SSH_PASSWORD env."""
    return getattr(args, "password", None) or os.environ.get("SSH_PASSWORD")


def _install_certbot_nginx_plugin_local(log: logging.Logger) -> bool:
    """Install certbot nginx plugin; try dnf then apt. Return True if installed or already present."""
    code, _, _ = run_local("sudo dnf install -y python3-certbot-nginx", timeout_sec=120, log=log)
    if code == 0:
        return True
    code, _, _ = run_local(
        "sudo apt-get update && sudo apt-get install -y python3-certbot-nginx",
        timeout_sec=180,
        log=log,
    )
    return code == 0


def ensure_certbot_local(log: Optional[logging.Logger] = None) -> bool:
    """Check if certbot is installed locally; install via dnf or apt if not. Ensure nginx plugin. Return True if available."""
    log = log or logger
    code, _, _ = run_local("command -v certbot", log=log)
    if code != 0:
        log.info("certbot not found, attempting install...")
        code, out, err = run_local(
            "sudo dnf install -y certbot python3-certbot-nginx", timeout_sec=120, log=log
        )
        if code == 0:
            log.info("certbot installed via dnf")
            return True
        code, out, err = run_local(
            "sudo apt-get update && sudo apt-get install -y certbot python3-certbot-nginx",
            timeout_sec=180,
            log=log,
        )
        if code == 0:
            log.info("certbot installed via apt")
            return True
        log.error("failed to install certbot: %s", err or out)
        return False
    log.info("certbot already installed")
    _install_certbot_nginx_plugin_local(log)
    return True


def _install_certbot_nginx_plugin_remote(client, log: logging.Logger) -> bool:
    """Install certbot nginx plugin on remote; try dnf then apt. Return True if installed or already present."""
    code, _, _ = run_remote(
        client, "sudo dnf install -y python3-certbot-nginx", timeout_sec=120, log=log
    )
    if code == 0:
        return True
    code, _, _ = run_remote(
        client,
        "sudo apt-get update && sudo apt-get install -y python3-certbot-nginx",
        timeout_sec=180,
        log=log,
    )
    return code == 0


def ensure_certbot_remote(client, log: Optional[logging.Logger] = None) -> bool:
    """Check if certbot is installed on remote host; install via dnf or apt if not. Ensure nginx plugin. Return True if available."""
    log = log or logger
    code, _, _ = run_remote(client, "command -v certbot", timeout_sec=10, log=log)
    if code != 0:
        log.info("certbot not found on remote, attempting install...")
        code, out, err = run_remote(
            client,
            "sudo dnf install -y certbot python3-certbot-nginx",
            timeout_sec=120,
            log=log,
        )
        if code == 0:
            log.info("certbot installed on remote via dnf")
            return True
        code, out, err = run_remote(
            client,
            "sudo apt-get update && sudo apt-get install -y certbot python3-certbot-nginx",
            timeout_sec=180,
            log=log,
        )
        if code == 0:
            log.info("certbot installed on remote via apt")
            return True
        log.error("failed to install certbot on remote: %s", err or out)
        return False
    log.info("certbot already installed on remote host")
    _install_certbot_nginx_plugin_remote(client, log)
    return True
