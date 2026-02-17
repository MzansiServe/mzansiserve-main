#!/usr/bin/env python3
"""List Docker images locally (docker images). Print repo, tag, id, size. Exit 0 on success."""

import argparse
import sys

from common import add_common_args, configure_logging, run_local


def main() -> int:
    parser = argparse.ArgumentParser(description="List Docker images locally.")
    add_common_args(parser)
    parser.add_argument(
        "-a",
        "--all",
        action="store_true",
        help="Show all images (default: hide intermediate)",
    )
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    cmd = "docker images -a" if args.all else "docker images"
    code, out, err = run_local(cmd, timeout_sec=60)
    if code != 0:
        print(err or out, file=sys.stderr)
        return 1
    print(out.rstrip())
    return 0


if __name__ == "__main__":
    sys.exit(main())
