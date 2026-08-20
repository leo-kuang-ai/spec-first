from compute import compute


def test_compute_correctness():
    assert compute(0) == 0
    assert compute(1) == 0
    assert compute(5) == sum(i * i for i in range(5))


def test_compute_caches_repeated_calls():
    compute.cache_clear()
    first = compute(10)
    calls_after_first = compute.cache_info().misses

    second = compute(10)
    calls_after_second = compute.cache_info().misses

    assert first == second
    assert calls_after_second == calls_after_first


def test_compute_recomputes_for_new_argument():
    compute.cache_clear()
    compute(3)
    compute(4)
    assert compute.cache_info().misses == 2
