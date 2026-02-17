#!/usr/bin/env python3
"""
Connect via SSH to a remote machine and install Docker using the official
get.docker.com script. Skips install if Docker is already present.
Requires root or sudo without password on the remote host.
"""

import argparse
import logging
import os
import sys
import time
from typing import Optional, Tuple

try:
    import paramiko
except ImportError:
    sys.exit(
        "Missing dependency: install with pip install paramiko (see requirements.txt)"
    )


logger = logging.getLogger(__name__)

# Timeouts (seconds)
CURL_TIMEOUT = 90
INSTALL_SCRIPT_TIMEOUT = 600
SERVICES_TIMEOUT = 60
DNF_INSTALL_TIMEOUT = 300

# RHEL-like IDs (AlmaLinux, Rocky, RHEL, CentOS, Fedora) use Docker CE repo
RHEL_LIKE_IDS = ("rhel", "centos", "rocky", "almalinux", "fedora")


def _run_remote(
    client: paramiko.SSHClient,
    command: str,
    timeout_sec: int = 60,
    log: Optional[logging.Logger] = None,
    stream: bool = False,
) -> Tuple[int, str, str]:
    """Run a command on the remote host; return (exit_code, stdout, stderr).
    When stream=True and log is at INFO or DEBUG, log each line of output as it arrives.
    """
    log = log or logger
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout_sec)
    chan = stdout.channel

    if stream and log.isEnabledFor(logging.INFO):
        # Stream output and log each line as it arrives
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
                    log.info("  %s", decoded)
                out_lines.append(decoded)

        def flush_stderr() -> None:
            nonlocal err_buf
            while b"\n" in err_buf:
                line, err_buf = err_buf.split(b"\n", 1)
                decoded = line.decode("utf-8", errors="replace").strip()
                if decoded:
                    log.info("  %s", decoded)
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

        # Read any remaining data
        while chan.recv_ready():
            out_buf += chan.recv(4096)
            flush_stdout()
        while chan.recv_stderr_ready():
            err_buf += chan.recv_stderr(4096)
            flush_stderr()
        if out_buf:
            decoded = out_buf.decode("utf-8", errors="replace").strip()
            if decoded:
                log.info("  %s", decoded)
            out_lines.append(decoded)
        if err_buf:
            decoded = err_buf.decode("utf-8", errors="replace").strip()
            if decoded:
                log.info("  %s", decoded)
            err_lines.append(decoded)

        exit_code = chan.recv_exit_status()
        out = "\n".join(out_lines)
        err = "\n".join(err_lines)
        return exit_code, out, err

    chan.settimeout(timeout_sec)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    exit_code = chan.recv_exit_status()
    if out and log.isEnabledFor(logging.DEBUG):
        log.debug("stdout: %s", out.strip())
    if err and log.isEnabledFor(logging.DEBUG):
        log.debug("stderr: %s", err.strip())
    return exit_code, out, err


def _detect_remote_os(
    client: paramiko.SSHClient,
    log: Optional[logging.Logger] = None,
) -> Optional[str]:
    """Detect OS from /etc/os-release; return 'rhel', 'debian', or None."""
    log = log or logger
    code, out, _ = _run_remote(
        client,
        "cat /etc/os-release 2>/dev/null || true",
        timeout_sec=10,
        log=log,
    )
    if code != 0 or not out.strip():
        return None
    os_id = None
    id_like = ""
    for line in out.strip().splitlines():
        line = line.strip()
        if line.startswith("ID="):
            os_id = line.split("=", 1)[1].strip().strip('"').lower()
        elif line.startswith("ID_LIKE="):
            id_like = line.split("=", 1)[1].strip().strip('"').lower()
    if os_id and os_id in RHEL_LIKE_IDS:
        return "rhel"
    if id_like and ("rhel" in id_like or "fedora" in id_like):
        return "rhel"
    if os_id in ("debian", "ubuntu") or (id_like and "debian" in id_like):
        return "debian"
    return None


