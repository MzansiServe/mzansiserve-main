#!/usr/bin/env python3
"""Copy nginx config from remote host to local (cat over SSH and write locally). Exit 0 on success."""

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
    parser = argparse.ArgumentParser(description="Fetch nginx config from remote host.")
    add_remote_ssh_args(parser)
    add_common_args(parser)
    parser.add_argument(
        "config_path",
        nargs="?",
        default="/etc/nginx/nginx.conf",
        metavar="PATH",
        help="Nginx config path on remote (default: /etc/nginx/nginx.conf)",
    )
    parser.add_argument(
        "-o",
        "--output",
        default=None,
        metavar="FILE",
        help="Write config to local file (default: print to stdout)",
    )
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    password = get_password(args)
    if not password:
        print("Error: password required via argument or SSH_PASSWORD env var", file=sys.stderr)
        return 2

    path_esc = args.config_path.replace("'", "'\"'\"'")
    cmd = "sudo cat '%s'" % path_esc

    try:
        client = ssh_connect(
            args.host, args.username, password, port=args.port, timeout=args.timeout
        )
    except Exception as e:
        print("SSH failed: %s" % e, file=sys.stderr)
        return 1

    try:
        code, out, err = run_remote(client, cmd, timeout_sec=10)
    finally:
        client.close()

    if code != 0:
        print(err or out, file=sys.stderr)
        return 1

    if args.output:
        out_path = os.path.abspath(os.path.expanduser(args.output))
        out_dir = os.path.dirname(out_path)
        
        if out_dir and not os.path.isdir(out_dir):
            try:
                response = input("Directory %s does not exist. Create it? [y/N]: " % out_dir)
                if response.lower() in ("y", "yes"):
                    os.makedirs(out_dir, exist_ok=True)
                    if args.verbose:
                        print("Created directory: %s" % out_dir, file=sys.stderr)
                else:
                    print("Aborted by user", file=sys.stderr)
                    return 1
            except (KeyboardInterrupt, EOFError):
                print("\nAborted by user", file=sys.stderr)
                return 1
        
        try:
            with open(out_path, "w") as f:
                f.write(out)
        except OSError as e:
            print("Error writing file: %s" % e, file=sys.stderr)
            return 1
        if args.verbose:
            print("Fetched %s -> %s" % (args.config_path, out_path), file=sys.stderr)
    else:
        print(out.rstrip())
    return 0


if __name__ == "__main__":
    sys.exit(main())
