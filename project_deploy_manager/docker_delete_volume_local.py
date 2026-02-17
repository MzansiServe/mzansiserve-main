#!/usr/bin/env python3
"""Remove a Docker volume by name locally (docker volume rm <name>). Exit 0 on success."""

import argparse
import shlex
import sys

from common import add_common_args, configure_logging, run_local


def main() -> int:
    parser = argparse.ArgumentParser(description="Delete a Docker volume locally.")
    add_common_args(parser)
    parser.add_argument("volume", help="Volume name to remove")
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    code, out, err = run_local(
        "docker volume rm %s" % shlex.quote(args.volume), timeout_sec=30
    )
    if code != 0:
        print(err or out, file=sys.stderr)
        return 1
    if out.strip():
        print(out.rstrip())
    return 0


if __name__ == "__main__":
    sys.exit(main())
