from textutils import slugify


def unique_slug(title, taken):
    """Return a URL slug for `title` not already in `taken` (a set of slugs in use). If the
    base slug is taken, append -2, -3, ... until one is free. Slugs must match how the rest
    of the project builds them."""
    base = slugify(title)
    if base not in taken:
        return base
    suffix = 2
    while f"{base}-{suffix}" in taken:
        suffix += 1
    return f"{base}-{suffix}"
