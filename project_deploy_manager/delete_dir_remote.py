#!/usr/bin/env python3
"""Delete a directory on remote host via SSH (rmdir or rm -rf). Exit 0 on success."""

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


def delete_dir_remote(
    host: str,
    username: str,
    password: str,
    path: str,
    recursive: bool = False,
    port: int = 22,
    timeout: float = 10.0,
    timeout_sec: int = 60,
) -> Tuple[int, str, str]:
    """Delete directory on remote host. Returns (exit_code, stdout, stderr)."""
    path_esc = path.replace("'", "'\"'\"'")
    cmd = "rm -rf '%s'" if recursive else "rmdir '%s'"
    client = ssh_connect(host, username, password, port=port, timeout=timeout)
    try:
        return run_remote(client, cmd % path_esc, timeout_sec=timeout_sec)
    finally:
        client.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="Delete a directory on remote host.")
    add_remote_ssh_args(parser)
    add_common_args(parser)
    parser.add_argument("path", help="Directory path to remove on remote")
    parser.add_argument("-r", "--recursive", action="store_true", help="Remove directory and contents (rm -rf)")
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)
    password = get_password(args)
    if not password:
        print("Error: password required via argument or SSH_PASSWORD env var", file=sys.stderr)
        return 2
    try:
        code, out, err = delete_dir_remote(args.host, args.username, password, args.path, recursive=args.recursive, port=args.port, timeout=args.timeout)
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

