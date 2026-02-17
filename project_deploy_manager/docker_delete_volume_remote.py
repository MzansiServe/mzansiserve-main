#!/usr/bin/env python3
"""Remove a Docker volume by name on remote host via SSH. Exit 0 on success."""

import argparse
import shlex
import sys

from common import (
    add_common_args,
    add_remote_ssh_args,
    configure_logging,
    get_password,
    run_remote,
    ssh_connect,
)


def main() -> int:
    parser = argparse.ArgumentParser(description="Delete a Docker volume on remote host.")
    add_remote_ssh_args(parser)
    add_common_args(parser)
    parser.add_argument("volume", help="Volume name to remove")
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

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
        code, out, err = run_remote(
            client, "docker volume rm %s" % shlex.quote(args.volume), timeout_sec=30
        )
    finally:
        client.close()

    if code != 0:
        print(err or out, file=sys.stderr)
        return 1
    if out.strip():
        print(out.rstrip())
    return 0


if __name__ == "__main__":
    sys.exit(main())
