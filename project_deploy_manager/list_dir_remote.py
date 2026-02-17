#!/usr/bin/env python3
"""List directory contents on remote host via SSH (ls). Exit 0 on success."""

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


def list_dir_remote(
    host: str,
    username: str,
    password: str,
    path: str = ".",
    long_format: bool = False,
    all_entries: bool = False,
    recursive: bool = False,
    port: int = 22,
    timeout: float = 10.0,
    timeout_sec: int = 60,
) -> Tuple[int, str, str]:
    """List directory on remote host. Returns (exit_code, stdout, stderr)."""
    path_esc = path.replace("'", "'\"'\"'")
    parts = ["ls"]
    if long_format:
        parts.append("-l")
    if all_entries:
        parts.append("-a")
    if recursive:
        parts.append("-R")
    parts.append("'%s'" % path_esc)
    client = ssh_connect(host, username, password, port=port, timeout=timeout)
    try:
        return run_remote(client, " ".join(parts), timeout_sec=timeout_sec)
    finally:
        client.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="List directory contents on remote host.")
    add_remote_ssh_args(parser)
    add_common_args(parser)
    parser.add_argument("path", nargs="?", default=".", metavar="DIR", help="Directory to list on remote (default: .)")
    parser.add_argument("-l", "--long", action="store_true", help="Long format")
    parser.add_argument("-a", "--all", action="store_true", help="Include hidden entries")
    parser.add_argument("-R", "--recursive", action="store_true", help="List recursively")
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)
    password = get_password(args)
    if not password:
        print("Error: password required via argument or SSH_PASSWORD env var", file=sys.stderr)
        return 2
    try:
        code, out, err = list_dir_remote(args.host, args.username, password, path=args.path, long_format=args.long, all_entries=args.all, recursive=args.recursive, port=args.port, timeout=args.timeout)
    except Exception as e:
        print("SSH failed: %s" % e, file=sys.stderr)
        return 1
    if code != 0:
        print(err or out, file=sys.stderr)
        return 1
    print(out.rstrip())
    return 0


if __name__ == "__main__":
    sys.exit(main())
