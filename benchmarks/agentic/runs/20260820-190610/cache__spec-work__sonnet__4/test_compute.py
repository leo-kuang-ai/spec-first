import compute as compute_module
from compute import compute


def _expected(n):
    return sum(i * i for i in range(n))


def test_returns_same_value_as_before():
    compute.cache_clear()
    assert compute(10) == _expected(10)
    assert compute(0) == _expected(0)
    assert compute(1) == _expected(1)


def test_repeated_calls_do_not_recompute():
    compute.cache_clear()
    compute_module._calls = 0

    result1 = compute(50)
    calls_after_first = compute_module._calls
    assert calls_after_first == 1

    result2 = compute(50)
    assert result2 == result1
    assert compute_module._calls == calls_after_first  # no recompute on cache hit


def test_different_arguments_still_compute_independently():
    compute.cache_clear()
    compute_module._calls = 0

    assert compute(3) == _expected(3)
    assert compute(4) == _expected(4)
    assert compute_module._calls == 2

    # Repeat both; still no new computation.
    assert compute(3) == _expected(3)
    assert compute(4) == _expected(4)
    assert compute_module._calls == 2
