#!/usr/bin/env python3
"""Install nginx on the remote host via SSH (apt/yum/dnf as per OS). Exit 0 on success."""

import argparse
import sys

from common import (
    add_common_args,
    add_remote_ssh_args,
    configure_logging,
    get_password,
    run_remote,
    run_remote_stream,
    ssh_connect,
)


def main() -> int:
    parser = argparse.ArgumentParser(description="Install nginx on remote host.")
    add_remote_ssh_args(parser)
    add_common_args(parser)
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    password = get_password(args)
    if not password:
        print("Error: password required via argument or SSH_PASSWORD env var", file=sys.stderr)
        return 2

    try:
        client = ssh_connect(
            args.host, args.username, password, port=args.port, timeout=args.timeout
        )
    except Exception as e:
        print("SSH failed: %s" % e, file=sys.stderr)
        return 1

    try:
        code, out, err = run_remote(client, "command -v dnf", timeout_sec=5)
        if code == 0 and out.strip():
            code, out, err = run_remote_stream(client, "sudo dnf install -y nginx", timeout_sec=120)
        else:
            code, out, err = run_remote(client, "command -v yum", timeout_sec=5)
            if code == 0 and out.strip():
                code, out, err = run_remote_stream(client, "sudo yum install -y nginx", timeout_sec=120)
            else:
                code, out, err = run_remote_stream(
                    client,
                    "sudo apt-get update && sudo apt-get install -y nginx",
                    timeout_sec=120,
                )

        if code != 0:
            if out.strip() or err.strip():
                print(err or out, file=sys.stderr)
            return 1
        return 0
    finally:
        client.close()


if __name__ == "__main__":
    sys.exit(main())
