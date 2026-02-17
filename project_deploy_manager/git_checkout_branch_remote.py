#!/usr/bin/env python3
"""Checkout a branch in a repo on remote host via SSH. Exit 0 on success."""

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
    parser = argparse.ArgumentParser(description="Checkout a branch on remote repo.")
    add_remote_ssh_args(parser)
    add_common_args(parser)
    parser.add_argument("repo_path", help="Path to git repo on remote")
    parser.add_argument("branch", help="Branch name to checkout")
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    password = get_password(args)
    if not password:
        print("Error: password required via argument or SSH_PASSWORD env var", file=sys.stderr)
        return 2

    repo_esc = args.repo_path.replace("'", "'\"'\"'")
    branch_esc = args.branch.replace("'", "'\"'\"'")
    cmd = "git -C '%s' checkout '%s'" % (repo_esc, branch_esc)

    try:
        client = ssh_connect(
            args.host, args.username, password, port=args.port, timeout=args.timeout
        )
    except Exception as e:
        print("SSH failed: %s" % e, file=sys.stderr)
        return 1

    try:
        code, out, err = run_remote(client, cmd, timeout_sec=30)
    finally:
        client.close()

    if code != 0:
        print(err or out, file=sys.stderr)
        return 1
    if out.strip() and args.verbose:
        print(out.strip(), file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
