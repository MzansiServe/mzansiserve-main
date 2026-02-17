#!/usr/bin/env python3
"""Stream nginx logs from remote host to local stdout (tail -f). Ctrl+C to stop."""

import argparse
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
    parser = argparse.ArgumentParser(description="Stream nginx logs from remote (Ctrl+C to stop).")
    add_remote_ssh_args(parser)
    add_common_args(parser)
    parser.add_argument(
        "--log",
        choices=("access", "error", "both"),
        default="both",
        help="Which log to stream (default: both)",
    )
    parser.add_argument(
        "--log-dir",
        default="/var/log/nginx",
        metavar="DIR",
        help="Nginx log directory on remote (default: /var/log/nginx)",
    )
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    password = get_password(args)
    if not password:
        print("Error: password required via argument or SSH_PASSWORD env var", file=sys.stderr)
        return 2

    log_dir_esc = args.log_dir.replace("'", "'\"'\"'")
    if args.log == "access":
        cmd = "sudo tail -f '%s/access.log'" % log_dir_esc
    elif args.log == "error":
        cmd = "sudo tail -f '%s/error.log'" % log_dir_esc
    else:
        cmd = "sudo tail -f '%s/access.log' '%s/error.log'" % (log_dir_esc, log_dir_esc)

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
