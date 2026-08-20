from pathlib import Path


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    # Convert to Path objects and resolve to absolute paths
    base = Path(base_dir).resolve()
    target = (base / filename).resolve()

    # Verify the resolved path is within base_dir
    try:
        target.relative_to(base)
    except ValueError:
        raise ValueError(f"Invalid filename: path traversal attempt detected")

    return str(target)
