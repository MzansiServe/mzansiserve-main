#!/usr/bin/env python3
"""Run docker compose ps; print service status (name, state, ports). Exit 0 on success."""

import argparse
import os
import shlex
import sys

from common import add_common_args, configure_logging, run_local


def main() -> int:
    parser = argparse.ArgumentParser(description="Run docker compose ps locally.")
    add_common_args(parser)
    parser.add_argument("--project-dir", default=".", metavar="DIR", help="Project directory (default: .)")
    parser.add_argument("-f", "--file", default=None, metavar="FILE", help="Compose file path")
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    project_dir = os.path.abspath(args.project_dir)
    cmd_parts = ["cd", shlex.quote(project_dir), "&&", "docker", "compose"]
    if args.file:
        cmd_parts.extend(["-f", shlex.quote(args.file)])
    cmd_parts.append("ps")
    code, out, err = run_local(" ".join(cmd_parts), timeout_sec=30)
    if code != 0:
        print(err or out, file=sys.stderr)
        return 1
    print(out.rstrip())
    return 0


if __name__ == "__main__":
    sys.exit(main())
