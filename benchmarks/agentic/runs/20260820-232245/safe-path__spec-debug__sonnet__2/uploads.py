import os


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    # Normalize base_dir to absolute path
    base_dir = os.path.abspath(base_dir)

    # Join and normalize the path
    target_path = os.path.normpath(os.path.join(base_dir, filename))
    target_path = os.path.abspath(target_path)

    # Verify the resulting path is within base_dir
    if not target_path.startswith(base_dir + os.sep) and target_path != base_dir:
        raise ValueError(f"Invalid filename: path traversal detected")

    return target_path
