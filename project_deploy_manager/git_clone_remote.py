#!/usr/bin/env python3
"""Clone a git repo on remote host via SSH. Target path on remote; use --pac-token or GIT_PAC_TOKEN for HTTPS auth. Exit 0 on success."""

import argparse
import os
import re
import sys

from common import (
    add_common_args,
    add_remote_ssh_args,
    configure_logging,
    get_password,
    run_remote,
    ssh_connect,
)


def _url_with_token(url: str, token: str) -> str:
    if not token or not url.strip().startswith("https://"):
        return url
    return re.sub(r"^https://", "https://%s@" % re.escape(token), url, count=1)


def main() -> int:
    parser = argparse.ArgumentParser(description="Clone a git repo on remote host.")
    add_remote_ssh_args(parser)
    add_common_args(parser)
    parser.add_argument("repo_url", help="Repository URL")
    parser.add_argument("target_path", help="Target directory on remote (e.g. /home/user/repo)")
    parser.add_argument("-b", "--branch", default=None, help="Branch to clone")
    parser.add_argument(
        "--pac-token",
        default=None,
        metavar="TOKEN",
        help="Git Personal Access Token for HTTPS (default: GIT_PAC_TOKEN env)",
    )
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    password = get_password(args)
    if not password:
        print("Error: password required via argument or SSH_PASSWORD env var", file=sys.stderr)
        return 2

    token = args.pac_token if args.pac_token is not None else os.environ.get("GIT_PAC_TOKEN", "")
    url = _url_with_token(args.repo_url.strip(), token)
    # Escape for remote shell: single-quote URL (replace ' with '\'' )
    url_escaped = url.replace("'", "'\"'\"'")
    cmd = "git clone '%s' '%s'" % (url_escaped, args.target_path.replace("'", "'\"'\"'"))
    if args.branch:
        cmd = "git clone -b '%s' '%s' '%s'" % (
            args.branch.replace("'", "'\"'\"'"),
            url_escaped,
            args.target_path.replace("'", "'\"'\"'"),
        )

    try:
        client = ssh_connect(
            args.host, args.username, password, port=args.port, timeout=args.timeout
        )
    except Exception as e:
        print("SSH failed: %s" % e, file=sys.stderr)
        return 1

    try:
        # Pass token via env on remote if needed (clone URL already has token for https)
        code, out, err = run_remote(client, cmd, timeout_sec=300)
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
