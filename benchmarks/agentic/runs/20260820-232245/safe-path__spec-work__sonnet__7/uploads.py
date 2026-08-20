import os


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path.

    Rejects filenames that would escape base_dir via path separators,
    parent-directory segments, or absolute paths, since filename comes
    from untrusted web requests.
    """
    base_dir = os.path.abspath(base_dir)

    name = os.path.basename(filename)
    if not name or name in (os.curdir, os.pardir):
        raise ValueError(f"invalid filename: {filename!r}")

    candidate = os.path.abspath(os.path.join(base_dir, name))
    if os.path.commonpath([base_dir, candidate]) != base_dir:
        raise ValueError(f"invalid filename: {filename!r}")

    return candidate
