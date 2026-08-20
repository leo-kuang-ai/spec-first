import compute as compute_module
from compute import compute


def test_returns_same_result_as_uncached_computation():
    assert compute(5) == sum(i * i for i in range(5))


def test_repeated_calls_use_cache():
    compute.cache_clear()
    compute_module._calls = 0

    first = compute(10)
    calls_after_first = compute_module._calls
    second = compute(10)

    assert second == first
    assert compute_module._calls == calls_after_first


def test_different_arguments_are_computed_independently():
    compute.cache_clear()
    compute_module._calls = 0

    assert compute(3) == sum(i * i for i in range(3))
    assert compute(4) == sum(i * i for i in range(4))
    assert compute_module._calls == 2
