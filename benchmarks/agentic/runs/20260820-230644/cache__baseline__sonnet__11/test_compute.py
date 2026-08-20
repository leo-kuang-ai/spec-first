import compute as compute_module
from compute import compute


def test_returns_correct_value():
    assert compute(5) == sum(i * i for i in range(5))


def test_repeated_calls_are_cached():
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

    assert compute_module._calls == 2
