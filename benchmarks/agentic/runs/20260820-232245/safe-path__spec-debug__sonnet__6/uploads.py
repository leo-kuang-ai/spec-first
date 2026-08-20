from pathlib import Path


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path.

    Prevents path traversal attacks by ensuring the resolved path
    stays within base_dir.

    Args:
        base_dir: The base directory to confine uploads to
        filename: Untrusted filename from user input

    Returns:
        str: Safe absolute path within base_dir

    Raises:
        ValueError: If the resolved path escapes base_dir
    """
    base = Path(base_dir).resolve()
    target = (base / filename).resolve()

    # Ensure target is within base_dir
    try:
        target.relative_to(base)
    except ValueError:
        raise ValueError(f"Path traversal detected: {filename}")

    return str(target)
