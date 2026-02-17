#!/usr/bin/env python3
"""
Connect via SSH to a remote host and check if Docker is installed (present in PATH).
Prints true if installed, false otherwise. Exit 0 if installed, 1 if not, 2 on missing password or SSH failure.
"""

import argparse
import sys
from typing import Optional, Tuple

from common import (
    add_common_args,
    add_remote_ssh_args,
    configure_logging,
    get_password,
    run_remote,
    ssh_connect,
)


def check_remote_docker(
    host: str,
    username: str,
    password: str,
    port: int = 22,
    timeout: float = 10.0,
) -> Tuple[bool, Optional[str]]:
    """
    Connect via SSH and check if Docker is installed on the remote host.
    Returns (installed, version_string_or_none).
    """
    client = None
    try:
        client = ssh_connect(host, username, password, port=port, timeout=timeout)
        code, out, err = run_remote(client, "command -v docker", timeout_sec=10)
        if code != 0:
            return False, None
        ver_code, ver_out, _ = run_remote(client, "docker --version 2>/dev/null || true", timeout_sec=10)
        version = (ver_out or "").strip() if ver_code == 0 else None
        return True, version or None
    except Exception:
        return False, None
    finally:
        if client is not None:
            try:
                client.close()
            except Exception:
                pass


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Check if Docker is installed on remote host via SSH."
    )
    add_remote_ssh_args(parser)
    add_common_args(parser)
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    password = get_password(args)
    if not password:
        print("Error: password required via argument or SSH_PASSWORD env var", file=sys.stderr)
        return 2

    installed, version = check_remote_docker(
        args.host, args.username, password, port=args.port, timeout=args.timeout
    )

    if installed:
        print("true")
        if args.verbose and version:
            print(version, file=sys.stderr)
        return 0
    else:
        print("false")
        return 1


if __name__ == "__main__":
    sys.exit(main())
