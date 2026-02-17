#!/usr/bin/env python3
"""Install nginx on the local machine (apt/yum/dnf as per OS). Exit 0 on success."""

import argparse
import sys

from common import add_common_args, configure_logging, run_local


def main() -> int:
    parser = argparse.ArgumentParser(description="Install nginx locally.")
    add_common_args(parser)
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    code, out, err = run_local("command -v dnf", timeout_sec=5)
    if code == 0 and out.strip():
        code, out, err = run_local("sudo dnf install -y nginx", timeout_sec=120)
    else:
        code, out, err = run_local("command -v yum", timeout_sec=5)
        if code == 0 and out.strip():
            code, out, err = run_local("sudo yum install -y nginx", timeout_sec=120)
        else:
            code, out, err = run_local(
                "sudo apt-get update && sudo apt-get install -y nginx", timeout_sec=120
            )

    if code != 0:
        print(err or out, file=sys.stderr)
        return 1
    if out.strip() and args.verbose:
        print(out.strip(), file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
