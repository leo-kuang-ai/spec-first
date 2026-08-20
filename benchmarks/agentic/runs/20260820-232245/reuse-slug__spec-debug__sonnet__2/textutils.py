import re, unicodedata

def slugify(title):
    """Project-wide slug: transliterate accents to ASCII, then hyphenate. Use this so every
    slug in the app is built the same way."""
    ascii_title = unicodedata.normalize('NFKD', title).encode('ascii', 'ignore').decode()
    return re.sub(r"[^a-z0-9]+", "-", ascii_title.lower()).strip("-")

def truncate(text, length=80):
    """Trim text to length, adding an ellipsis if it was longer."""
    return text if len(text) <= length else text[: length - 1].rstrip() + '\u2026'
