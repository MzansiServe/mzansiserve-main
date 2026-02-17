#!/usr/bin/env python3
"""Check if nginx is installed on remote host via SSH. Print true/false; exit 0 if installed."""

import argparse
import sys
from typing import Tuple

from common import (
    add_common_args,
    add_remote_ssh_args,
    configure_logging,
    get_password,
    run_remote,
    ssh_connect,
)


def nginx_check_install_remote(
    host: str,
    username: str,
    password: str,
    port: int = 22,
    timeout: float = 10.0,
    timeout_sec: int = 5,
) -> Tuple[int, str, str]:
    """Check if nginx is installed on remote host. Returns (exit_code, 'true'|'false', stderr)."""
    client = ssh_connect(host, username, password, port=port, timeout=timeout)
    try:
        code, out, err = run_remote(client, "command -v nginx", timeout_sec=timeout_sec)
        if code == 0 and out.strip():
            return 0, "true", err
        code, out, err = run_remote(client, "nginx -v 2>&1", timeout_sec=timeout_sec)
        if code == 0:
            return 0, "true", err
        return 1, "false", err or out
    finally:
        client.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="Check if nginx is installed on remote host.")
    add_remote_ssh_args(parser)
    add_common_args(parser)
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)
    password = get_password(args)
    if not password:
        print("Error: password required via argument or SSH_PASSWORD env var", file=sys.stderr)
        return 2
    try:
        code, out, err = nginx_check_install_remote(args.host, args.username, password, port=args.port, timeout=args.timeout)
    except Exception as e:
        print("SSH failed: %s" % e, file=sys.stderr)
        return 1
    print(out)
    return code


if __name__ == "__main__":
    sys.exit(main())
