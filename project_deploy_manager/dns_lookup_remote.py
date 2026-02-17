#!/usr/bin/env python3
"""
Run a DNS lookup on a remote host via SSH (dig, or getent hosts if dig is not installed).

Use as a module:
    from dns_lookup_remote import dns_lookup_remote
    exit_code, stdout, stderr = dns_lookup_remote("192.168.1.1", "root", "pass", "example.com")
    exit_code, stdout, stderr = dns_lookup_remote(
        "192.168.1.1", "root", "pass", "example.com", record_type="MX", short=True
    )
"""

import argparse
import shlex
import sys
from typing import Optional, Tuple

from common import (
    add_common_args,
    add_remote_ssh_args,
    configure_logging,
    get_password,
    logger,
    run_remote,
    ssh_connect,
)


def _getent_short(out: str) -> str:
    """From getent hosts output, return one IP per line (first column)."""
    lines = []
    for line in out.strip().splitlines():
        parts = line.split()
        if parts:
            lines.append(parts[0])
    return "\n".join(lines) if lines else out


def dns_lookup_remote(
    host: str,
    username: str,
    password: str,
    name: str,
    record_type: str = "A",
    server: Optional[str] = None,
    short: bool = False,
    port: int = 22,
    timeout: float = 10.0,
    timeout_sec: int = 15,
    log: Optional[object] = None,
) -> Tuple[int, str, str]:
    """
    Run a DNS lookup on a remote host via SSH (dig, or getent hosts if dig is missing).

    :param host: Remote hostname or IP.
    :param username: SSH username.
    :param password: SSH password.
    :param name: Hostname or domain to look up (e.g. example.com).
    :param record_type: Record type: A, AAAA, MX, NS, TXT, CNAME, SOA, etc. (default A).
    :param server: Resolver to use on remote (e.g. 8.8.8.8), or None for default.
    :param short: If True, return short output only.
    :param port: SSH port.
    :param timeout: SSH connection timeout in seconds.
    :param timeout_sec: Command timeout in seconds.
    :param log: Optional logger.
    :return: (exit_code, stdout, stderr). exit_code 0 on success; 2 if password missing (caller only).
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

    log.debug("dns_lookup_remote: connecting to %s@%s:%s", username, host, port)
    client = ssh_connect(host, username, password, port=port, timeout=timeout, log=log)
    try:
        log.debug("dns_lookup_remote: running on remote: %s", cmd)
        code, out, err = run_remote(client, cmd, timeout_sec=timeout_sec, log=log)
        if code == 0:
            log.debug("dns_lookup_remote: dig succeeded for name=%s type=%s host=%s", name, record_type, host)
            return 0, out.rstrip(), err
        # Fallback: if dig not found (127) and A/AAAA, try getent hosts on remote
        if (code == 127 or "command not found" in (err or "").lower()) and rtype in ("A", "AAAA"):
            getent_cmd = "getent hosts " + shlex.quote(name)
            log.info("dig not found on remote (exit %s), falling back to getent hosts host=%s", code, host)
            log.debug("dns_lookup_remote: running on remote: %s", getent_cmd)
            gcode, gout, gerr = run_remote(client, getent_cmd, timeout_sec=timeout_sec, log=log)
            if gcode == 0 and gout.strip():
                log.debug("dns_lookup_remote: getent succeeded for name=%s host=%s", name, host)
                if short:
                    return 0, _getent_short(gout), gerr
                return 0, gout.rstrip(), gerr
            if gcode != 0:
                log.warning("dns_lookup_remote: getent failed exit=%s name=%s host=%s stderr=%s", gcode, name, host, gerr or gout)
                return 1, gout, gerr or gout
        log.warning("dns_lookup_remote: lookup failed name=%s type=%s host=%s exit=%s stderr=%s", name, record_type, host, code, err or out)
        return code, out, err
    finally:
        client.close()


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Run DNS lookup on remote host (dig, or getent hosts if dig is missing)."
    )
    add_remote_ssh_args(parser)
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
        help="Resolver to use on remote (e.g. 8.8.8.8 or ns1.example.com)",
    )
    parser.add_argument(
        "--short",
        action="store_true",
        help="Short output only (dig +short)",
    )
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    password = get_password(args)
    if not password:
        logger.error("password required via argument or SSH_PASSWORD env var")
        print("Error: password required via argument or SSH_PASSWORD env var", file=sys.stderr)
        return 2

    code, out, err = dns_lookup_remote(
        args.host,
        args.username,
        password,
        args.name,
        record_type=args.type,
        server=args.server,
        short=args.short,
        port=args.port,
        timeout=args.timeout,
    )
    if code != 0:
        logger.warning("dns lookup failed host=%s name=%s: %s", args.host, args.name, (err or out).strip() or "unknown error")
        print(err or out, file=sys.stderr)
        return code
    logger.debug("dns lookup succeeded: host=%s name=%s", args.host, args.name)
    print(out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
