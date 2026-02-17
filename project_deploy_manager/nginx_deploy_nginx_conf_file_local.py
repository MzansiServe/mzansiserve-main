#!/usr/bin/env python3
"""Deploy a local config file to nginx config path, validate (nginx -t) and reload if valid. Exit 0 on success."""

import argparse
import os
import shlex
import sys

from common import add_common_args, configure_logging, run_local


def main() -> int:
    parser = argparse.ArgumentParser(description="Deploy nginx config locally, validate and reload.")
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
        help="Target nginx config path (default: /etc/nginx/nginx.conf)",
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

    target_esc = shlex.quote(args.target)
    source_esc = shlex.quote(source)
    code, out, err = run_local("sudo cp %s %s" % (source_esc, target_esc), timeout_sec=10)
    if code != 0:
        print(err or out, file=sys.stderr)
        return 1

    code, out, err = run_local("nginx -t", timeout_sec=10)
    if code != 0:
        print(err or out, file=sys.stderr)
        return 1

    if args.no_reload:
        if args.verbose:
            print("Config valid; not reloading (--no-reload)", file=sys.stderr)
        return 0

    code, out, err = run_local("systemctl reload nginx", timeout_sec=10)
    if code != 0:
        code, out, err = run_local("service nginx reload", timeout_sec=10)
    if code != 0:
        print(err or out, file=sys.stderr)
        return 1
    if out.strip() and args.verbose:
        print(out.strip(), file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
