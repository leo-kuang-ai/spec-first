from articles import unique_slug
from textutils import slugify


def test_returns_base_slug_when_free():
    assert unique_slug("Hello World", set()) == "hello-world"


def test_uses_project_slugify_for_base_form():
    assert unique_slug("Café Résumé", set()) == slugify("Café Résumé")


def test_appends_dash_2_when_base_taken():
    assert unique_slug("Hello World", {"hello-world"}) == "hello-world-2"


def test_skips_taken_numbered_variants():
    taken = {"hello-world", "hello-world-2", "hello-world-3"}
    assert unique_slug("Hello World", taken) == "hello-world-4"
