#!/usr/bin/env python3
"""Check if nginx is installed locally (command -v nginx or nginx -v). Print true/false; exit 0 if installed."""

import argparse
import sys
from typing import Tuple

from common import add_common_args, configure_logging, run_local


def nginx_check_install_local(timeout_sec: int = 5) -> Tuple[int, str, str]:
    """Check if nginx is installed locally. Returns (exit_code, 'true'|'false', stderr)."""
    code, out, err = run_local("command -v nginx", timeout_sec=timeout_sec)
    if code == 0 and out.strip():
        return 0, "true", err
    code, out, err = run_local("nginx -v 2>&1", timeout_sec=timeout_sec)
    if code == 0:
        return 0, "true", err
    return 1, "false", err or out


def main() -> int:
    parser = argparse.ArgumentParser(description="Check if nginx is installed locally.")
    add_common_args(parser)
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)
    code, out, err = nginx_check_install_local()
    print(out)
    return code


if __name__ == "__main__":
    sys.exit(main())
