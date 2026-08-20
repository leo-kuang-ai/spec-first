import compute as compute_module
from compute import compute


def test_returns_same_value_as_uncached_formula():
    assert compute(5) == sum(i * i for i in range(5))
    assert compute(0) == 0


def test_repeated_calls_do_not_recompute():
    compute.cache_clear()
    compute_module._calls = 0

    first = compute(10)
    second = compute(10)

    assert first == second
    assert compute_module._calls == 1


def test_different_arguments_each_compute_once():
    compute.cache_clear()
    compute_module._calls = 0

    compute(3)
    compute(4)
    compute(3)
    compute(4)

    assert compute_module._calls == 2
