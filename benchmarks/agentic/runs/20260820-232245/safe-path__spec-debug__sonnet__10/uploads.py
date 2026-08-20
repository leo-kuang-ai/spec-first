import os
from pathlib import Path


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path.

    Securely joins a user-supplied filename to base_dir, preventing path
    traversal attacks.

    Args:
        base_dir: Base directory path
        filename: User-supplied filename (untrusted input)

    Returns:
        Absolute path string within base_dir

    Raises:
        ValueError: If filename is empty, contains path traversal, or results
                   in a path outside base_dir
    """
    if not filename or not filename.strip():
        raise ValueError("Filename cannot be empty")

    # Convert base_dir to absolute path
    base = Path(base_dir).resolve()

    # Extract basename only to strip directory components like ../
    safe_name = os.path.basename(filename)

    # Additional check: basename() can still be empty or dangerous
    if not safe_name or safe_name in ('.', '..'):
        raise ValueError(f"Invalid filename: {filename}")

    # Join and resolve to absolute path
    target = (base / safe_name).resolve()

    # Verify the resolved path is within base_dir
    try:
        target.relative_to(base)
    except ValueError:
        raise ValueError(f"Invalid filename: path traversal detected")

    return str(target)
