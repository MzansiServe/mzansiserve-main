#!/usr/bin/env python3
"""Check if Docker Compose (docker compose or docker-compose) is available locally. Print true/false; exit 0 if installed."""

import argparse
import sys

from common import add_common_args, configure_logging, run_local


def main() -> int:
    parser = argparse.ArgumentParser(description="Check if Docker Compose is installed locally.")
    add_common_args(parser)
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    code, out, err = run_local("docker compose version", timeout_sec=5)
    if code == 0 and out.strip():
        print("true")
        return 0
    code, out, err = run_local("docker-compose --version", timeout_sec=5)
    if code == 0 and out.strip():
        print("true")
        return 0
    print("false")
    return 1


if __name__ == "__main__":
    sys.exit(main())
