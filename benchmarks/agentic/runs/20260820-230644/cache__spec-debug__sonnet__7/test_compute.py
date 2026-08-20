import compute as compute_module
from compute import compute


def test_returns_same_value_as_uncached_formula():
    for n in [0, 1, 5, 10, 100]:
        assert compute(n) == sum(i * i for i in range(n))


def test_repeated_calls_with_same_argument_do_not_recompute():
    compute.cache_clear()
    compute_module._calls = 0

    first = compute(42)
    calls_after_first = compute_module._calls
    second = compute(42)
    calls_after_second = compute_module._calls

    assert first == second
    assert calls_after_first == 1
    assert calls_after_second == 1


def test_different_arguments_are_computed_independently():
    compute.cache_clear()
    compute_module._calls = 0

    result_a = compute(3)
    result_b = compute(4)

    assert result_a == sum(i * i for i in range(3))
    assert result_b == sum(i * i for i in range(4))
    assert compute_module._calls == 2
