from pathlib import Path

def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    base = Path(base_dir).resolve()
    target = (base / filename).resolve()

    if not target.is_relative_to(base):
        raise ValueError("Invalid filename: path traversal detected")

    return str(target)
