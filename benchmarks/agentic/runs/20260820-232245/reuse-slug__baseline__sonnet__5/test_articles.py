import unittest

from articles import unique_slug
from textutils import slugify


class UniqueSlugTests(unittest.TestCase):
    def test_returns_base_slug_when_free(self):
        self.assertEqual(unique_slug("Hello World", set()), "hello-world")

    def test_matches_project_slugify(self):
        title = "Café Déjà Vu"
        self.assertEqual(unique_slug(title, set()), slugify(title))

    def test_appends_suffix_when_taken(self):
        self.assertEqual(unique_slug("Hello World", {"hello-world"}), "hello-world-2")

    def test_skips_to_first_free_suffix(self):
        taken = {"hello-world", "hello-world-2", "hello-world-3"}
        self.assertEqual(unique_slug("Hello World", taken), "hello-world-4")

    def test_does_not_mutate_taken(self):
        taken = {"hello-world"}
        unique_slug("Hello World", taken)
        self.assertEqual(taken, {"hello-world"})


if __name__ == "__main__":
    unittest.main()
