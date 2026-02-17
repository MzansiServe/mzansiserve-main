#!/usr/bin/env python3
"""Delete a directory locally (rmdir or rm -rf). Exit 0 on success."""

import argparse
import os
import shlex
import sys
from typing import Tuple

from common import add_common_args, configure_logging, run_local


def delete_dir_local(path: str, recursive: bool = False, timeout_sec: int = 60) -> Tuple[int, str, str]:
    """Delete directory locally. Returns (exit_code, stdout, stderr)."""
    path = os.path.abspath(os.path.expanduser(path))
    cmd = "rm -rf %s" % shlex.quote(path) if recursive else "rmdir %s" % shlex.quote(path)
    return run_local(cmd, timeout_sec=timeout_sec)


def main() -> int:
    parser = argparse.ArgumentParser(description="Delete a directory locally.")
    add_common_args(parser)
    parser.add_argument("path", help="Directory path to remove")
    parser.add_argument("-r", "--recursive", action="store_true", help="Remove directory and contents (rm -rf)")
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)
    code, out, err = delete_dir_local(args.path, recursive=args.recursive)
    if code != 0:
        print(err or out, file=sys.stderr)
        return 1
    if out.strip() and args.verbose:
        print(out.strip(), file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
