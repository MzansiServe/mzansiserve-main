#!/usr/bin/env python3
"""Check if git is installed locally (command -v git). Print true/false; exit 0 if installed."""

import argparse
import sys
from typing import Tuple

from common import add_common_args, configure_logging, run_local


def git_check_installed_local(timeout_sec: int = 5) -> Tuple[int, str, str]:
    """Check if git is installed locally. Returns (exit_code, 'true'|'false', stderr)."""
    code, out, err = run_local("command -v git", timeout_sec=timeout_sec)
    if code == 0 and out.strip():
        return 0, "true", err
    return 1, "false", err or out


def main() -> int:
    parser = argparse.ArgumentParser(description="Check if git is installed locally.")
    add_common_args(parser)
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)
    code, out, err = git_check_installed_local()
    print(out)
    return code


if __name__ == "__main__":
    sys.exit(main())
