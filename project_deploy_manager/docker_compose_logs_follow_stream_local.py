#!/usr/bin/env python3
"""Run docker compose logs -f (optionally for a service); stream output to stdout until interrupted."""

import argparse
import os
import shlex
import subprocess
import sys

from common import add_common_args, configure_logging


def main() -> int:
    parser = argparse.ArgumentParser(description="Stream docker compose logs locally (Ctrl+C to stop).")
    add_common_args(parser)
    parser.add_argument("--project-dir", default=".", metavar="DIR", help="Project directory (default: .)")
    parser.add_argument("-f", "--file", default=None, metavar="FILE", help="Compose file path")
    parser.add_argument("service", nargs="?", default=None, help="Service name (optional; all if omitted)")
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    project_dir = os.path.abspath(args.project_dir)
    cmd_parts = ["cd", shlex.quote(project_dir), "&&", "docker", "compose"]
    if args.file:
        cmd_parts.extend(["-f", shlex.quote(args.file)])
    cmd_parts.extend(["logs", "-f"])
    if args.service:
        cmd_parts.append(shlex.quote(args.service))
    cmd = " ".join(cmd_parts)

    try:
        proc = subprocess.run(cmd, shell=True)
        return proc.returncode
    except KeyboardInterrupt:
        return 0


if __name__ == "__main__":
    sys.exit(main())
