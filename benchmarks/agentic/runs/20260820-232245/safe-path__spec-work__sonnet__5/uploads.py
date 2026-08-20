import os


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path.

    Rejects path separators and traversal segments in filename, then
    verifies the resolved result stays inside base_dir, so a hostile
    filename (e.g. "../../etc/passwd" or an absolute path) cannot
    escape the upload directory.
    """
    if not filename or filename in (".", ".."):
        raise ValueError("invalid filename")

    # Reject any directory component outright instead of silently
    # stripping it, so callers see the bad input rather than a
    # surprising rename.
    basename = os.path.basename(filename)
    if basename != filename or os.path.isabs(filename):
        raise ValueError("invalid filename")

    base_real = os.path.realpath(base_dir)
    candidate = os.path.realpath(os.path.join(base_real, filename))

    if os.path.commonpath([base_real, candidate]) != base_real:
        raise ValueError("invalid filename")

    return candidate
