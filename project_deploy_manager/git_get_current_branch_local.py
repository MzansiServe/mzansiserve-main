#!/usr/bin/env python3
"""Print the current branch name in the local repo (git branch --show-current). Repo path as arg."""

import argparse
import shlex
import sys
from typing import Tuple

from common import add_common_args, configure_logging, run_local


def git_get_current_branch_local(repo_path: str = ".", timeout_sec: int = 10) -> Tuple[int, str, str]:
    """Get current branch name locally. Returns (exit_code, stdout, stderr)."""
    path = shlex.quote(repo_path)
    return run_local("git -C %s branch --show-current" % path, timeout_sec=timeout_sec)


def main() -> int:
    parser = argparse.ArgumentParser(description="Print current branch name locally.")
    add_common_args(parser)
    parser.add_argument("repo_path", nargs="?", default=".", help="Path to git repo (default: .)")
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)
    code, out, err = git_get_current_branch_local(args.repo_path)
    if code != 0:
        print(err or out, file=sys.stderr)
        return 1
    print(out.strip())
    return 0


if __name__ == "__main__":
    sys.exit(main())
