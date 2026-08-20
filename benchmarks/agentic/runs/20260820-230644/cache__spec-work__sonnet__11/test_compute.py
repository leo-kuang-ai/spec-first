import compute as compute_module
from compute import compute


def test_repeated_calls_return_same_result():
    assert compute(5) == compute(5)


def test_cache_avoids_recomputation():
    compute_module._calls = 0
    compute(10)
    compute(10)
    assert compute_module._calls == 1


def test_different_arguments_recompute():
    compute_module._calls = 0
    compute(3)
    compute(4)
    assert compute_module._calls == 2


def test_known_values_unchanged():
    assert compute(0) == 0
    assert compute(1) == 0
    assert compute(4) == 1 + 4 + 9
