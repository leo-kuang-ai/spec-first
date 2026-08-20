from articles import unique_slug


def test_returns_base_slug_when_free():
    assert unique_slug("Hello World", set()) == "hello-world"


def test_appends_dash_2_when_base_taken():
    assert unique_slug("Hello World", {"hello-world"}) == "hello-world-2"


def test_increments_past_multiple_taken_slugs():
    taken = {"hello-world", "hello-world-2", "hello-world-3"}
    assert unique_slug("Hello World", taken) == "hello-world-4"


def test_uses_project_wide_slugify_for_accents():
    assert unique_slug("Café Menu", set()) == "cafe-menu"


def test_taken_set_is_not_mutated():
    taken = {"hello-world"}
    unique_slug("Hello World", taken)
    assert taken == {"hello-world"}
