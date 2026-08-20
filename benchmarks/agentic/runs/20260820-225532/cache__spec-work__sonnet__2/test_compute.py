import compute as compute_module
from compute import compute


def setup_function(_):
    compute_module._cache.clear()
    compute_module._calls = 0


def test_returns_correct_value():
    assert compute(5) == 0 + 1 + 4 + 9 + 16


def test_repeated_call_uses_cache():
    compute(10)
    assert compute_module._calls == 1
    compute(10)
    assert compute_module._calls == 2
    assert compute_module._cache[10] == compute(10)


def test_different_args_cached_independently():
    a = compute(3)
    b = compute(4)
    assert a != b
    assert compute(3) == a
    assert compute(4) == b


def test_zero_and_negative_range():
    assert compute(0) == 0
    assert compute(-3) == 0
