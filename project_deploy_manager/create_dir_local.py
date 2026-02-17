#!/usr/bin/env python3
"""Create a directory locally (mkdir -p). Exit 0 on success."""

import argparse
import os
import shlex
import sys
from typing import Tuple

from common import add_common_args, configure_logging, run_local


def create_dir_local(path: str, parents: bool = True, timeout_sec: int = 30) -> Tuple[int, str, str]:
    """Create directory locally. Returns (exit_code, stdout, stderr)."""
    path = os.path.abspath(os.path.expanduser(path))
    cmd = "mkdir -p %s" if parents else "mkdir %s"
    return run_local(cmd % shlex.quote(path), timeout_sec=timeout_sec)


def main() -> int:
    parser = argparse.ArgumentParser(description="Create a directory locally.")
    add_common_args(parser)
    parser.add_argument("path", help="Directory path to create")
    parser.add_argument(
        "-p",
        "--parents",
        action="store_true",
        default=True,
        help="Create parent directories as needed (default: True)",
    )
    parser.add_argument(
        "--no-parents",
        action="store_false",
        dest="parents",
        help="Do not create parent directories",
    )
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)
    code, out, err = create_dir_local(args.path, parents=args.parents)
    if code != 0:
        print(err or out, file=sys.stderr)
        return 1
    if out.strip() and args.verbose:
        print(out.strip(), file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
