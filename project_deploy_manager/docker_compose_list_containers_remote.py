#!/usr/bin/env python3
"""List all containers in a Docker Compose project on remote host as a table (ID, service, ports, etc.)."""

import argparse
import json
import sys

from common import (
    add_common_args,
    add_remote_ssh_args,
    configure_logging,
    get_password,
    run_remote,
    ssh_connect,
)


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
        description="List all containers in a Docker Compose project on remote host in table format."
    )
    add_remote_ssh_args(parser)
    add_common_args(parser)
    parser.add_argument("project_dir", nargs="?", default=".", metavar="DIR", help="Project dir on remote")
    parser.add_argument("-f", "--file", default=None, help="Compose file on remote")
    parser.add_argument("-a", "--all", action="store_true", help="Show all containers including stopped")
    parser.add_argument("--raw", action="store_true", help="Print raw docker compose ps output instead of table")
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    password = get_password(args)
    if not password:
        print("Error: password required via argument or SSH_PASSWORD env var", file=sys.stderr)
        return 2

    dir_esc = args.project_dir.replace("'", "'\"'\"'")
    compose_cmd = "docker compose"
    try:
        client = ssh_connect(
            args.host, args.username, password, port=args.port, timeout=args.timeout
        )
        code, _, _ = run_remote(client, "docker compose version 2>/dev/null", timeout_sec=5)
        if code != 0:
            compose_cmd = "docker-compose"
        client.close()
    except Exception as e:
        print("SSH failed: %s" % e, file=sys.stderr)
        return 1

    ps_args = " ps -a --format json" if args.all else " ps --format json"
    cmd = "cd '%s' && %s" % (dir_esc, compose_cmd)
    if args.file:
        cmd += " -f '%s'" % args.file.replace("'", "'\"'\"'")
    cmd += ps_args

    try:
        client = ssh_connect(
            args.host, args.username, password, port=args.port, timeout=args.timeout
        )
    except Exception as e:
        print("SSH failed: %s" % e, file=sys.stderr)
        return 1

    try:
        if args.raw:
            cmd_raw = cmd.replace(" --format json", " -a" if args.all else "")
            code, out, err = run_remote(client, cmd_raw, timeout_sec=30)
            if code != 0:
                print(err or out, file=sys.stderr)
                return 1
            print((out or "").rstrip())
            return 0

        code, out, err = run_remote(client, cmd, timeout_sec=30)
        if code != 0:
            cmd_raw = cmd.replace(" --format json", " -a" if args.all else "")
            code, out, err = run_remote(client, cmd_raw, timeout_sec=30)
            if code != 0:
                print(err or out, file=sys.stderr)
                return 1
            print((out or "").rstrip())
            return 0

        # Parse JSON (one object per line)
        rows = []
        for line in (out or "").strip().splitlines():
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
    finally:
        client.close()


if __name__ == "__main__":
    sys.exit(main())
