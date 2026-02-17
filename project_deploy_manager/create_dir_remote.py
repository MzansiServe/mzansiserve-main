#!/usr/bin/env python3
"""Create a directory on remote host via SSH (mkdir -p). Exit 0 on success."""

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


def create_dir_remote(
    host: str,
    username: str,
    password: str,
    path: str,
    parents: bool = True,
    port: int = 22,
    timeout: float = 10.0,
    timeout_sec: int = 30,
) -> Tuple[int, str, str]:
    """Create directory on remote host. Returns (exit_code, stdout, stderr)."""
    path_esc = path.replace("'", "'\"'\"'")
    cmd = "mkdir -p '%s'" if parents else "mkdir '%s'"
    cmd = cmd % path_esc
    client = ssh_connect(host, username, password, port=port, timeout=timeout)
    try:
        return run_remote(client, cmd, timeout_sec=timeout_sec)
    finally:
        client.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="Create a directory on remote host.")
    add_remote_ssh_args(parser)
    add_common_args(parser)
    parser.add_argument("path", help="Directory path to create on remote")
    parser.add_argument("--parents", action="store_true", default=True, help="Create parent dirs (default: True)")
    parser.add_argument("--no-parents", action="store_false", dest="parents", help="Do not create parent dirs")
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)
    password = get_password(args)
    if not password:
        print("Error: password required via argument or SSH_PASSWORD env var", file=sys.stderr)
        return 2
    try:
        code, out, err = create_dir_remote(args.host, args.username, password, args.path, parents=args.parents, port=args.port, timeout=args.timeout)
    except Exception as e:
        print("SSH failed: %s" % e, file=sys.stderr)
        return 1
    if code != 0:
        print(err or out, file=sys.stderr)
        return 1
    if out.strip() and args.verbose:
        print(out.strip(), file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
