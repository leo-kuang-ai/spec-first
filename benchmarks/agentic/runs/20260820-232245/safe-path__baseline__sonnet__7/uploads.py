import os
from pathlib import Path


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    if not filename or filename.strip() == '':
        raise ValueError("Filename cannot be empty")

    if '\0' in filename:
        raise ValueError("Filename contains null byte")

    if os.path.isabs(filename):
        raise ValueError("Filename cannot be an absolute path")

    base = Path(base_dir).resolve()
    target = (base / filename).resolve()

    try:
        target.relative_to(base)
    except ValueError:
        raise ValueError("Path traversal detected")

    return str(target)
