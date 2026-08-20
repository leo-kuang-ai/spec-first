import os


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path.

    filename comes from untrusted web requests, so directory components,
    "..", absolute paths, and null bytes are rejected instead of silently
    joined -- os.path.join would let an absolute path in filename discard
    base_dir entirely, and a raw ".." would escape it.
    """
    if not filename or "\x00" in filename:
        raise ValueError(f"invalid filename: {filename!r}")

    name = os.path.basename(filename)
    if not name or name in (os.curdir, os.pardir):
        raise ValueError(f"invalid filename: {filename!r}")

    base = os.path.realpath(base_dir)
    candidate = os.path.realpath(os.path.join(base, name))

    if os.path.commonpath([base, candidate]) != base:
        raise ValueError(f"path traversal detected: {filename!r}")

    return candidate
