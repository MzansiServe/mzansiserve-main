#!/usr/bin/env python3
"""Reboot the local machine (e.g. systemctl reboot). Exit 0 when reboot is triggered."""

import argparse
import sys
from typing import Tuple

from common import add_common_args, configure_logging, run_local


def restart_host_local(delay_sec: int = 0, dry_run: bool = False) -> Tuple[int, str, str]:
    """Trigger local reboot. Returns (exit_code, stdout, stderr). dry_run: only return 0 and message."""
    if dry_run:
        cmd = "systemctl reboot" if delay_sec <= 0 else "shutdown -r +%d" % (delay_sec // 60)
        return 0, "Would run: %s" % cmd, ""
    if delay_sec > 0:
        return run_local("shutdown -r +%d" % (delay_sec // 60), timeout_sec=10)
    return run_local("systemctl reboot", timeout_sec=5)


def main() -> int:
    parser = argparse.ArgumentParser(description="Reboot the local machine.")
    add_common_args(parser)
    parser.add_argument("--delay", type=int, default=0, metavar="SEC", help="Delay reboot by SEC seconds")
    parser.add_argument("--dry-run", action="store_true", help="Print command only, do not reboot")
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)
    code, out, err = restart_host_local(delay_sec=args.delay, dry_run=args.dry_run)
    if out and args.dry_run:
        print(out)
    if code != 0:
        print(err or out, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
