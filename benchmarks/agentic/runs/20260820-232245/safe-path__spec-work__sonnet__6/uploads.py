import os


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    base_dir = os.path.abspath(base_dir)

    # Strip any directory components so ../ segments, absolute paths, and
    # embedded separators in the untrusted filename can't escape base_dir.
    safe_name = os.path.basename(filename)
    if not safe_name or safe_name in (os.curdir, os.pardir):
        raise ValueError(f"unsafe upload filename: {filename!r}")

    candidate = os.path.abspath(os.path.join(base_dir, safe_name))

    # Defense in depth: confirm the resolved path is still inside base_dir.
    if os.path.commonpath([base_dir, candidate]) != base_dir:
        raise ValueError(f"unsafe upload filename: {filename!r}")

    return candidate
