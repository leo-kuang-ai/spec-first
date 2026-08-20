from articles import unique_slug


def test_returns_base_slug_when_free():
    assert unique_slug("Hello World", set()) == "hello-world"


def test_appends_dash_2_when_base_taken():
    assert unique_slug("Hello World", {"hello-world"}) == "hello-world-2"


def test_increments_past_multiple_taken_suffixes():
    taken = {"hello-world", "hello-world-2", "hello-world-3"}
    assert unique_slug("Hello World", taken) == "hello-world-4"


def test_matches_project_wide_slugify_for_accents():
    assert unique_slug("Café Résumé", set()) == "cafe-resume"


def test_gap_in_taken_suffixes_does_not_get_reused():
    taken = {"hello-world", "hello-world-3"}
    assert unique_slug("Hello World", taken) == "hello-world-2"
