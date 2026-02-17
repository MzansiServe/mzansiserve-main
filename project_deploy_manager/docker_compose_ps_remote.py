#!/usr/bin/env python3
"""Run docker compose ps on remote host via SSH. Print service status. Exit 0 on success."""

import argparse
import sys

from common import (
    add_common_args,
    add_remote_ssh_args,
    configure_logging,
    get_password,
    run_remote,
    ssh_connect,
)


def main() -> int:
    parser = argparse.ArgumentParser(description="Run docker compose ps on remote host.")
    add_remote_ssh_args(parser)
    add_common_args(parser)
    parser.add_argument("project_dir", nargs="?", default=".", metavar="DIR", help="Project dir on remote")
    parser.add_argument("-f", "--file", default=None, help="Compose file on remote")
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    password = get_password(args)
    if not password:
        print("Error: password required via argument or SSH_PASSWORD env var", file=sys.stderr)
        return 2

    dir_esc = args.project_dir.replace("'", "'\"'\"'")
    cmd = "cd '%s' && docker compose ps" % dir_esc
    if args.file:
        file_esc = args.file.replace("'", "'\"'\"'")
        cmd = "cd '%s' && docker compose -f '%s' ps" % (dir_esc, file_esc)

    try:
        client = ssh_connect(
            args.host, args.username, password, port=args.port, timeout=args.timeout
        )
    except Exception as e:
        print("SSH failed: %s" % e, file=sys.stderr)
        return 1
    try:
        code, out, err = run_remote(client, cmd, timeout_sec=30)
    finally:
        client.close()
    if code != 0:
        print(err or out, file=sys.stderr)
        return 1
    print(out.rstrip())
    return 0


if __name__ == "__main__":
    sys.exit(main())
