#!/usr/bin/env python3
"""List all containers in a Docker Compose project as a table (ID, service, ports, etc.)."""

import argparse
import json
import os
import shlex
import sys

from common import add_common_args, configure_logging, run_local


def _format_table(rows, headers):
    """Format rows as a simple aligned table."""
    if not rows:
        return ""
    col_widths = [len(h) for h in headers]
    for row in rows:
        for i, cell in enumerate(row):
            if i < len(col_widths):
                col_widths[i] = max(col_widths[i], min(len(str(cell)), 48))
    fmt = "  ".join("%%-%ds" % w for w in col_widths)
    lines = [fmt % tuple(h for h in headers)]
    lines.append("-" * (sum(col_widths) + 2 * (len(headers) - 1)))
    for row in rows:
        cells = [str(c)[:48] + ("..." if len(str(c)) > 48 else "") for c in row]
        lines.append(fmt % tuple(cells))
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="List all containers in a Docker Compose project in table format."
    )
    add_common_args(parser)
    parser.add_argument("--project-dir", default=".", metavar="DIR", help="Project directory (default: .)")
    parser.add_argument("-f", "--file", default=None, metavar="FILE", help="Compose file path")
    parser.add_argument("-a", "--all", action="store_true", help="Show all containers including stopped")
    parser.add_argument("--raw", action="store_true", help="Print raw docker compose ps output instead of table")
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    project_dir = os.path.abspath(args.project_dir)
    compose_cmd = "docker compose"
    if not run_local("docker compose version 2>/dev/null", timeout_sec=5)[0] == 0:
        compose_cmd = "docker-compose"

    ps_args = " ps -a --format json" if args.all else " ps --format json"
    cmd = "cd %s && %s" % (shlex.quote(project_dir), compose_cmd)
    if args.file:
        cmd += " -f %s" % shlex.quote(args.file)
    cmd += ps_args

    if args.raw:
        cmd_raw = cmd.replace(" --format json", " -a" if args.all else "")
        code, out, err = run_local(cmd_raw, timeout_sec=30)
        if code != 0:
            print(err or out, file=sys.stderr)
            return 1
        print((out or "").rstrip())
        return 0

    code, out, err = run_local(cmd, timeout_sec=30)
    if code != 0:
        cmd_raw = cmd.replace(" --format json", " -a" if args.all else "")
        code, out, err = run_local(cmd_raw, timeout_sec=30)
        if code != 0:
            print(err or out, file=sys.stderr)
            return 1
        print((out or "").rstrip())
        return 0

    # Parse JSON (one object per line)
    rows = []
    for line in out.strip().splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except json.JSONDecodeError:
            continue
        cid = obj.get("ID", "")[:12]
        name = obj.get("Name", "")
        service = obj.get("Service", "")
        image = obj.get("Image", "")
        state = obj.get("State", "")
        status = obj.get("Status", "")
        ports = obj.get("Ports", "")
        health = obj.get("Health", "")
        if health and health not in (status or ""):
            status = "%s (%s)" % (status, health) if status else health
        rows.append([cid, name, service, image, state, status, ports])

    if not rows:
        print("No containers found.")
        return 0

    headers = ["CONTAINER ID", "NAME", "SERVICE", "IMAGE", "STATE", "STATUS", "PORTS"]
    print(_format_table(rows, headers))
    return 0


if __name__ == "__main__":
    sys.exit(main())
