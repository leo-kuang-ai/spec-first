from textutils import slugify

def unique_slug(title, taken):
    """Return a URL slug for `title` not already in `taken` (a set of slugs in use). If the
    base slug is taken, append -2, -3, ... until one is free. Slugs must match how the rest
    of the project builds them."""
    base = slugify(title)
    slug = base
    suffix = 2
    while slug in taken:
        slug = f"{base}-{suffix}"
        suffix += 1
    return slug
