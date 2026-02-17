#!/usr/bin/env python3
"""Run certbot for nginx locally (obtain/renew certs). Domain and options as args. Exit 0 on success."""

import argparse
import shlex
import sys

from common import add_common_args, configure_logging, ensure_certbot_local, run_local


def main() -> int:
    parser = argparse.ArgumentParser(description="Run certbot for nginx locally.")
    add_common_args(parser)
    parser.add_argument(
        "domain",
        nargs="+",
        metavar="DOMAIN",
        help="Domain(s) for certificate (e.g. example.com www.example.com)",
    )
    parser.add_argument(
        "--email",
        default=None,
        metavar="EMAIL",
        help="Email for certbot registration",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Obtain a test certificate (no real cert)",
    )
    parser.add_argument(
        "--agree-tos",
        action="store_true",
        help="Agree to ToS (required for non-interactive)",
    )
    parser.add_argument(
        "--non-interactive",
        action="store_true",
        help="Run non-interactively",
    )
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    if not ensure_certbot_local():
        print("Error: certbot not installed and install failed", file=sys.stderr)
        return 1

    parts = ["sudo", "certbot", "--nginx"]
    for d in args.domain:
        parts.extend(["-d", shlex.quote(d)])
    if args.email:
        parts.extend(["--email", shlex.quote(args.email)])
    if args.dry_run:
        parts.append("--dry-run")
    if args.agree_tos:
        parts.append("--agree-tos")
    if args.non_interactive:
        parts.append("--non-interactive")
    cmd = " ".join(parts)

    code, out, err = run_local(cmd, timeout_sec=300)
    if code != 0:
        print(err or out, file=sys.stderr)
        return 1
    if out.strip():
        print(out.strip())
    return 0


if __name__ == "__main__":
    sys.exit(main())
