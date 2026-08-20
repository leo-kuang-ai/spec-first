import os


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the resulting path.

    Only the final path segment of filename is used, so directory traversal
    sequences (`../`, `..\\`) and absolute paths embedded in filename cannot
    escape base_dir. Raises ValueError if filename is empty/invalid or if the
    resulting path would still fall outside base_dir (e.g. base_dir contains
    a symlink pointing elsewhere).
    """
    if not filename:
        raise ValueError("filename must not be empty")

    # Normalize both separator styles before taking the last segment, since
    # os.path.basename only splits on the current platform's separator.
    name = filename.replace("\\", "/").rsplit("/", 1)[-1]
    if name in ("", ".", ".."):
        raise ValueError("invalid filename")

    base_real = os.path.realpath(base_dir)
    candidate = os.path.realpath(os.path.join(base_real, name))

    if os.path.commonpath([base_real, candidate]) != base_real:
        raise ValueError("filename escapes base_dir")

    return candidate
