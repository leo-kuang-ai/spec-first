from compute import compute


def test_compute_returns_correct_value():
    assert compute(5) == sum(i * i for i in range(5))


def test_compute_caches_repeated_calls():
    compute.cache_clear()
    compute(10)
    calls_after_first = compute.cache_info().misses
    compute(10)
    compute(10)
    assert compute.cache_info().misses == calls_after_first
    assert compute.cache_info().hits == 2


def test_compute_recomputes_for_different_args():
    compute.cache_clear()
    compute(3)
    compute(4)
    assert compute.cache_info().misses == 2
