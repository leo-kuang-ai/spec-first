from pathlib import Path

def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the path."""
    # Convert to Path objects and resolve to absolute paths
    base = Path(base_dir).resolve()

    # Extract just the filename component, removing any directory parts
    # This prevents path traversal via "../" or "/" in the filename
    safe_name = Path(filename).name

    # Join and resolve the full path
    target = (base / safe_name).resolve()

    # Verify the target is within base_dir by checking if base is a parent
    try:
        target.relative_to(base)
    except ValueError:
        raise ValueError(f"Path traversal attempt detected: {filename}")

    return str(target)
