#!/usr/bin/env python3
"""Run git pull in the local repo. Repo path as arg; optional branch. Use GIT_PAC_TOKEN for auth. Exit 0 on success."""

import argparse
import shlex
import sys

from common import add_common_args, configure_logging, run_local


def main() -> int:
    parser = argparse.ArgumentParser(description="Run git pull locally.")
    add_common_args(parser)
    parser.add_argument(
        "repo_path",
        nargs="?",
        default=".",
        help="Path to git repo (default: current directory)",
    )
    parser.add_argument("-b", "--branch", default=None, help="Branch to pull (default: current branch)")
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    path = shlex.quote(args.repo_path)
    cmd = "git -C %s pull" % path
    if args.branch:
        cmd += " origin %s" % shlex.quote(args.branch)

    # GIT_PAC_TOKEN is inherited from env; remote URL may already have token from clone
    code, out, err = run_local(cmd, timeout_sec=120)
    if code != 0:
        print(err or out, file=sys.stderr)
        return 1
    if out.strip() and args.verbose:
        print(out.strip(), file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
