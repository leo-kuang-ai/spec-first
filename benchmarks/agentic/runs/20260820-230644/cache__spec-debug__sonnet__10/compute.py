import functools

_calls = 0

@functools.cache
def compute(n):
    """Expensive pure function; called repeatedly with the same arguments. A bottleneck."""
    global _calls
    _calls += 1
    total = 0
    for i in range(n):
        total += i * i
    return total
