import os


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    target_path = os.path.join(base_dir, filename)
    target_path = os.path.normpath(target_path)
    target_path = os.path.abspath(target_path)

    base_dir_abs = os.path.abspath(base_dir)

    if not target_path.startswith(base_dir_abs + os.sep):
        raise ValueError("Invalid filename: path traversal detected")

    return target_path
