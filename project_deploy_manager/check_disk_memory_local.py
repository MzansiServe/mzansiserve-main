#!/usr/bin/env python3
"""Report memory usage on the local machine (e.g. free -h). Exit 0 if within thresholds, else non-zero."""

import argparse
import sys
from typing import Optional, Tuple

from common import add_common_args, configure_logging, run_local


def check_disk_memory_local(
    threshold_pct: Optional[int] = None,
    timeout_sec: int = 30,
) -> Tuple[int, str, str]:
    """Run free -h locally. Returns (exit_code, stdout, stderr). Exit 1 if threshold exceeded."""
    code, out, err = run_local("free -h", timeout_sec=timeout_sec)
    if code != 0:
        return 1, out, err or out
    if threshold_pct is not None:
        code2, out2, _ = run_local("free", timeout_sec=10)
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


def main() -> int:
    parser = argparse.ArgumentParser(description="Check memory usage locally (free -h).")
    add_common_args(parser)
    parser.add_argument("--threshold-pct", type=int, default=None, metavar="PCT", help="Exit 1 if use%% >= PCT")
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)
    code, out, err = check_disk_memory_local(threshold_pct=args.threshold_pct)
    if code != 0:
        print(err or out, file=sys.stderr)
        return code
    print(out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
