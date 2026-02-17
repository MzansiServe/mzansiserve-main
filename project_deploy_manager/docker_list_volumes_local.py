#!/usr/bin/env python3
"""List Docker volumes locally (docker volume ls). Output to stdout."""

import argparse
import sys

from common import add_common_args, configure_logging, run_local


def main() -> int:
    parser = argparse.ArgumentParser(description="List Docker volumes locally.")
    add_common_args(parser)
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    code, out, err = run_local("docker volume ls", timeout_sec=30)
    if code != 0:
        print(err or out, file=sys.stderr)
        return 1
    print(out.rstrip())
    return 0


if __name__ == "__main__":
    sys.exit(main())
