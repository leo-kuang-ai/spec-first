import os


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path.

    Rejects filenames that would escape base_dir via path traversal,
    absolute paths, or embedded null bytes.
    """
    if not filename or "\x00" in filename:
        raise ValueError("invalid filename")

    # Reject path separators and traversal outright: a filename should
    # never contain directory components. This also blocks absolute
    # paths (leading "/" or "C:\") and backslash traversal on Windows.
    if os.path.isabs(filename) or "/" in filename or "\\" in filename:
        raise ValueError("invalid filename")

    if filename in (".", ".."):
        raise ValueError("invalid filename")

    base_real = os.path.realpath(base_dir)
    candidate = os.path.realpath(os.path.join(base_real, filename))

    if os.path.commonpath([base_real, candidate]) != base_real:
        raise ValueError("invalid filename")

    return candidate
