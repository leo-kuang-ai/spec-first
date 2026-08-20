import os

def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    # Strip directory components to prevent path traversal
    safe_filename = os.path.basename(filename)

    # Join with base_dir
    return os.path.join(base_dir, safe_filename)
