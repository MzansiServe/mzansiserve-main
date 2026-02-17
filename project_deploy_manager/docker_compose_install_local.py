#!/usr/bin/env python3
"""Install Docker Compose on the local machine (plugin or standalone as per OS). Exit 0 on success."""

import argparse
import sys

from common import add_common_args, configure_logging, run_local


def main() -> int:
    parser = argparse.ArgumentParser(description="Install Docker Compose locally.")
    add_common_args(parser)
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    # Check if already installed (docker compose plugin)
    code, out, err = run_local("docker compose version", timeout_sec=5)
    if code == 0:
        if args.verbose:
            print("Docker Compose already installed (plugin)", file=sys.stderr)
        return 0

    # Install Docker Compose plugin: apt/yum/dnf
    code, out, err = run_local("command -v apt-get", timeout_sec=5)
    if code == 0 and out.strip():
        code, out, err = run_local(
            "sudo apt-get update && sudo apt-get install -y docker-compose-plugin",
            timeout_sec=120,
        )
    else:
        code, out, err = run_local("command -v dnf", timeout_sec=5)
        if code == 0 and out.strip():
            code, out, err = run_local(
                "sudo dnf install -y docker-compose-plugin",
                timeout_sec=120,
            )
        else:
            code, out, err = run_local(
                "sudo yum install -y docker-compose-plugin",
                timeout_sec=120,
            )

    if code != 0:
        print(err or out, file=sys.stderr)
        return 1
    if out.strip() and args.verbose:
        print(out.strip(), file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
