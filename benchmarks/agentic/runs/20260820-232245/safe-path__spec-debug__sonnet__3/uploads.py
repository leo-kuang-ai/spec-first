import os


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path.

    Rejects absolute paths, null bytes, and any traversal (including via
    symlinks) that would resolve outside base_dir.
    """
    if not filename or os.path.isabs(filename) or "\x00" in filename:
        raise ValueError(f"Invalid filename: {filename!r}")

    base_real = os.path.realpath(base_dir)
    candidate = os.path.realpath(os.path.join(base_real, filename))

    if os.path.commonpath([base_real, candidate]) != base_real:
        raise ValueError(f"Invalid filename: {filename!r}")

    return candidate
