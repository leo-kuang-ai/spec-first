import os


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path.

    Rejects any filename that would escape base_dir (path traversal,
    absolute paths, or symlink tricks) by resolving both paths and
    checking containment before returning.
    """
    base_dir = os.path.realpath(base_dir)
    candidate = os.path.realpath(os.path.join(base_dir, filename))

    if os.path.commonpath([base_dir, candidate]) != base_dir:
        raise ValueError(f"Invalid filename: {filename!r}")

    return candidate
