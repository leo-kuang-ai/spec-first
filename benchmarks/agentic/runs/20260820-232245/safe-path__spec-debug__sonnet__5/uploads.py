from pathlib import Path

def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    base = Path(base_dir).resolve()
    target = (base / filename).resolve()

    try:
        target.relative_to(base)
    except ValueError:
        raise ValueError(f"Path traversal detected: {filename}")

    return str(target)
