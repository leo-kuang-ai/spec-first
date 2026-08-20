import os


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path.

    filename comes from untrusted web requests, so directory components
    (either OS's separators, absolute paths, drive letters) are stripped
    before joining, and the resolved result is verified to still live
    under base_dir before it's returned.
    """
    if not filename or "\x00" in filename:
        raise ValueError("invalid filename")

    name = os.path.basename(filename.replace("\\", "/"))
    if not name or name in (".", ".."):
        raise ValueError("invalid filename")

    base_dir = os.path.abspath(base_dir)
    candidate = os.path.abspath(os.path.join(base_dir, name))

    if os.path.commonpath([base_dir, candidate]) != base_dir:
        raise ValueError("invalid filename")

    return candidate
