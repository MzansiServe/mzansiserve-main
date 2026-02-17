#!/usr/bin/env python3
"""Check if git is installed on remote host via SSH. Print true/false; exit 0 if installed."""

import argparse
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
    parser = argparse.ArgumentParser(description="Check if git is installed on remote host.")
    add_remote_ssh_args(parser)
    add_common_args(parser)
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
        code, out, err = run_remote(client, "command -v git", timeout_sec=5)
    finally:
        client.close()

    if code == 0 and out.strip():
        print("true")
        return 0
    print("false")
    return 1


if __name__ == "__main__":
    sys.exit(main())
