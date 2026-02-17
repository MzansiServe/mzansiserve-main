#!/usr/bin/env python3
"""Report size/usage of volumes used by the compose project locally (docker system df -v). Exit 0 on success."""

import argparse
import os
import shlex
import sys

from common import add_common_args, configure_logging, run_local


def main() -> int:
    parser = argparse.ArgumentParser(description="Report compose project volume stats locally.")
    add_common_args(parser)
    parser.add_argument("--project-dir", default=".", metavar="DIR", help="Project directory (default: .)")
    parser.add_argument("-f", "--file", default=None, metavar="FILE", help="Compose file path")
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    project_dir = os.path.abspath(args.project_dir)
    # docker system df -v shows volumes; we run from project dir so compose context is correct
    cmd_parts = ["cd", shlex.quote(project_dir), "&&", "docker", "compose"]
    if args.file:
        cmd_parts.extend(["-f", shlex.quote(args.file)])
    cmd_parts.extend(["run", "--rm", "busybox", "df", "-h", "/"] if False else [])  # no busybox required
    # Simpler: just docker system df -v for volume usage
    cmd = "cd %s && docker system df -v" % shlex.quote(project_dir)
    code, out, err = run_local(cmd, timeout_sec=30)
    if code != 0:
        # Fallback: docker volume ls
        code, out, err = run_local("docker volume ls", timeout_sec=30)
    if code != 0:
        print(err or out, file=sys.stderr)
        return 1
    print(out.rstrip())
    return 0


if __name__ == "__main__":
    sys.exit(main())
