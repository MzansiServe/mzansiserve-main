#!/usr/bin/env python3
"""Run docker compose up -d in the project directory. Exit 0 on success."""

import argparse
import os
import shlex
import sys

from common import add_common_args, configure_logging, run_local


def main() -> int:
    parser = argparse.ArgumentParser(description="Run docker compose up -d locally.")
    add_common_args(parser)
    parser.add_argument(
        "--project-dir",
        default=".",
        metavar="DIR",
        help="Project directory containing compose file (default: current dir)",
    )
    parser.add_argument(
        "-f",
        "--file",
        default=None,
        metavar="FILE",
        help="Compose file path (default: project-dir/docker-compose.yml)",
    )
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    project_dir = os.path.abspath(args.project_dir)
    cmd_parts = ["cd", shlex.quote(project_dir), "&&", "docker", "compose"]
    if args.file:
        cmd_parts.extend(["-f", shlex.quote(args.file)])
    cmd_parts.extend(["up", "-d"])
    cmd = " ".join(cmd_parts)

    code, out, err = run_local(cmd, timeout_sec=300)
    if code != 0:
        print(err or out, file=sys.stderr)
        return 1
    if out.strip() and args.verbose:
        print(out.strip(), file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
