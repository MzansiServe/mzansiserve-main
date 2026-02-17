#!/usr/bin/env python3
"""Run git pull in a repo on remote host via SSH. Provide GIT_PAC_TOKEN on remote for auth. Exit 0 on success."""

import argparse
import os
import sys

from common import (
    add_common_args,
    add_remote_ssh_args,
    configure_logging,
    get_password,
    run_remote_stream,
    ssh_connect,
)


def main() -> int:
    parser = argparse.ArgumentParser(description="Run git pull on remote repo.")
    add_remote_ssh_args(parser)
    add_common_args(parser)
    parser.add_argument("repo_path", help="Path to git repo on remote")
    parser.add_argument("-b", "--branch", default=None, help="Branch to pull")
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    password = get_password(args)
    if not password:
        print("Error: password required via argument or SSH_PASSWORD env var", file=sys.stderr)
        return 2

    repo_esc = args.repo_path.replace("'", "'\"'\"'")
    cmd = "cd '%s' && git pull" % repo_esc
    if args.branch:
        branch_esc = args.branch.replace("'", "'\"'\"'")
        cmd += " origin '%s'" % branch_esc

    # Optionally pass GIT_PAC_TOKEN to remote for pull (if remote needs to auth)
    token = os.environ.get("GIT_PAC_TOKEN", "")
    if token:
        token_esc = token.replace("'", "'\"'\"'")
        cmd = "export GIT_PAC_TOKEN='%s' && %s" % (token_esc, cmd)

    try:
        client = ssh_connect(
            args.host, args.username, password, port=args.port, timeout=args.timeout
        )
    except Exception as e:
        print("SSH failed: %s" % e, file=sys.stderr)
        return 1

    try:
        code, out, err = run_remote_stream(client, cmd, timeout_sec=120)
    finally:
        client.close()

    if code != 0:
        if not (err or out):
            print("Command failed with exit code %s" % code, file=sys.stderr)
        elif err or out:
            print(err or out, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
