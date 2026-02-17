#!/usr/bin/env python3
"""Save a Docker image locally, copy to remote via SFTP, load on remote. Exit 0 on success."""

import argparse
import os
import re
import shlex
import sys
import tempfile

from common import (
    add_common_args,
    add_remote_ssh_args,
    configure_logging,
    get_password,
    run_local,
    run_remote,
    ssh_connect,
)


def _safe_basename(s: str) -> str:
    """Return a safe filename fragment from an image reference."""
    return re.sub(r"[/:\\]", "_", s)[:80]


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Save Docker image locally, copy to remote, load on remote."
    )
    add_remote_ssh_args(parser)
    add_common_args(parser)
    parser.add_argument("image", help="Image reference (e.g. myapp:latest or nginx:alpine)")
    parser.add_argument(
        "-o",
        "--output",
        default=None,
        metavar="PATH",
        help="Local tar path for saved image (default: temp file)",
    )
    parser.add_argument(
        "--remote-path",
        default=None,
        metavar="PATH",
        help="Remote path for tar on host (default: /tmp/docker-image-<name>.tar)",
    )
    parser.add_argument(
        "--keep",
        action="store_true",
        help="Keep local and remote tar files after load",
    )
    args = parser.parse_args()
    configure_logging(args.verbose, args.debug)

    password = get_password(args)
    if not password:
        print("Error: password required via argument or SSH_PASSWORD env var", file=sys.stderr)
        return 2

    image_quoted = shlex.quote(args.image)
    local_tar = args.output
    if not local_tar:
        fd, local_tar = tempfile.mkstemp(suffix=".tar", prefix="docker-image-")
        os.close(fd)
    local_tar = os.path.abspath(local_tar)
    remote_tar = args.remote_path
    if not remote_tar:
        remote_tar = "/tmp/docker-image-%s.tar" % _safe_basename(args.image)

    # 1. Save image locally
    code, out, err = run_local(
        "docker save -o %s %s" % (shlex.quote(local_tar), image_quoted),
        timeout_sec=600,
    )
    if code != 0:
        print(err or out, file=sys.stderr)
        if not args.output and os.path.isfile(local_tar):
            try:
                os.remove(local_tar)
            except OSError:
                pass
        return 1

    try:
        client = ssh_connect(
            args.host, args.username, password, port=args.port, timeout=args.timeout
        )
    except Exception as e:
        print("SSH failed: %s" % e, file=sys.stderr)
        if not args.output and os.path.isfile(local_tar):
            try:
                os.remove(local_tar)
            except OSError:
                pass
        return 1

    try:
        # 2. Copy to remote via SFTP
        sftp = client.open_sftp()
        try:
            sftp.put(local_tar, remote_tar)
        finally:
            sftp.close()

        # 3. Load on remote
        remote_esc = remote_tar.replace("'", "'\"'\"'")
        code, out, err = run_remote(
            client,
            "docker load -i '%s'" % remote_esc,
            timeout_sec=600,
        )
        if code != 0:
            print(err or out, file=sys.stderr)
            return 1
        if out.strip():
            print(out.strip())

        # 4. Remove remote tar unless --keep
        if not args.keep:
            run_remote(client, "rm -f '%s'" % remote_esc, timeout_sec=10)
    finally:
        client.close()

    if not args.keep and not args.output and os.path.isfile(local_tar):
        try:
            os.remove(local_tar)
        except OSError:
            pass

    return 0


if __name__ == "__main__":
    sys.exit(main())
