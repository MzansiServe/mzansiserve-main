#!/usr/bin/env python3
"""Deploy a local config file to remote nginx path via SFTP, validate and reload nginx on remote. Exit 0 on success."""

import argparse
import os
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
    parser = argparse.ArgumentParser(description="Deploy nginx config to remote host, validate and reload.")
    add_remote_ssh_args(parser)
    add_common_args(parser)
    parser.add_argument(
        "source",
        help="Local path to config file to deploy",
    )
    parser.add_argument(
        "target",
        nargs="?",
        default="/etc/nginx/nginx.conf",
        metavar="PATH",
        help="Target nginx config path on remote (default: /etc/nginx/nginx.conf)",
    )
    parser.add_argument(
        "--no-reload",
        action="store_true",
        help="Only copy and validate; do not reload nginx",
    )
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    source = os.path.abspath(os.path.expanduser(args.source))
    if not os.path.isfile(source):
        print("Error: source is not a file: %s" % source, file=sys.stderr)
        return 1

    password = get_password(args)
    if not password:
        print("Error: password required via argument or SSH_PASSWORD env var", file=sys.stderr)
        return 2

    target_esc = args.target.replace("'", "'\"'\"'")
    remote_tmp = "/tmp/nginx_conf_%s" % os.path.basename(args.target)

    try:
        client = ssh_connect(
            args.host, args.username, password, port=args.port, timeout=args.timeout
        )
    except Exception as e:
        print("SSH failed: %s" % e, file=sys.stderr)
        return 1

    try:
        sftp = client.open_sftp()
        try:
            sftp.put(source, remote_tmp)
        finally:
            sftp.close()

        remote_tmp_esc = remote_tmp.replace("'", "'\"'\"'")
        code, out, err = run_remote(
            client, "sudo cp '%s' '%s'" % (remote_tmp_esc, target_esc), timeout_sec=10
        )
        if code != 0:
            run_remote(client, "rm -f '%s'" % remote_tmp_esc, timeout_sec=5)
            print(err or out, file=sys.stderr)
            return 1
        run_remote(client, "rm -f '%s'" % remote_tmp_esc, timeout_sec=5)

        code, out, err = run_remote(client, "sudo nginx -t", timeout_sec=10)
        if code != 0:
            print(err or out, file=sys.stderr)
            return 1

        if args.no_reload:
            if args.verbose:
                print("Config valid; not reloading (--no-reload)", file=sys.stderr)
            return 0

        code, out, err = run_remote(client, "sudo systemctl reload nginx", timeout_sec=10)
        if code != 0:
            code, out, err = run_remote(client, "sudo service nginx reload", timeout_sec=10)
        if code != 0:
            print(err or out, file=sys.stderr)
            return 1
        if out.strip() and args.verbose:
            print(out.strip(), file=sys.stderr)
        return 0
    finally:
        client.close()


if __name__ == "__main__":
    sys.exit(main())
