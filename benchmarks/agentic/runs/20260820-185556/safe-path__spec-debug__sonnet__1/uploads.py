import os


def safe_upload_path(base_dir, filename):
    """Join an untrusted filename onto base_dir and return the resulting path.

    `filename` comes from an untrusted web request, so this rejects anything
    that could escape `base_dir`: empty names, directory components (e.g.
    "../secret", "a/b", absolute paths), and symlink-based escapes.

    Raises ValueError if `filename` is invalid or would resolve outside
    `base_dir`.
    """
    if not filename:
        raise ValueError("filename must not be empty")

    # Normalize both separator conventions before taking the basename, so a
    # request built with backslashes can't smuggle directory components
    # through on a platform where '\\' isn't a path separator.
    candidate = filename.replace("\\", "/")
    name = os.path.basename(candidate)

    if name in ("", ".", ".."):
        raise ValueError("invalid filename: %r" % (filename,))

    base_real = os.path.realpath(base_dir)
    full_path = os.path.realpath(os.path.join(base_real, name))

    # Resolve symlinks on both sides before checking containment, so a
    # symlink inside base_dir can't be used to point outside of it.
    if full_path != base_real and not full_path.startswith(base_real + os.sep):
        raise ValueError("invalid filename: %r" % (filename,))

    return full_path
