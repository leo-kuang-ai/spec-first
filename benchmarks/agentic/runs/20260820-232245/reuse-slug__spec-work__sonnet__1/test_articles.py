from articles import unique_slug
from textutils import slugify


def test_returns_base_slug_when_free():
    assert unique_slug("Hello World", set()) == "hello-world"


def test_matches_project_slugify():
    title = "Café Déjà Vu"
    assert unique_slug(title, set()) == slugify(title)


def test_appends_dash_two_when_base_taken():
    base = slugify("Hello World")
    assert unique_slug("Hello World", {base}) == f"{base}-2"


def test_increments_past_multiple_taken_suffixes():
    base = slugify("Hello World")
    taken = {base, f"{base}-2", f"{base}-3"}
    assert unique_slug("Hello World", taken) == f"{base}-4"


def test_does_not_mutate_taken_set():
    base = slugify("Hello World")
    taken = {base}
    unique_slug("Hello World", taken)
    assert taken == {base}
