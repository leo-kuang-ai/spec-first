import unittest

import compute as compute_module
from compute import compute


class ComputeCacheTest(unittest.TestCase):
    def setUp(self):
        compute.cache_clear()
        compute_module._calls = 0

    def test_same_result_as_before(self):
        self.assertEqual(compute(0), 0)
        self.assertEqual(compute(1), 0)
        self.assertEqual(compute(5), sum(i * i for i in range(5)))
        self.assertEqual(compute(10), sum(i * i for i in range(10)))

    def test_repeated_calls_are_cached(self):
        compute(10)
        compute(10)
        compute(10)
        self.assertEqual(compute_module._calls, 1)

    def test_different_arguments_each_compute_once(self):
        compute(3)
        compute(4)
        compute(3)
        compute(4)
        self.assertEqual(compute_module._calls, 2)


if __name__ == "__main__":
    unittest.main()
