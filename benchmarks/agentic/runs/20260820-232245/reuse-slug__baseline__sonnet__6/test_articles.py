import unittest

from articles import unique_slug


class UniqueSlugTests(unittest.TestCase):
    def test_returns_base_slug_when_free(self):
        self.assertEqual(unique_slug("Hello World", set()), "hello-world")

    def test_matches_project_wide_slugify(self):
        self.assertEqual(unique_slug("Café Déjà Vu", set()), "cafe-deja-vu")

    def test_appends_dash_2_when_base_taken(self):
        self.assertEqual(
            unique_slug("Hello World", {"hello-world"}), "hello-world-2"
        )

    def test_increments_until_free_slug_found(self):
        taken = {"hello-world", "hello-world-2", "hello-world-3"}
        self.assertEqual(unique_slug("Hello World", taken), "hello-world-4")

    def test_does_not_mutate_taken_set(self):
        taken = {"hello-world"}
        unique_slug("Hello World", taken)
        self.assertEqual(taken, {"hello-world"})


if __name__ == "__main__":
    unittest.main()
