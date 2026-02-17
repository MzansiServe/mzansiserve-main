#!/usr/bin/env python3
"""Run git checkout <branch> (or git switch) in the local repo. Repo path and branch as args. Exit 0 on success."""

import argparse
import shlex
import sys

from common import add_common_args, configure_logging, run_local


def main() -> int:
    parser = argparse.ArgumentParser(description="Checkout a branch locally.")
    add_common_args(parser)
    parser.add_argument(
        "repo_path",
        nargs="?",
        default=".",
        help="Path to git repo (default: current directory)",
    )
    parser.add_argument("branch", help="Branch name to checkout")
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    path = shlex.quote(args.repo_path)
    branch = shlex.quote(args.branch)
    code, out, err = run_local(
        "git -C %s checkout %s" % (path, branch), timeout_sec=30
    )
    if code != 0:
        print(err or out, file=sys.stderr)
        return 1
    if out.strip() and args.verbose:
        print(out.strip(), file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
