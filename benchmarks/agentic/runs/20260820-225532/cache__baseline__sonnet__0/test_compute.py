import unittest

import compute as compute_module
from compute import compute


class ComputeTests(unittest.TestCase):
    def setUp(self):
        compute.cache_clear()
        compute_module._calls = 0

    def test_returns_correct_value(self):
        self.assertEqual(compute(5), sum(i * i for i in range(5)))
        self.assertEqual(compute(0), 0)

    def test_repeated_calls_use_cache(self):
        compute(10)
        self.assertEqual(compute_module._calls, 1)

        compute(10)
        self.assertEqual(compute_module._calls, 1)

        compute(20)
        self.assertEqual(compute_module._calls, 2)


if __name__ == "__main__":
    unittest.main()
