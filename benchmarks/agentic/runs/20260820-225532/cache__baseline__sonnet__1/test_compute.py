import compute as compute_module
from compute import compute


def test_returns_same_value_for_same_input():
    assert compute(5) == compute(5)


def test_correct_value():
    # sum of i*i for i in range(5) = 0+1+4+9+16 = 30
    assert compute(5) == 30


def test_repeated_calls_do_not_recompute():
    compute_module._calls = 0
    compute.cache_clear()

    first = compute(10)
    calls_after_first = compute_module._calls
    second = compute(10)
    calls_after_second = compute_module._calls

    assert first == second
    assert calls_after_first == 1
    assert calls_after_second == 1  # cache hit, no recompute


def test_different_arguments_still_compute_independently():
    compute_module._calls = 0
    compute.cache_clear()

    assert compute(3) == 5  # 0+1+4
    assert compute(4) == 14  # 0+1+4+9
    assert compute_module._calls == 2

    # repeat both, still cached
    assert compute(3) == 5
    assert compute(4) == 14
    assert compute_module._calls == 2
