def format_money(cents):
    """Project-wide currency format: a leading $ and a thousands separator, e.g.
    1050 -> '$10.50', 123456 -> '$1,234.56'. Use this everywhere money is shown."""
    return f"${cents / 100:,.2f}"
