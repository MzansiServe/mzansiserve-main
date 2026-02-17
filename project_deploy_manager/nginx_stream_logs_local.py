#!/usr/bin/env python3
"""Stream nginx log file(s) to stdout (tail -f). Optional which log: access, error, or both. Ctrl+C to stop."""

import argparse
import os
import shlex
import subprocess
import sys

from common import add_common_args, configure_logging


def main() -> int:
    parser = argparse.ArgumentParser(description="Stream nginx logs locally (Ctrl+C to stop).")
    add_common_args(parser)
    parser.add_argument(
        "--log",
        choices=("access", "error", "both"),
        default="both",
        help="Which log to stream (default: both)",
    )
    parser.add_argument(
        "--log-dir",
        default="/var/log/nginx",
        metavar="DIR",
        help="Nginx log directory (default: /var/log/nginx)",
    )
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    log_dir = os.path.expanduser(args.log_dir)
    if args.log == "access":
        paths = [os.path.join(log_dir, "access.log")]
    elif args.log == "error":
        paths = [os.path.join(log_dir, "error.log")]
    else:
        paths = [
            os.path.join(log_dir, "access.log"),
            os.path.join(log_dir, "error.log"),
        ]

    cmd_parts = ["tail", "-f"]
    for p in paths:
        cmd_parts.append(shlex.quote(p))
    cmd = " ".join(cmd_parts)

    try:
        proc = subprocess.run(cmd, shell=True)
        return proc.returncode
    except KeyboardInterrupt:
        return 0


if __name__ == "__main__":
    sys.exit(main())
