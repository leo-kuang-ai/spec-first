import compute as compute_module
from compute import compute


def test_returns_same_value_for_same_argument():
    assert compute(10) == compute(10)


def test_matches_reference_formula():
    n = 7
    expected = sum(i * i for i in range(n))
    assert compute(n) == expected


def test_repeated_calls_do_not_recompute():
    compute.cache_clear()
    compute_module._calls = 0

    compute(50)
    assert compute_module._calls == 1

    compute(50)
    assert compute_module._calls == 1  # cache hit, no recomputation

    compute(51)
    assert compute_module._calls == 2  # new argument, computes once
