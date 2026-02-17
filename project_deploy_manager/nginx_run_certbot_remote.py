#!/usr/bin/env python3
"""Run certbot for nginx on remote host via SSH (obtain/renew certs). Exit 0 on success."""

import argparse
import sys

from common import (
    add_common_args,
    add_remote_ssh_args,
    configure_logging,
    ensure_certbot_remote,
    get_password,
    run_remote_stream,
    ssh_connect,
)


def main() -> int:
    parser = argparse.ArgumentParser(description="Run certbot for nginx on remote host.")
    add_remote_ssh_args(parser)
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

    password = get_password(args)
    if not password:
        print("Error: password required via argument or SSH_PASSWORD env var", file=sys.stderr)
        return 2

    domain_args = " ".join(
        "-d '%s'" % d.replace("'", "'\"'\"'") for d in args.domain
    )
    cmd = "sudo certbot --nginx " + domain_args
    if args.email:
        cmd += " --email '%s'" % args.email.replace("'", "'\"'\"'")
    if args.dry_run:
        cmd += " --dry-run"
    if args.agree_tos:
        cmd += " --agree-tos"
    if args.non_interactive:
        cmd += " --non-interactive"

    try:
        client = ssh_connect(
            args.host, args.username, password, port=args.port, timeout=args.timeout
        )
    except Exception as e:
        print("SSH failed: %s" % e, file=sys.stderr)
        return 1

    try:
        if not ensure_certbot_remote(client):
            print("Error: certbot not installed on remote and install failed", file=sys.stderr)
            return 1

        code, out, err = run_remote_stream(client, cmd, timeout_sec=300)
    finally:
        client.close()

    if code != 0:
        if out.strip() or err.strip():
            print(err or out, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
