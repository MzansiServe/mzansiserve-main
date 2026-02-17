#!/usr/bin/env python3
"""Read local nginx config and print or save to a given path. Exit 0 on success."""

import argparse
import os
import shlex
import sys

from common import add_common_args, configure_logging, run_local


def main() -> int:
    parser = argparse.ArgumentParser(description="Read local nginx config and print or save.")
    add_common_args(parser)
    parser.add_argument(
        "config_path",
        nargs="?",
        default="/etc/nginx/nginx.conf",
        metavar="PATH",
        help="Nginx config path (default: /etc/nginx/nginx.conf)",
    )
    parser.add_argument(
        "-o",
        "--output",
        default=None,
        metavar="FILE",
        help="Write config to file (default: print to stdout)",
    )
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    path_esc = shlex.quote(args.config_path)
    code, out, err = run_local("cat %s" % path_esc, timeout_sec=10)
    if code != 0:
        code, out, err = run_local("sudo cat %s" % path_esc, timeout_sec=10)
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
            print("Wrote %s -> %s" % (args.config_path, out_path), file=sys.stderr)
    else:
        print(out.rstrip())
    return 0


if __name__ == "__main__":
    sys.exit(main())
