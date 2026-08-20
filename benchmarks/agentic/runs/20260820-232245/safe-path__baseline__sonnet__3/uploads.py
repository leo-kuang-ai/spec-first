import os

def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    if not filename:
        raise ValueError("Filename cannot be empty")

    # Strip any directory components and path traversal sequences
    safe_filename = os.path.basename(filename)

    if not safe_filename or safe_filename in ('.', '..'):
        raise ValueError("Invalid filename")

    # Join with base directory
    target_path = os.path.join(base_dir, safe_filename)

    # Resolve to absolute paths and verify the result is within base_dir
    base_dir_abs = os.path.abspath(base_dir)
    target_path_abs = os.path.abspath(target_path)

    # Ensure the target path is within the base directory
    if not target_path_abs.startswith(base_dir_abs + os.sep):
        if target_path_abs != base_dir_abs:
            raise ValueError("Path traversal attempt detected")

    return target_path_abs
