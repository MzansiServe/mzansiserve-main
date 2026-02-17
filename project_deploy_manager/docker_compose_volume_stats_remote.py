#!/usr/bin/env python3
"""Report volume stats for compose project on remote host via SSH. Exit 0 on success."""

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
    parser = argparse.ArgumentParser(description="Report compose volume stats on remote host.")
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
    cmd = "cd '%s' && docker system df -v" % dir_esc
    try:
        client = ssh_connect(
            args.host, args.username, password, port=args.port, timeout=args.timeout
        )
    except Exception as e:
        print("SSH failed: %s" % e, file=sys.stderr)
        return 1
    try:
        code, out, err = run_remote(client, cmd, timeout_sec=30)
        if code != 0:
            code, out, err = run_remote(client, "cd '%s' && docker volume ls" % dir_esc, timeout_sec=30)
    finally:
        client.close()
    if code != 0:
        print(err or out, file=sys.stderr)
        return 1
    print(out.rstrip())
    return 0


if __name__ == "__main__":
    sys.exit(main())
