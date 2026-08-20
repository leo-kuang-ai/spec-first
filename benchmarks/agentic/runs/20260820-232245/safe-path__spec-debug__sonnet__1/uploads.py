import os


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path.

    Strips any directory components from filename (blocking "../" traversal
    and absolute paths) and verifies the resolved result stays inside the
    realpath of base_dir, guarding against symlink escapes as well.
    """
    base_dir = os.path.realpath(base_dir)
    name = os.path.basename(filename)
    if not name or name in (os.curdir, os.pardir):
        raise ValueError(f"invalid filename: {filename!r}")

    candidate = os.path.realpath(os.path.join(base_dir, name))
    if os.path.commonpath([base_dir, candidate]) != base_dir:
        raise ValueError(f"unsafe filename: {filename!r}")

    return candidate
