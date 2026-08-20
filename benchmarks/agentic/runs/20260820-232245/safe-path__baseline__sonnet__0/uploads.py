import os


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path.

    filename is discarded down to its final path component before
    joining, and the result is verified (after resolving symlinks) to
    stay inside base_dir. Raises ValueError if filename is empty, is
    only "." / "..", contains a null byte, or would otherwise resolve
    outside base_dir.
    """
    if not isinstance(filename, str) or not filename:
        raise ValueError("filename must be a non-empty string")

    if "\x00" in filename:
        raise ValueError("filename must not contain a null byte")

    # Drop any directory components (either slash style) so callers
    # can't traverse out of base_dir or supply an absolute path.
    name = os.path.basename(filename.replace("\\", "/"))

    if name in ("", ".", ".."):
        raise ValueError("filename must resolve to a real file name")

    base_real = os.path.realpath(base_dir)
    candidate = os.path.realpath(os.path.join(base_real, name))

    if os.path.commonpath([base_real, candidate]) != base_real:
        raise ValueError("filename escapes base_dir")

    return candidate
