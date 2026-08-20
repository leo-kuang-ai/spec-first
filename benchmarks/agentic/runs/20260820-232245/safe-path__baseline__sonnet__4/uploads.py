import os


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the confined path.

    Rejects filenames that are empty, contain a path separator (so no
    traversal segments or subdirectories), or that resolve outside of
    base_dir once symlinks are followed.
    """
    if not filename or "\x00" in filename:
        raise ValueError("filename must be a non-empty string")

    if (
        "/" in filename
        or "\\" in filename
        or os.sep in filename
        or (os.altsep and os.altsep in filename)
    ):
        raise ValueError("filename must not contain path separators")

    if filename in (os.curdir, os.pardir):
        raise ValueError("filename must not be a directory reference")

    base_real = os.path.realpath(base_dir)
    candidate_real = os.path.realpath(os.path.join(base_real, filename))

    if candidate_real != base_real and not candidate_real.startswith(base_real + os.sep):
        raise ValueError("resolved path escapes base_dir")

    return candidate_real
