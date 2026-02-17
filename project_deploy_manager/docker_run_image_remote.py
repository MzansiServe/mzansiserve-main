#!/usr/bin/env python3
"""Run a Docker container from an image on the remote host via SSH. Exit 0 on success."""

import argparse
import shlex
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
    parser = argparse.ArgumentParser(
        description="Run a Docker container from an image on the remote host."
    )
    add_remote_ssh_args(parser)
    add_common_args(parser)
    parser.add_argument("image", help="Image reference (e.g. myapp:latest or nginx:alpine)")
    parser.add_argument(
        "-d",
        "--detach",
        action="store_true",
        help="Run container in background",
    )
    parser.add_argument("--name", default=None, metavar="NAME", help="Container name")
    parser.add_argument(
        "-p",
        "--publish",
        action="append",
        default=[],
        metavar="SPEC",
        help="Publish port (e.g. 8080:80); can repeat",
    )
    parser.add_argument(
        "-e",
        "--env",
        action="append",
        default=[],
        metavar="VAR=VAL",
        help="Environment variable; can repeat",
    )
    parser.add_argument(
        "--rm",
        action="store_true",
        help="Remove container when it exits",
    )
    parser.add_argument(
        "extra",
        nargs="*",
        metavar="EXTRA",
        help="Extra args for docker run (e.g. -v /data:/app)",
    )
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    password = get_password(args)
    if not password:
        print("Error: password required via argument or SSH_PASSWORD env var", file=sys.stderr)
        return 2

    parts = ["docker", "run"]
    if args.detach:
        parts.append("-d")
    if args.name:
        parts.extend(["--name", shlex.quote(args.name)])
    for spec in args.publish:
        parts.extend(["-p", shlex.quote(spec)])
    for ev in args.env:
        parts.extend(["-e", shlex.quote(ev)])
    if args.rm:
        parts.append("--rm")
    for x in args.extra:
        parts.append(shlex.quote(x))
    parts.append(shlex.quote(args.image))

    cmd = " ".join(parts)

    try:
        client = ssh_connect(
            args.host, args.username, password, port=args.port, timeout=args.timeout
        )
    except Exception as e:
        print("SSH failed: %s" % e, file=sys.stderr)
        return 1

    try:
        code, out, err = run_remote(client, cmd, timeout_sec=120)
    finally:
        client.close()

    if code != 0:
        print(err or out, file=sys.stderr)
        return 1
    if out.strip():
        print(out.strip())
    return 0


if __name__ == "__main__":
    sys.exit(main())
