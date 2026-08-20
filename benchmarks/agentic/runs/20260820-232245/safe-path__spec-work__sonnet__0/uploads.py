import os


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path.

    Only the final path segment of filename is trusted; any directory
    components (including traversal like "../") are stripped. The result
    is re-verified to stay inside the resolved base_dir to guard against
    symlink escapes.
    """
    if not filename:
        raise ValueError("filename must not be empty")

    # os.path.basename only splits on os.sep, so normalize backslashes too
    # in case filename came from a client that used Windows-style separators.
    candidate = os.path.basename(filename.replace("\\", "/"))
    if not candidate or candidate in (os.curdir, os.pardir):
        raise ValueError("invalid filename")

    base_real = os.path.realpath(base_dir)
    full_path = os.path.realpath(os.path.join(base_real, candidate))

    if os.path.commonpath([base_real, full_path]) != base_real:
        raise ValueError("resolved path escapes base_dir")

    return full_path
