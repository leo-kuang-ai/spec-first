import os


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path.

    Only accepts filenames that are a single path component (no directory
    separators, traversal segments, or null bytes), then verifies the
    resolved path still lives inside base_dir before returning it. This
    guards against path traversal, absolute-path injection, and symlink
    escapes from untrusted web request input.
    """
    if not filename or "\x00" in filename:
        raise ValueError("invalid filename")

    if "/" in filename or "\\" in filename or filename in (".", ".."):
        raise ValueError("invalid filename")

    base_dir_real = os.path.realpath(base_dir)
    candidate = os.path.realpath(os.path.join(base_dir_real, filename))

    if os.path.commonpath([base_dir_real, candidate]) != base_dir_real:
        raise ValueError("invalid filename")

    return candidate
