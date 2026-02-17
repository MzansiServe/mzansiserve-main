#!/usr/bin/env python3
"""Run git clone locally. Optional target path and branch. Use GIT_PAC_TOKEN for auth. Exit 0 on success."""

import argparse
import os
import re
import shlex
import sys

from common import add_common_args, configure_logging, run_local


def _url_with_token(url: str, token: str) -> str:
    """Inject token into https URL for auth: https://host/path -> https://TOKEN@host/path."""
    if not token or not url.strip().startswith("https://"):
        return url
    # https://github.com/user/repo.git -> https://TOKEN@github.com/user/repo.git
    return re.sub(r"^https://", "https://%s@" % re.escape(token), url, count=1)


def main() -> int:
    parser = argparse.ArgumentParser(description="Clone a git repo locally.")
    add_common_args(parser)
    parser.add_argument("repo_url", help="Repository URL (e.g. https://github.com/user/repo.git)")
    parser.add_argument(
        "target_path",
        nargs="?",
        default=None,
        help="Target directory (default: clone into current dir using repo name)",
    )
    parser.add_argument("-b", "--branch", default=None, help="Branch to clone (default: default branch)")
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    token = os.environ.get("GIT_PAC_TOKEN", "")
    url = _url_with_token(args.repo_url.strip(), token)
    parts = ["git", "clone"]
    if args.branch:
        parts.extend(["-b", shlex.quote(args.branch)])
    parts.append(shlex.quote(url))
    if args.target_path:
        parts.append(shlex.quote(args.target_path))
    cmd = " ".join(parts)

    code, out, err = run_local(cmd, timeout_sec=300)
    if code != 0:
        print(err or out, file=sys.stderr)
        return 1
    if out.strip() and args.verbose:
        print(out.strip(), file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
