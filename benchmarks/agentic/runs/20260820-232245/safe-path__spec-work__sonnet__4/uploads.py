from pathlib import Path

def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    # Resolve base_dir to absolute canonical path
    base = Path(base_dir).resolve()

    # Join filename and resolve to absolute canonical path
    # This normalizes path separators, resolves . and .., and follows symlinks
    target = (base / filename).resolve()

    # Verify the resolved target is contained within base_dir
    try:
        target.relative_to(base)
    except ValueError:
        raise ValueError(f"Path traversal attempt detected: {filename}")

    return str(target)
