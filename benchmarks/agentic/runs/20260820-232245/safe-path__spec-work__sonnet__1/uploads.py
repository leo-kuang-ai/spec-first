import os


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path.

    Raises ValueError if filename is empty, contains a path separator or
    null byte, is a "." / ".." segment, or would otherwise resolve outside
    base_dir (e.g. via a symlink).
    """
    if not filename or "\x00" in filename:
        raise ValueError("invalid filename")
    if "/" in filename or "\\" in filename:
        raise ValueError("invalid filename")
    if filename in (".", ".."):
        raise ValueError("invalid filename")

    base_dir_real = os.path.realpath(base_dir)
    full_path = os.path.realpath(os.path.join(base_dir_real, filename))

    if os.path.commonpath([base_dir_real, full_path]) != base_dir_real:
        raise ValueError("filename escapes base_dir")

    return full_path
