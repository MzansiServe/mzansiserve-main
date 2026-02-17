#!/usr/bin/env python3
"""Stop nginx locally (systemctl stop nginx or service nginx stop). Exit 0 on success."""

import argparse
import sys

from common import add_common_args, configure_logging, run_local


def main() -> int:
    parser = argparse.ArgumentParser(description="Stop nginx locally.")
    add_common_args(parser)
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    code, out, err = run_local("systemctl stop nginx", timeout_sec=10)
    if code != 0:
        code, out, err = run_local("service nginx stop", timeout_sec=10)
    if code != 0:
        print(err or out, file=sys.stderr)
        return 1
    if out.strip() and args.verbose:
        print(out.strip(), file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
