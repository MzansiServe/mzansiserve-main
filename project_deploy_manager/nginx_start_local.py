#!/usr/bin/env python3
"""Start nginx locally (systemctl start nginx or service nginx start). Exit 0 on success."""

import argparse
import sys
from typing import Tuple

from common import add_common_args, configure_logging, run_local


def nginx_start_local(timeout_sec: int = 10) -> Tuple[int, str, str]:
    """Start nginx locally. Returns (exit_code, stdout, stderr)."""
    code, out, err = run_local("systemctl start nginx", timeout_sec=timeout_sec)
    if code != 0:
        code, out, err = run_local("service nginx start", timeout_sec=timeout_sec)
    return code, out, err


def main() -> int:
    parser = argparse.ArgumentParser(description="Start nginx locally.")
    add_common_args(parser)
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)
    code, out, err = nginx_start_local()
    if code != 0:
        print(err or out, file=sys.stderr)
        return 1
    if out.strip() and args.verbose:
        print(out.strip(), file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
