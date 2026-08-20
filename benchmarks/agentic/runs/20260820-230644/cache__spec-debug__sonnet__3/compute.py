from functools import lru_cache

_calls = 0

@lru_cache(maxsize=128)
def _compute_cached(n):
    total = 0
    for i in range(n):
        total += i * i
    return total

def compute(n):
    """Expensive pure function; called repeatedly with the same arguments. A bottleneck."""
    global _calls
    _calls += 1
    return _compute_cached(n)
