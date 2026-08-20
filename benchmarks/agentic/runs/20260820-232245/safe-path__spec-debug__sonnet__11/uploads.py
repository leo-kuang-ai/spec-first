import os
from pathlib import Path


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    base_path = Path(base_dir).resolve()
    target_path = (base_path / filename).resolve()

    if not target_path.is_relative_to(base_path):
        raise ValueError("Invalid filename: path traversal detected")

    return str(target_path)
