"""
Safe file upload path handling to prevent directory traversal attacks.
"""
from pathlib import Path


def safe_upload_path(base_dir, filename):
    """
    Safely join a base directory with an untrusted filename.

    Args:
        base_dir: The base directory where uploads are allowed
        filename: User-supplied filename (untrusted input)

    Returns:
        Path object representing the safe joined path

    Raises:
        ValueError: If the filename attempts to escape base_dir
    """
    base = Path(base_dir).resolve()
    target = (base / filename).resolve()

    if not target.is_relative_to(base):
        raise ValueError(f"Invalid filename: path traversal detected")

    return target
