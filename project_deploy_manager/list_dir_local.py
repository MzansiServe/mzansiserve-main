#!/usr/bin/env python3
"""List directory contents locally (ls). Print names or long listing. Exit 0 on success."""

import argparse
import os
import shlex
import sys
from typing import Tuple

from common import add_common_args, configure_logging, run_local


def list_dir_local(
    path: str = ".",
    long_format: bool = False,
    all_entries: bool = False,
    recursive: bool = False,
    timeout_sec: int = 60,
) -> Tuple[int, str, str]:
    """List directory locally. Returns (exit_code, stdout, stderr)."""
    path = os.path.abspath(os.path.expanduser(path))
    parts = ["ls"]
    if long_format:
        parts.append("-l")
    if all_entries:
        parts.append("-a")
    if recursive:
        parts.append("-R")
    parts.append(shlex.quote(path))
    return run_local(" ".join(parts), timeout_sec=timeout_sec)


def main() -> int:
    parser = argparse.ArgumentParser(description="List directory contents locally.")
    add_common_args(parser)
    parser.add_argument("path", nargs="?", default=".", metavar="DIR", help="Directory to list (default: .)")
    parser.add_argument("-l", "--long", action="store_true", help="Long format")
    parser.add_argument("-a", "--all", action="store_true", help="Include hidden entries")
    parser.add_argument("-R", "--recursive", action="store_true", help="List recursively")
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)
    code, out, err = list_dir_local(path=args.path, long_format=args.long, all_entries=args.all, recursive=args.recursive)
    if code != 0:
        print(err or out, file=sys.stderr)
        return 1
    print(out.rstrip())
    return 0


if __name__ == "__main__":
    sys.exit(main())
