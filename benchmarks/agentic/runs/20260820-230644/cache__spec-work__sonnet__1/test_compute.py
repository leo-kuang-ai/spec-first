import compute as compute_mod
from compute import compute


def test_returns_same_value():
    assert compute(5) == sum(i * i for i in range(5))


def test_repeated_call_does_not_recompute():
    compute.cache_clear()
    compute_mod._calls = 0
    compute(10)
    compute(10)
    compute(10)
    assert compute_mod._calls == 1


def test_different_args_recompute_independently():
    compute.cache_clear()
    compute_mod._calls = 0
    compute(3)
    compute(4)
    compute(3)
    assert compute_mod._calls == 2
