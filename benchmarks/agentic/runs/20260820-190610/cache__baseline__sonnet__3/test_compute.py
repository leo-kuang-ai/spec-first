import compute as compute_module
from compute import compute


def test_returns_same_value_for_same_argument():
    assert compute(5) == compute(5)


def test_matches_uncached_formula():
    n = 10
    expected = sum(i * i for i in range(n))
    assert compute(n) == expected


def test_repeated_calls_do_not_recompute():
    compute.cache_clear()
    compute_module._calls = 0

    compute(7)
    assert compute_module._calls == 1

    compute(7)
    compute(7)
    assert compute_module._calls == 1  # still 1: cache hit, no recomputation


def test_different_arguments_each_compute_once():
    compute.cache_clear()
    compute_module._calls = 0

    compute(3)
    compute(4)
    compute(3)
    compute(4)

    assert compute_module._calls == 2
    assert compute(3) == sum(i * i for i in range(3))
    assert compute(4) == sum(i * i for i in range(4))


def test_zero_argument():
    compute.cache_clear()
    assert compute(0) == 0
