from pathlib import Path


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path.

    Args:
        base_dir: The base directory path
        filename: User-supplied filename (untrusted input)

    Returns:
        str: The safe absolute path

    Raises:
        ValueError: If the filename attempts path traversal or is absolute
    """
    # Reject absolute paths in filename
    if Path(filename).is_absolute():
        raise ValueError(f"Absolute paths not allowed: {filename}")

    # Convert to Path objects and resolve to absolute paths
    base = Path(base_dir).resolve()

    # Join and resolve the full path
    target = (base / filename).resolve()

    # Security check: ensure target is within base_dir
    try:
        target.relative_to(base)
    except ValueError:
        # target is not relative to base, path traversal attempt
        raise ValueError(f"Path traversal detected: {filename}")

    return str(target)