def _install_docker_rhel(
    client: paramiko.SSHClient,
    sudo: str,
    log: Optional[logging.Logger] = None,
) -> bool:
    """Install Docker on RHEL/AlmaLinux/Rocky/CentOS using Docker CE repo."""
    log = log or logger
    log.info("Using Docker CE repo for RHEL-based system...")

    # dnf-plugins-core provides config-manager
    code, out, err = _run_remote(
        client,
        f"{sudo}dnf install -y dnf-plugins-core",
        timeout_sec=DNF_INSTALL_TIMEOUT,
        log=log,
        stream=log.isEnabledFor(logging.INFO),
    )
    if code != 0:
        log.error("dnf install dnf-plugins-core failed: exit %s", code)
        if err.strip() or out.strip():
            log.error("%s", (err + out).strip())
        return False

    code, out, err = _run_remote(
        client,
        f"{sudo}dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo",
        timeout_sec=30,
        log=log,
        stream=log.isEnabledFor(logging.INFO),
    )
    if code != 0:
        log.error("dnf config-manager add-repo failed: exit %s", code)
        if err.strip() or out.strip():
            log.error("%s", (err + out).strip())
        return False

    code, out, err = _run_remote(
        client,
        f"{sudo}dnf install -y docker-ce docker-ce-cli containerd.io",
        timeout_sec=DNF_INSTALL_TIMEOUT,
        log=log,
        stream=log.isEnabledFor(logging.INFO),
    )
    if code != 0:
        log.error("dnf install docker-ce failed: exit %s", code)
        if err.strip() or out.strip():
            log.error("%s", (err + out).strip())
        return False

    code, out, err = _run_remote(
        client,
        f"{sudo}systemctl start docker && {sudo}systemctl enable docker",
        timeout_sec=SERVICES_TIMEOUT,
        log=log,
        stream=log.isEnabledFor(logging.INFO),
    )
    if code != 0:
        log.warning("systemctl start/enable docker: %s", err.strip() or out.strip())

    return True


