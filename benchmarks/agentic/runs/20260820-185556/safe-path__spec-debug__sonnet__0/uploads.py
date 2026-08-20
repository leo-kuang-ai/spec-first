from pathlib import Path


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path.

    Args:
        base_dir: The base directory path
        filename: User-supplied filename (untrusted)

    Returns:
        str: Safe path within base_dir

    Raises:
        ValueError: If the resulting path would escape base_dir
    """
    if not filename:
        raise ValueError("Filename cannot be empty")

    # Convert to Path objects and resolve to absolute paths
    base = Path(base_dir).resolve()
    target = (base / filename).resolve()

    # Verify the target path is within base_dir
    try:
        target.relative_to(base)
    except ValueError:
        raise ValueError(f"Path traversal attempt detected: {filename}")

    return str(target)
