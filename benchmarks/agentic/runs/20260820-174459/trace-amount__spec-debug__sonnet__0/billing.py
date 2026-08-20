def parse_amount(s):
    """Parse a dollar string like '$10.50' or '$1,234.50' into an integer number of cents."""
    return int(round(float(s.replace('$', '').replace(',', '')) * 100))

def invoice_total(amount_strs):
    """Sum a list of dollar strings into total cents."""
    return sum(parse_amount(s) for s in amount_strs)

def tax_due(amount_str, rate=0.10):
    """Tax owed on a single dollar string, in cents."""
    return int(round(parse_amount(amount_str) * rate))
