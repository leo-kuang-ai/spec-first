import os


class UnsafeFilenameError(ValueError):
    """Raised when an untrusted filename would escape base_dir."""


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the resulting path.

    filename comes from untrusted web requests, so directory components,
    ``..`` segments, absolute paths, and null bytes are rejected or
    stripped before joining, and the final path is verified to stay
    inside base_dir (guards against symlink tricks too).
    """
    if not filename or "\x00" in filename:
        raise UnsafeFilenameError(f"invalid filename: {filename!r}")

    # Normalize Windows-style separators too, then drop any directory
    # component so only a bare basename ever reaches the join.
    name = os.path.basename(filename.replace("\\", "/"))

    if not name or name in (os.curdir, os.pardir):
        raise UnsafeFilenameError(f"invalid filename: {filename!r}")

    base_real = os.path.realpath(base_dir)
    candidate = os.path.realpath(os.path.join(base_real, name))

    if os.path.commonpath([base_real, candidate]) != base_real:
        raise UnsafeFilenameError(f"filename escapes base_dir: {filename!r}")

    return candidate
