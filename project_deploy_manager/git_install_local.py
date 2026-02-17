#!/usr/bin/env python3
"""Install git on the local machine (apt/yum/dnf as per OS). Exit 0 on success."""

import argparse
import sys
from typing import Tuple

from common import add_common_args, configure_logging, run_local


def git_install_local(timeout_sec: int = 120) -> Tuple[int, str, str]:
    """Install git locally (dnf/yum/apt). Returns (exit_code, stdout, stderr)."""
    code, out, err = run_local("command -v dnf", timeout_sec=5)
    if code == 0 and out.strip():
        return run_local("sudo dnf install -y git", timeout_sec=timeout_sec)
    code, out, err = run_local("command -v yum", timeout_sec=5)
    if code == 0 and out.strip():
        return run_local("sudo yum install -y git", timeout_sec=timeout_sec)
    return run_local("sudo apt-get update && sudo apt-get install -y git", timeout_sec=timeout_sec)


def main() -> int:
    parser = argparse.ArgumentParser(description="Install git locally.")
    add_common_args(parser)
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)
    code, out, err = git_install_local()
    if code != 0:
        print(err or out, file=sys.stderr)
        return 1
    if out.strip() and args.verbose:
        print(out.strip(), file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
