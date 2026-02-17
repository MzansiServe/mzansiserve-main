#!/usr/bin/env python3
"""Copy a local env file to a specified directory on the remote host via SFTP. Exit 0 on success."""

import argparse
import os
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


def copy_env_remote(
    host: str,
    username: str,
    password: str,
    source: str,
    target_dir: str,
    create_dir: bool = False,
    port: int = 22,
    timeout: float = 10.0,
) -> Tuple[int, str, str]:
    """Copy local env file to remote directory via SFTP. Returns (exit_code, stdout, stderr)."""
    source = os.path.abspath(os.path.expanduser(source))
    if not os.path.isfile(source):
        return 1, "", "Error: source is not a file: %s" % source
    target_dir_esc = target_dir.replace("'", "'\"'\"'")
    client = ssh_connect(host, username, password, port=port, timeout=timeout)
    try:
        if create_dir:
            code, out, err = run_remote(client, "mkdir -p '%s'" % target_dir_esc, timeout_sec=30)
            if code != 0:
                return code, out, err or out
        sftp = client.open_sftp()
        try:
            remote_path = target_dir.rstrip("/") + "/.env"
            sftp.put(source, remote_path)
            return 0, "Copied %s -> %s:%s" % (source, host, remote_path), ""
        finally:
            sftp.close()
    finally:
        client.close()


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Copy a local env file to a directory on the remote host."
    )
    add_remote_ssh_args(parser)
    add_common_args(parser)
    parser.add_argument(
        "source",
        help="Local path to env file (e.g. .env or /path/to/.env)",
    )
    parser.add_argument(
        "target_dir",
        help="Destination directory on remote (e.g. /home/user/app)",
    )
    parser.add_argument(
        "--create-dir",
        action="store_true",
        help="Create target directory on remote if it does not exist (mkdir -p)",
    )
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)
    password = get_password(args)
    if not password:
        print("Error: password required via argument or SSH_PASSWORD env var", file=sys.stderr)
        return 2
    try:
        code, out, err = copy_env_remote(
            args.host, args.username, password, args.source, args.target_dir,
            create_dir=args.create_dir, port=args.port, timeout=args.timeout,
        )
    except Exception as e:
        print("SSH failed: %s" % e, file=sys.stderr)
        return 1
    if code != 0:
        print(err or out, file=sys.stderr)
        return code
    if out and args.verbose:
        print(out, file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
