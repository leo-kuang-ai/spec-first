import os
from pathlib import Path


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    if not filename or not filename.strip():
        raise ValueError("Filename cannot be empty")

    # Reject absolute paths
    if os.path.isabs(filename):
        raise ValueError("Absolute paths are not allowed")

    # Convert to Path and resolve
    base = Path(base_dir).resolve()
    target = (base / filename).resolve()

    # Verify the target is within base_dir
    try:
        target.relative_to(base)
    except ValueError:
        raise ValueError(f"Path traversal detected: {filename}")

    return str(target)
