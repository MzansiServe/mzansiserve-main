#!/usr/bin/env python3
"""Report disk usage on a remote host via SSH (e.g. df -h). Exit 0 if within thresholds, else non-zero."""

import argparse
import sys
from typing import Optional, Tuple

from common import (
    add_common_args,
    add_remote_ssh_args,
    configure_logging,
    get_password,
    run_remote,
    ssh_connect,
)

DEFAULT_USE_PCT_THRESHOLD = 95


def check_disk_space_remote(
    host: str,
    username: str,
    password: str,
    threshold: Optional[int] = None,
    no_header: bool = False,
    port: int = 22,
    timeout: float = 10.0,
    timeout_sec: int = 30,
) -> Tuple[int, str, str]:
    """Run df -h on remote host. Returns (exit_code, stdout, stderr). Exit 1 if threshold exceeded; 2 if password missing."""
    client = ssh_connect(host, username, password, port=port, timeout=timeout)
    try:
        code, out, err = run_remote(client, "df -h", timeout_sec=timeout_sec)
    finally:
        client.close()
    if code != 0:
        return 1, out, err or out
    lines = out.strip().splitlines()
    if not lines:
        return 0, out, err
    if threshold is not None and len(lines) > 1:
        for line in lines[1:]:
            parts = line.split()
            if len(parts) >= 5:
                use_pct_str = parts[4].replace("%", "")
                try:
                    if int(use_pct_str) >= threshold:
                        return 1, out, "Threshold exceeded: use%% >= %s" % threshold
                except ValueError:
                    pass
    result = "\n".join(lines[1:]) if no_header and lines else out.rstrip()
    return 0, result, err


def main() -> int:
    parser = argparse.ArgumentParser(description="Check disk space on remote host (df -h).")
    add_remote_ssh_args(parser)
    add_common_args(parser)
    parser.add_argument("--threshold", type=int, default=None, metavar="PCT", help="Exit 1 if any use%% >= PCT")
    parser.add_argument("--no-header", action="store_true", help="Omit header line from output")
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)
    password = get_password(args)
    if not password:
        print("Error: password required via argument or SSH_PASSWORD env var", file=sys.stderr)
        return 2
    try:
        code, out, err = check_disk_space_remote(
            args.host, args.username, password,
            threshold=args.threshold, no_header=args.no_header,
            port=args.port, timeout=args.timeout,
        )
    except Exception as e:
        print("SSH failed: %s" % e, file=sys.stderr)
        return 1
    if code != 0:
        print(err or out, file=sys.stderr)
        return code
    print(out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
