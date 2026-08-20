import os


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path.

    Strips any directory components from filename and confirms the
    resolved result stays within base_dir, blocking path traversal
    (e.g. "../../etc/passwd") and symlink escapes.
    """
    name = os.path.basename(filename)
    if not name or name in (os.curdir, os.pardir):
        raise ValueError(f"invalid filename: {filename!r}")

    base = os.path.realpath(base_dir)
    candidate = os.path.realpath(os.path.join(base, name))

    if os.path.commonpath([base, candidate]) != base:
        raise ValueError(f"invalid filename: {filename!r}")

    return candidate
