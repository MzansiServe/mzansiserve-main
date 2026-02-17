#!/usr/bin/env python3
"""Run docker container prune -f locally. Remove stopped containers. Exit 0 on success."""

import argparse
import sys
from typing import Tuple

from common import add_common_args, configure_logging, run_local


def docker_prune_containers_local(dry_run: bool = False, timeout_sec: int = 120) -> Tuple[int, str, str]:
    """Prune stopped Docker containers locally. Returns (exit_code, stdout, stderr)."""
    cmd = "docker container prune -f" if not dry_run else "docker container prune"
    return run_local(cmd, timeout_sec=timeout_sec)


def main() -> int:
    parser = argparse.ArgumentParser(description="Prune stopped Docker containers locally.")
    add_common_args(parser)
    parser.add_argument("--dry-run", action="store_true", help="Show what would be removed")
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)
    code, out, err = docker_prune_containers_local(dry_run=args.dry_run)
    if code != 0:
        print(err or out, file=sys.stderr)
        return 1
    if out.strip():
        print(out.rstrip())
    return 0


if __name__ == "__main__":
    sys.exit(main())
