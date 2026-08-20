_calls = 0
_cache = {}

def compute(n):
    """Expensive pure function; called repeatedly with the same arguments. A bottleneck."""
    global _calls
    _calls += 1

    if n in _cache:
        return _cache[n]

    total = 0
    for i in range(n):
        total += i * i
    _cache[n] = total
    return total
