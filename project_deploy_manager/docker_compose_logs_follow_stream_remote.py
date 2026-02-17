#!/usr/bin/env python3
"""Stream docker compose logs from remote host to local stdout until interrupted."""

import argparse
import select
import sys
import time

from common import (
    add_common_args,
    add_remote_ssh_args,
    configure_logging,
    get_password,
    ssh_connect,
)


def main() -> int:
    parser = argparse.ArgumentParser(description="Stream docker compose logs from remote (Ctrl+C to stop).")
    add_remote_ssh_args(parser)
    add_common_args(parser)
    parser.add_argument("project_dir", nargs="?", default=".", metavar="DIR", help="Project dir on remote")
    parser.add_argument("-f", "--file", default=None, help="Compose file on remote")
    parser.add_argument("service", nargs="?", default=None, help="Service name (optional)")
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    password = get_password(args)
    if not password:
        print("Error: password required via argument or SSH_PASSWORD env var", file=sys.stderr)
        return 2

    dir_esc = args.project_dir.replace("'", "'\"'\"'")
    cmd = "cd '%s' && docker compose logs -f" % dir_esc
    if args.file:
        file_esc = args.file.replace("'", "'\"'\"'")
        cmd = "cd '%s' && docker compose -f '%s' logs -f" % (dir_esc, file_esc)
    if args.service:
        svc_esc = args.service.replace("'", "'\"'\"'")
        cmd += " '%s'" % svc_esc

    try:
        client = ssh_connect(
            args.host, args.username, password, port=args.port, timeout=args.timeout
        )
    except Exception as e:
        print("SSH failed: %s" % e, file=sys.stderr)
        return 1

    try:
        chan = client.get_transport().open_session()
        chan.exec_command(cmd)
        while True:
            if chan.recv_ready():
                sys.stdout.write(chan.recv(4096).decode("utf-8", errors="replace"))
                sys.stdout.flush()
            if chan.recv_stderr_ready():
                sys.stderr.write(chan.recv_stderr(4096).decode("utf-8", errors="replace"))
                sys.stderr.flush()
            if chan.exit_status_ready():
                break
            time.sleep(0.05)
        return chan.recv_exit_status()
    except KeyboardInterrupt:
        return 0
    finally:
        client.close()


if __name__ == "__main__":
    sys.exit(main())
