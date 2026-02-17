#!/usr/bin/env python3
"""Report memory usage on a remote host via SSH (e.g. free -h). Exit 0 if within thresholds, else non-zero."""

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


def check_disk_memory_remote(
    host: str,
    username: str,
    password: str,
    threshold_pct: Optional[int] = None,
    port: int = 22,
    timeout: float = 10.0,
    timeout_sec: int = 30,
) -> Tuple[int, str, str]:
    """Run free -h on remote host. Returns (exit_code, stdout, stderr). Exit 1 if threshold exceeded; 2 if password missing."""
    client = ssh_connect(host, username, password, port=port, timeout=timeout)
    try:
        code, out, err = run_remote(client, "free -h", timeout_sec=timeout_sec)
        if code != 0:
            return 1, out, err or out
        if threshold_pct is not None:
            code2, out2, _ = run_remote(client, "free", timeout_sec=10)
            if code2 == 0:
                for line in out2.strip().splitlines():
                    if line.strip().startswith("Mem:"):
                        parts = line.split()
                        if len(parts) >= 3:
                            try:
                                total = int(parts[1])
                                used = int(parts[2])
                                if total > 0 and (100 * used // total) >= threshold_pct:
                                    return 1, out, "Threshold exceeded: use%% >= %s" % threshold_pct
                            except (ValueError, IndexError):
                                pass
                        break
        return 0, out.rstrip(), err
    finally:
        client.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="Check memory usage on remote host (free -h).")
    add_remote_ssh_args(parser)
    add_common_args(parser)
    parser.add_argument("--threshold-pct", type=int, default=None, metavar="PCT", help="Exit 1 if use%% >= PCT")
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)
    password = get_password(args)
    if not password:
        print("Error: password required via argument or SSH_PASSWORD env var", file=sys.stderr)
        return 2
    try:
        code, out, err = check_disk_memory_remote(
            args.host, args.username, password,
            threshold_pct=args.threshold_pct,
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
