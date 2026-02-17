#!/usr/bin/env python3
"""Reboot a remote host via SSH (e.g. sudo reboot). Exit 0 when command succeeds."""

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


def restart_host_remote(
    host: str,
    username: str,
    password: str,
    dry_run: bool = False,
    port: int = 22,
    timeout: float = 10.0,
    timeout_sec: int = 5,
) -> Tuple[int, str, str]:
    """Trigger remote reboot. Returns (exit_code, stdout, stderr). dry_run: only return 0 and message."""
    if dry_run:
        return 0, "Would run on %s: sudo reboot" % host, ""
    client = ssh_connect(host, username, password, port=port, timeout=timeout)
    try:
        code, out, err = run_remote(client, "sudo reboot", timeout_sec=timeout_sec)
    except Exception as e:
        return 1, "", str(e)
    finally:
        client.close()
    if code != 0 and "Connection reset" not in str(err):
        return code, out, err or out
    return 0, out, err


def main() -> int:
    parser = argparse.ArgumentParser(description="Reboot the remote host.")
    add_remote_ssh_args(parser)
    add_common_args(parser)
    parser.add_argument("--dry-run", action="store_true", help="Print command only, do not reboot")
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)
    password = get_password(args)
    if not password:
        print("Error: password required via argument or SSH_PASSWORD env var", file=sys.stderr)
        return 2
    try:
        code, out, err = restart_host_remote(args.host, args.username, password, dry_run=args.dry_run, port=args.port, timeout=args.timeout)
    except Exception as e:
        print("SSH failed: %s" % e, file=sys.stderr)
        return 1
    if args.dry_run and out:
        print(out)
    if code != 0:
        print(err or out, file=sys.stderr)
        return code
    return 0


if __name__ == "__main__":
    sys.exit(main())
