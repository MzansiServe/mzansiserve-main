#!/usr/bin/env python3
"""Install Docker (if missing) and Docker Compose on remote host via SSH. Stream install logs. Exit 0 on success."""

import argparse
import logging
import sys

from common import (
    add_common_args,
    add_remote_ssh_args,
    configure_logging,
    get_password,
    run_remote,
    run_remote_stream,
    ssh_connect,
)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Install Docker and Docker Compose on remote host (Docker first if missing)."
    )
    add_remote_ssh_args(parser)
    add_common_args(parser)
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    log = logging.getLogger(__name__)

    password = get_password(args)
    if not password:
        print("Error: password required via argument or SSH_PASSWORD env var", file=sys.stderr)
        return 2

    try:
        client = ssh_connect(
            args.host, args.username, password, port=args.port, timeout=args.timeout
        )
    except Exception as e:
        print("SSH failed: %s" % e, file=sys.stderr)
        return 1

    try:
        # 1. Check Docker
        code, out, err = run_remote(client, "docker --version", timeout_sec=10)
        if code != 0:
            log.info("Docker not found. Installing Docker...")
            client.close()
            try:
                from install_docker import install_remote_docker
            except ImportError:
                print("Error: install_docker module not found. Install Docker on the remote host first.", file=sys.stderr)
                return 1
            # Ensure streaming during Docker install
            if not args.verbose and not args.debug:
                logging.getLogger().setLevel(logging.INFO)
            ok = install_remote_docker(
                host=args.host,
                username=args.username,
                password=password,
                port=args.port,
                timeout=args.timeout,
                log=log,
            )
            if not ok:
                print("Error: Docker installation failed.", file=sys.stderr)
                return 1
            # Reconnect after install_docker closes its client
            client = ssh_connect(
                args.host, args.username, password, port=args.port, timeout=args.timeout
            )
        else:
            if args.verbose:
                log.info("Docker already installed: %s", (out or err or "").strip())

        # 2. Check Docker Compose (plugin or standalone)
        code, out, err = run_remote(
            client,
            "docker compose version 2>/dev/null || docker-compose version",
            timeout_sec=10,
        )
        if code == 0:
            if args.verbose:
                log.info("Docker Compose already installed")
            return 0

        log.info("Docker Compose not found. Installing...")

        # 3. Install Docker Compose (stream output)
        code, out, err = run_remote(client, "command -v apt-get", timeout_sec=5)
        if code == 0 and out.strip():
            code, _, _ = run_remote_stream(
                client,
                "sudo apt-get update && sudo apt-get install -y docker-compose-plugin",
                timeout_sec=120,
            )
        else:
            code, out, err = run_remote(client, "command -v dnf", timeout_sec=5)
            if code == 0 and out.strip():
                add_repo = (
                    "sudo dnf install -y dnf-plugins-core 2>/dev/null; "
                    "sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo 2>/dev/null || true; "
                )
                code, _, _ = run_remote_stream(
                    client,
                    add_repo + "sudo dnf install -y docker-compose-plugin",
                    timeout_sec=180,
                )
            else:
                add_repo = (
                    "sudo yum install -y yum-utils 2>/dev/null; "
                    "sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo 2>/dev/null || true; "
                )
                code, _, _ = run_remote_stream(
                    client,
                    add_repo + "sudo yum install -y docker-compose-plugin",
                    timeout_sec=180,
                )

        if code != 0:
            # Fallback: standalone docker-compose binary
            log.info("Package install failed. Trying standalone docker-compose binary...")
            code_arch, out_arch, _ = run_remote(client, "uname -m", timeout_sec=5)
            arch = "aarch64" if out_arch and "aarch64" in out_arch else "x86_64"
            code, out, err = run_remote_stream(
                client,
                f"curl -sSL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-{arch} "
                "-o /tmp/docker-compose && sudo mv /tmp/docker-compose /usr/local/bin/docker-compose "
                "&& sudo chmod +x /usr/local/bin/docker-compose && docker-compose version",
                timeout_sec=60,
            )

        if code != 0:
            print(err or out or "Docker Compose installation failed.", file=sys.stderr)
            return 1
        return 0
    finally:
        client.close()


if __name__ == "__main__":
    sys.exit(main())
