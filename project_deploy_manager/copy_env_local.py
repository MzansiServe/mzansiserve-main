#!/usr/bin/env python3
"""Copy a local env file to a specified directory. Exit 0 on success."""

import argparse
import os
import shutil
import sys
from typing import Tuple

from common import add_common_args, configure_logging


def copy_env_local(source: str, target_dir: str, create_dir: bool = False) -> Tuple[int, str, str]:
    """Copy env file to local directory. Returns (exit_code, stdout, stderr)."""
    source = os.path.abspath(os.path.expanduser(source))
    if not os.path.isfile(source):
        return 1, "", "Error: source is not a file: %s" % source
    target_dir = os.path.abspath(os.path.expanduser(target_dir))
    if create_dir and not os.path.isdir(target_dir):
        os.makedirs(target_dir, exist_ok=True)
    if not os.path.isdir(target_dir):
        return 1, "", "Error: target_dir is not a directory: %s" % target_dir
    dest = os.path.join(target_dir, os.path.basename(source))
    try:
        shutil.copy2(source, dest)
        return 0, "Copied %s -> %s" % (source, dest), ""
    except OSError as e:
        return 1, "", "Error copying file: %s" % e


def main() -> int:
    parser = argparse.ArgumentParser(description="Copy an env file to a local directory.")
    add_common_args(parser)
    parser.add_argument("source", help="Path to env file (e.g. .env)")
    parser.add_argument("target_dir", help="Destination directory")
    parser.add_argument("--create-dir", action="store_true", help="Create target directory if missing")
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)
    code, out, err = copy_env_local(args.source, args.target_dir, create_dir=args.create_dir)
    if code != 0:
        print(err, file=sys.stderr)
        return code
    if out and args.verbose:
        print(out, file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
