import os


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path.

    Only the final path component of filename is used, so path traversal
    ("../secret"), absolute paths ("/etc/passwd"), and embedded separators
    can't escape base_dir. Raises ValueError if no usable filename remains
    (empty, ".", or "..").
    """
    base_dir = os.path.abspath(base_dir)

    # Only the final path component is a legitimate filename; anything
    # else (separators, "..", drive letters) is an attempted traversal.
    name = os.path.basename(filename.replace("\\", "/"))
    if not name or name in (os.curdir, os.pardir):
        raise ValueError(f"invalid filename: {filename!r}")

    candidate = os.path.abspath(os.path.join(base_dir, name))
    if os.path.commonpath([base_dir, candidate]) != base_dir:
        raise ValueError(f"invalid filename: {filename!r}")

    return candidate
