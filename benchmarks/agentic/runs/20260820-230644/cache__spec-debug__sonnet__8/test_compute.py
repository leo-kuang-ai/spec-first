import compute as compute_module
from compute import compute


def test_compute_returns_same_result_for_repeated_calls():
    assert compute(5) == compute(5)


def test_compute_matches_expected_value():
    assert compute(5) == sum(i * i for i in range(5))


def test_compute_cache_avoids_recomputation():
    compute.cache_clear()
    compute_module._calls = 0

    compute(10)
    compute(10)
    compute(10)

    assert compute_module._calls == 1


def test_compute_still_computes_for_different_arguments():
    compute.cache_clear()
    compute_module._calls = 0

    compute(3)
    compute(4)

    assert compute_module._calls == 2
