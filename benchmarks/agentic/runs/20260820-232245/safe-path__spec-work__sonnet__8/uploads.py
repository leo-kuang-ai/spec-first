import os


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path.

    Rejects filenames containing path separators or that otherwise
    resolve outside base_dir (e.g. "..", absolute paths).
    """
    if not filename or os.path.basename(filename) != filename:
        raise ValueError(f"invalid filename: {filename!r}")

    base_dir = os.path.abspath(base_dir)
    candidate = os.path.abspath(os.path.join(base_dir, filename))

    if os.path.commonpath([base_dir, candidate]) != base_dir:
        raise ValueError(f"invalid filename: {filename!r}")

    return candidate
