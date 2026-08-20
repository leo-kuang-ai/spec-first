import os


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path.

    Rejects filenames containing path separators or traversal segments
    (e.g. "../etc/passwd", absolute paths) and rejects any result that
    would resolve outside base_dir, rather than silently sanitizing it.
    """
    if not filename or os.path.basename(filename) != filename:
        raise ValueError(f"invalid filename: {filename!r}")

    base_dir = os.path.realpath(base_dir)
    candidate = os.path.realpath(os.path.join(base_dir, filename))

    if os.path.commonpath([base_dir, candidate]) != base_dir:
        raise ValueError(f"filename escapes base_dir: {filename!r}")

    return candidate
