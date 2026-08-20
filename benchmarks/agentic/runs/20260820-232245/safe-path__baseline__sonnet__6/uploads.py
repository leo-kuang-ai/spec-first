import os

def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    if not filename or filename == '':
        raise ValueError("Filename cannot be empty")

    # Normalize the filename to remove any path components
    filename = os.path.basename(filename)

    # Check for null bytes
    if '\0' in filename:
        raise ValueError("Filename contains null byte")

    # Join the paths
    target_path = os.path.join(base_dir, filename)

    # Resolve to absolute paths
    base_abs = os.path.abspath(base_dir)
    target_abs = os.path.abspath(target_path)

    # Verify the target is within base_dir
    if not target_abs.startswith(base_abs + os.sep) and target_abs != base_abs:
        raise ValueError("Path traversal attempt detected")

    return target_path
