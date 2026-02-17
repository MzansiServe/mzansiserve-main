#!/usr/bin/env python3
"""
Run a DNS lookup locally (dig, or getent hosts if dig is not installed).

Use as a module:
    from dns_lookup_local import dns_lookup_local
    exit_code, stdout, stderr = dns_lookup_local("example.com")
    exit_code, stdout, stderr = dns_lookup_local("example.com", record_type="MX", short=True)
"""

import argparse
import shlex
import sys
from typing import Optional, Tuple

from common import add_common_args, configure_logging, logger, run_local


def _getent_short(out: str) -> str:
    """From getent hosts output, return one IP per line (first column)."""
    lines = []
    for line in out.strip().splitlines():
        parts = line.split()
        if parts:
            lines.append(parts[0])
    return "\n".join(lines) if lines else out


def dns_lookup_local(
    name: str,
    record_type: str = "A",
    server: Optional[str] = None,
    short: bool = False,
    timeout_sec: int = 15,
    log: Optional[object] = None,
) -> Tuple[int, str, str]:
    """
    Run a DNS lookup locally (dig, or getent hosts if dig is missing).

    :param name: Hostname or domain to look up (e.g. example.com).
    :param record_type: Record type: A, AAAA, MX, NS, TXT, CNAME, SOA, etc. (default A).
    :param server: Resolver to use (e.g. 8.8.8.8 or ns1.example.com), or None for default.
    :param short: If True, return short output only (dig +short / getent first column).
    :param timeout_sec: Command timeout in seconds.
    :param log: Optional logger (e.g. from common.logger).
    :return: (exit_code, stdout, stderr). exit_code 0 on success.
    """
    log = log or logger
    rtype = (record_type or "A").upper()
    parts = ["dig"]
    if server:
        parts.append("@" + server)
    parts.append(name)
    parts.append(record_type)
    if short:
        parts.append("+short")
    cmd = " ".join(shlex.quote(p) for p in parts)

    log.debug("dns_lookup_local: running %s", cmd)
    code, out, err = run_local(cmd, timeout_sec=timeout_sec, log=log)
    if code == 0:
        log.debug("dns_lookup_local: dig succeeded for name=%s type=%s", name, record_type)
        return 0, out.rstrip(), err

    # Fallback: if dig not found (127) and A/AAAA, try getent hosts
    if (code == 127 or "command not found" in (err or "").lower()) and rtype in ("A", "AAAA"):
        getent_cmd = "getent hosts " + shlex.quote(name)
        log.info("dig not found or failed (exit %s), falling back to getent hosts", code)
        log.debug("dns_lookup_local: running %s", getent_cmd)
        gcode, gout, gerr = run_local(getent_cmd, timeout_sec=timeout_sec, log=log)
        if gcode == 0 and gout.strip():
            log.debug("dns_lookup_local: getent succeeded for name=%s", name)
            if short:
                return 0, _getent_short(gout), gerr
            return 0, gout.rstrip(), gerr
        if gcode != 0:
            log.warning("dns_lookup_local: getent failed exit=%s name=%s stderr=%s", gcode, name, gerr or gout)
            return 1, gout, gerr or gout

    log.warning("dns_lookup_local: lookup failed name=%s type=%s exit=%s stderr=%s", name, record_type, code, err or out)
    return code, out, err


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Run DNS lookup locally (dig, or getent hosts if dig is missing)."
    )
    add_common_args(parser)
    parser.add_argument("name", help="Hostname or domain to look up (e.g. example.com)")
    parser.add_argument(
        "--type",
        default="A",
        metavar="TYPE",
        help="Record type: A, AAAA, MX, NS, TXT, CNAME, SOA, etc. (default: A)",
    )
    parser.add_argument(
        "-s",
        "--server",
        default=None,
        metavar="SERVER",
        help="Resolver to use (e.g. 8.8.8.8 or ns1.example.com)",
    )
    parser.add_argument(
        "--short",
        action="store_true",
        help="Short output only (dig +short)",
    )
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    code, out, err = dns_lookup_local(
        args.name,
        record_type=args.type,
        server=args.server,
        short=args.short,
    )
    if code != 0:
        logger.warning("dns lookup failed: %s", (err or out).strip() or "unknown error")
        print(err or out, file=sys.stderr)
        return code
    logger.debug("dns lookup succeeded: name=%s", args.name)
    print(out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
