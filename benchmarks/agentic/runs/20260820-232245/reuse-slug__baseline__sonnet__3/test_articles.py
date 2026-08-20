import unittest

from articles import unique_slug


class UniqueSlugTests(unittest.TestCase):
    def test_returns_base_slug_when_free(self):
        self.assertEqual(unique_slug("Hello World", set()), "hello-world")

    def test_appends_dash_2_when_base_taken(self):
        self.assertEqual(unique_slug("Hello World", {"hello-world"}), "hello-world-2")

    def test_increments_past_multiple_taken_suffixes(self):
        taken = {"hello-world", "hello-world-2", "hello-world-3"}
        self.assertEqual(unique_slug("Hello World", taken), "hello-world-4")

    def test_matches_project_wide_slugify_for_accents(self):
        self.assertEqual(unique_slug("Café Déjà Vu", set()), "cafe-deja-vu")


if __name__ == "__main__":
    unittest.main()