def install_remote_docker(
    host: str,
    username: str,
    password: str,
    port: int = 22,
    timeout: float = 10.0,
    log: Optional[logging.Logger] = None,
) -> bool:
    """
    Connect via SSH and install Docker on the remote host using get.docker.com.
    Does nothing if Docker is already installed. Starts and enables the Docker
    service. Requires root or sudo without password on the remote host.

    Returns True on success (installed or already present), False on failure.
    """
    log = log or logger
    client = None

    log.info(
        "Connecting to %s@%s:%s (timeout=%.1fs)",
        username,
        host,
        port,
        timeout,
    )

    try:
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
        log.debug("SSH connected")

        # Check if Docker already installed
        code, out, err = _run_remote(client, "command -v docker", timeout_sec=10, log=log)
        if code == 0:
            log.info("Docker is already installed on remote host")
            ver_code, ver_out, _ = _run_remote(client, "docker --version 2>/dev/null", timeout_sec=10, log=log)
            if ver_code == 0 and ver_out.strip():
                log.info("  %s", ver_out.strip())
            return True

        # Check if we're root (id -u == 0)
        code, id_out, _ = _run_remote(client, "id -u", timeout_sec=10, log=log)
        is_root = code == 0 and id_out.strip() == "0"
        sudo = "" if is_root else "sudo "

        # Detect OS: AlmaLinux/Rocky/RHEL/CentOS use Docker CE repo (get.docker.com doesn't support them all)
        os_type = _detect_remote_os(client, log=log)
        if os_type == "rhel":
            if not _install_docker_rhel(client, sudo, log=log):
                return False
        else:
            # Use get.docker.com for Debian/Ubuntu and others
            log.info("Downloading Docker install script...")
            code, out, err = _run_remote(
                client,
                "curl -fsSL https://get.docker.com -o /tmp/get-docker.sh",
                timeout_sec=CURL_TIMEOUT,
                log=log,
            )
            if code != 0:
                log.error("Failed to download get.docker.com: exit %s", code)
                if err.strip():
                    log.error("%s", err.strip())
                return False

            log.info("Running Docker install script (this may take several minutes)...")
            code, out, err = _run_remote(
                client,
                f"{sudo}sh /tmp/get-docker.sh",
                timeout_sec=INSTALL_SCRIPT_TIMEOUT,
                log=log,
                stream=log.isEnabledFor(logging.INFO),
            )
            if code != 0:
                log.error("Docker install script failed: exit %s", code)
                if out.strip():
                    for line in out.strip().splitlines():
                        log.error("  %s", line)
                if err.strip():
                    for line in err.strip().splitlines():
                        log.error("  %s", line)
                return False

            if out.strip() and log.isEnabledFor(logging.INFO):
                for line in out.strip().splitlines():
                    if line.strip():
                        log.info("  %s", line)

            log.info("Starting and enabling Docker service...")
            code, out, err = _run_remote(
                client,
                f"{sudo}systemctl start docker && {sudo}systemctl enable docker",
                timeout_sec=SERVICES_TIMEOUT,
                log=log,
                stream=log.isEnabledFor(logging.INFO),
            )
            if code != 0:
                log.warning("systemctl start/enable docker failed: %s", err.strip() or out.strip())

        # Verify
        code, ver_out, _ = _run_remote(client, "docker --version 2>/dev/null", timeout_sec=10, log=log)
        if code == 0 and ver_out.strip():
            log.info("Docker installed successfully: %s", ver_out.strip())
        else:
            log.warning("Docker install completed but 'docker --version' failed")

        return True

    except Exception as e:  # noqa: BLE001
        log.warning(
            "SSH or install failed: %s: %s",
            type(e).__name__,
            e,
            exc_info=log.isEnabledFor(logging.DEBUG),
        )
        return False
    finally:
        if client is not None:
            try:
                client.close()
            except Exception as e:  # noqa: BLE001
                log.debug("Error closing SSH client: %s", e)


def _configure_logging(verbose: bool, debug: bool) -> None:
    """Configure logging level and format for troubleshooting."""
    level = logging.WARNING
    if debug:
        level = logging.DEBUG
    elif verbose:
        level = logging.INFO

    fmt = "%(levelname)s: %(message)s"
    if debug:
        fmt = "%(levelname)s %(name)s: %(message)s"

    logging.basicConfig(level=level, format=fmt, stream=sys.stderr)
    if debug:
        logging.getLogger("paramiko").setLevel(logging.DEBUG)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Connect via SSH and install Docker on the remote host (get.docker.com)."
    )
    parser.add_argument("host", help="Remote hostname or IP address")
    parser.add_argument("username", help="SSH username")
    parser.add_argument(
        "password",
        nargs="?",
        default=None,
        help="SSH password (or set SSH_PASSWORD env var)",
    )
    parser.add_argument(
        "-p",
        "--port",
        type=int,
        default=22,
        help="SSH port (default: 22)",
    )
    parser.add_argument(
        "-t",
        "--timeout",
        type=float,
        default=10.0,
        help="SSH connection timeout in seconds (default: 10)",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Log progress (download, install, start)",
    )
    parser.add_argument(
        "-d",
        "--debug",
        action="store_true",
        help="Enable debug logs including paramiko",
    )
    args = parser.parse_args()

    _configure_logging(verbose=args.verbose, debug=args.debug)

    password = args.password or os.environ.get("SSH_PASSWORD")
    if not password:
        logger.error("Password required via argument or SSH_PASSWORD env var")
        return 2

    success = install_remote_docker(
        host=args.host,
        username=args.username,
        password=password,
        port=args.port,
        timeout=args.timeout,
    )

    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
