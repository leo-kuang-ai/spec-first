import os


class UnsafeUploadPath(ValueError):
    """Raised when an untrusted filename would escape base_dir."""


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path.

    Strips any directory components from filename (so "../../etc/passwd"
    or "/etc/passwd" collapse to just "passwd") and verifies the final
    resolved path is still contained within base_dir. Raises
    UnsafeUploadPath if filename is empty, contains a NUL byte, resolves
    to "." or "..", or the resulting path would escape base_dir (including
    via symlinks).
    """
    if not filename or "\x00" in filename:
        raise UnsafeUploadPath(f"invalid filename: {filename!r}")

    candidate_name = os.path.basename(filename)
    if not candidate_name or candidate_name in (os.curdir, os.pardir):
        raise UnsafeUploadPath(f"invalid filename: {filename!r}")

    base_real = os.path.realpath(base_dir)
    full_path = os.path.realpath(os.path.join(base_real, candidate_name))

    try:
        if os.path.commonpath([base_real, full_path]) != base_real:
            raise UnsafeUploadPath(f"path traversal detected: {filename!r}")
    except ValueError:
        # Raised e.g. on Windows when paths are on different drives.
        raise UnsafeUploadPath(f"path traversal detected: {filename!r}")

    return full_path
