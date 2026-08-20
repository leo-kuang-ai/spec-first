def unique_slug(title, taken):
    """Return a URL slug for `title` not already in `taken` (a set of slugs in use). If the
    base slug is taken, append -2, -3, ... until one is free. Slugs must match how the rest
    of the project builds them."""
    from textutils import slugify

    base = slugify(title)
    if base not in taken:
        return base

    counter = 2
    while True:
        candidate = f"{base}-{counter}"
        if candidate not in taken:
            return candidate
        counter += 1
