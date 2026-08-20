import os

def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    safe_name = os.path.basename(filename)

    full_path = os.path.join(base_dir, safe_name)

    abs_base = os.path.abspath(base_dir)
    abs_path = os.path.abspath(full_path)

    try:
        common = os.path.commonpath([abs_base, abs_path])
        if common != abs_base:
            raise ValueError("Path traversal detected")
    except ValueError:
        raise ValueError("Invalid path")

    return abs_path
