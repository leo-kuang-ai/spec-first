import os


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    if not filename or "\x00" in filename:
        raise ValueError("invalid filename")

    # Only the base name is trusted; any directory components (including
    # Windows-style separators) are stripped so "../" can't escape base_dir.
    safe_name = os.path.basename(filename.replace("\\", "/"))
    if safe_name in ("", ".", ".."):
        raise ValueError("invalid filename")

    base_dir = os.path.abspath(base_dir)
    candidate = os.path.abspath(os.path.join(base_dir, safe_name))

    if os.path.commonpath([base_dir, candidate]) != base_dir:
        raise ValueError("path traversal detected")

    return candidate
