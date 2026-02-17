#!/usr/bin/env python3
"""Run initial-setup CLI commands inside the app container locally (create-admin, populate-countries, populate-categories, populate-services)."""

import argparse
import os
import shlex
import sys

from common import add_common_args, configure_logging, run_local

SETUP_COMMANDS = [
    "populate-countries",
    "populate-categories",
    "populate-services",
]


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Run initial setup CLI commands in the app container locally."
    )
    add_common_args(parser)
    parser.add_argument(
        "--project-dir",
        default=".",
        metavar="DIR",
        help="Project directory (default: .)",
    )
    parser.add_argument("-f", "--file", default=None, metavar="FILE", help="Compose file")
    parser.add_argument("--service", default="app", help="Service name (default: app)")
    parser.add_argument("--admin-email", default=None, help="Admin email (enables create-admin)")
    parser.add_argument("--admin-password", default=None, help="Admin password (required with --admin-email)")
    parser.add_argument("--admin-name", default=None, help="Admin full name (required with --admin-email)")
    parser.add_argument(
        "--skip",
        action="append",
        default=[],
        metavar="CMD",
        help="Skip a command (e.g. --skip populate-countries). Can be repeated.",
    )
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    project_dir = os.path.abspath(args.project_dir)
    compose_cmd = "docker compose"
    code, _, _ = run_local("docker compose version 2>/dev/null", timeout_sec=5)
    if code != 0:
        compose_cmd = "docker-compose"

    base = "cd %s && %s" % (shlex.quote(project_dir), compose_cmd)
    if args.file:
        base += " -f %s" % shlex.quote(args.file)
    exec_prefix = base + " exec -T %s flask cli" % shlex.quote(args.service)

    skip = set(args.skip)
    commands = []
    if args.admin_email and args.admin_password and args.admin_name:
        commands.append(
            "create-admin --email %s --password %s --full-name %s"
            % (
                shlex.quote(args.admin_email),
                shlex.quote(args.admin_password),
                shlex.quote(args.admin_name),
            )
        )
    for cmd in SETUP_COMMANDS:
        if cmd not in skip:
            commands.append(cmd)

    if not commands:
        print("No commands to run.", file=sys.stderr)
        return 0

    for cmd in commands:
        full_cmd = "%s %s" % (exec_prefix, cmd)
        print("Running: flask cli %s" % cmd.split()[0], file=sys.stderr)
        code, out, err = run_local(full_cmd, timeout_sec=120)
        if out.strip():
            print(out.strip())
        if code != 0:
            if err.strip():
                print(err.strip(), file=sys.stderr)
            print("Command failed: flask cli %s" % cmd.split()[0], file=sys.stderr)
            return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
