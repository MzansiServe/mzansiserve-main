#!/usr/bin/env python3
"""Run initial-setup CLI commands inside the app container on remote host (create-admin, populate-countries, populate-categories, populate-services)."""

import argparse
import sys

from common import (
    add_common_args,
    add_remote_ssh_args,
    configure_logging,
    get_password,
    run_remote,
    run_remote_stream,
    ssh_connect,
)

# Default setup commands (non-interactive). create-admin is optional and requires args.
SETUP_COMMANDS = [
    "populate-countries",
    "populate-categories",
    "populate-services",
]


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Run initial setup CLI commands in the app container on remote host."
    )
    add_remote_ssh_args(parser)
    add_common_args(parser)
    parser.add_argument(
        "project_dir",
        nargs="?",
        default=".",
        metavar="DIR",
        help="Project directory on remote (contains docker-compose.yml)",
    )
    parser.add_argument("-f", "--file", default=None, help="Compose file on remote")
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

    base = "cd '%s' && %s" % (dir_esc, compose_cmd)
    if args.file:
        base += " -f '%s'" % args.file.replace("'", "'\"'\"'")
    exec_prefix = base + " exec -T %s flask cli" % args.service.replace("'", "'\"'\"'")

    skip = set(args.skip)
    commands = []
    if args.admin_email and args.admin_password and args.admin_name:
        commands.append(
            "create-admin --email '%s' --password '%s' --full-name '%s'"
            % (
                args.admin_email.replace("'", "'\"'\"'"),
                args.admin_password.replace("'", "'\"'\"'"),
                args.admin_name.replace("'", "'\"'\"'"),
            )
        )
    for cmd in SETUP_COMMANDS:
        if cmd not in skip:
            commands.append(cmd)

    if not commands:
        print("No commands to run.", file=sys.stderr)
        return 0

    try:
        client = ssh_connect(
            args.host, args.username, password, port=args.port, timeout=args.timeout
        )
    except Exception as e:
        print("SSH failed: %s" % e, file=sys.stderr)
        return 1

    try:
        for cmd in commands:
            full_cmd = "%s %s" % (exec_prefix, cmd)
            print("Running: flask cli %s" % cmd.split()[0], file=sys.stderr)
            code, out, err = run_remote_stream(client, full_cmd, timeout_sec=120)
            if out.strip():
                print(out.strip())
            if code != 0:
                if err.strip():
                    print(err.strip(), file=sys.stderr)
                print("Command failed: flask cli %s" % cmd.split()[0], file=sys.stderr)
                return 1
        return 0
    finally:
        client.close()


if __name__ == "__main__":
    sys.exit(main())
