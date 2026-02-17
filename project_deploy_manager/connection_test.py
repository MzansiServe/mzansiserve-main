#!/usr/bin/env python3
"""
Basic SSH connection test for remote machines.
Returns True on connection success, False on failure.
"""

import argparse
import logging
import os
import sys
from typing import Optional

try:
    import paramiko
except ImportError:
    sys.exit(
        "Missing dependency: install with pip install paramiko (see requirements.txt)"
    )


logger = logging.getLogger(__name__)


def test_ssh_connection(
    host: str,
    username: str,
    password: str,
    port: int = 22,
    timeout: float = 10.0,
    log: Optional[logging.Logger] = None,
) -> bool:
    """
    Attempt SSH connection to a remote machine using username and password.

    Args:
        host: Remote hostname or IP address.
        username: SSH username.
        password: SSH password.
        port: SSH port (default 22).
        timeout: Connection timeout in seconds (default 10.0).
        log: Optional logger for debugging; uses module logger if None.

    Returns:
        True if connection succeeds, False otherwise.
    """
    log = log or logger
    client = None

    log.info(
        "Attempting SSH connection to %s@%s:%s (timeout=%.1fs)",
        username,
        host,
        port,
        timeout,
    )
    log.debug("connect host=%r port=%s username=%r", host, port, username)

    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        log.debug("Connecting via paramiko...")
        client.connect(
            hostname=host,
            port=port,
            username=username,
            password=password,
            timeout=timeout,
            allow_agent=False,
            look_for_keys=False,
        )
        log.info("SSH connection to %s@%s:%s succeeded", username, host, port)
        return True
    except Exception as e:  # noqa: BLE001
        log.warning(
            "SSH connection failed: %s: %s",
            type(e).__name__,
            e,
            exc_info=log.isEnabledFor(logging.DEBUG),
        )
        return False
    finally:
        if client is not None:
            try:
                client.close()
                log.debug("SSH client closed")
            except Exception as e:  # noqa: BLE001
                log.debug("Error closing SSH client: %s", e)


def _configure_logging(verbose: bool, debug: bool) -> None:
    """Configure logging level and format for troubleshooting."""
    level = logging.WARNING
    if debug:
        level = logging.DEBUG
    elif verbose:
        level = logging.INFO

    format_ = "%(levelname)s: %(message)s"
    if debug:
        format_ = "%(levelname)s %(name)s: %(message)s"

    logging.basicConfig(
        level=level,
        format=format_,
        stream=sys.stderr,
    )
    if debug:
        logging.getLogger("paramiko").setLevel(logging.DEBUG)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Test SSH connection to a remote machine."
    )
    parser.add_argument("host", help="Remote hostname or IP address")
    parser.add_argument("username", help="SSH username")
    parser.add_argument(
        "password",
        nargs="?",
        default=None,
        help="SSH password (or set SSH_PASSWORD env var)",
    )
    parser.add_argument(
        "-p",
        "--port",
        type=int,
        default=22,
        help="SSH port (default: 22)",
    )
    parser.add_argument(
        "-t",
        "--timeout",
        type=float,
        default=10.0,
        help="Connection timeout in seconds (default: 10)",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Log connection attempt and result (INFO level)",
    )
    parser.add_argument(
        "-d",
        "--debug",
        action="store_true",
        help="Enable debug logs including paramiko and full exception tracebacks",
    )
    args = parser.parse_args()

    _configure_logging(verbose=args.verbose, debug=args.debug)

    password = args.password or os.environ.get("SSH_PASSWORD")
    if not password:
        logger.error("Password required via argument or SSH_PASSWORD env var")
        return 2

    success = test_ssh_connection(
        host=args.host,
        username=args.username,
        password=password,
        port=args.port,
        timeout=args.timeout,
    )

    if success:
        print("true")
        return 0
    else:
        print("false")
        return 1


if __name__ == "__main__":
    sys.exit(main())
