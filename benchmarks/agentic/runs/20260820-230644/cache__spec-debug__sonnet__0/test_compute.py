import compute as compute_module
from compute import compute


def test_result_matches_uncached_formula():
    n = 10
    expected = sum(i * i for i in range(n))
    assert compute(n) == expected


def test_repeated_calls_are_cached():
    compute_module._calls = 0
    compute.cache_clear()

    compute(7)
    compute(7)
    compute(7)

    assert compute_module._calls == 1


def test_different_arguments_each_compute_once():
    compute_module._calls = 0
    compute.cache_clear()

    compute(3)
    compute(4)
    compute(3)

    assert compute_module._calls == 2
