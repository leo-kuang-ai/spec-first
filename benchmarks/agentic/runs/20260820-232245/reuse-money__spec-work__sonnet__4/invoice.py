from money import format_money


def line_item(name, cents, qty):
    """Return an invoice line 'name xQTY - $TOTAL' for qty units at `cents` each
    (line total = cents * qty), the total shown the way the rest of the app shows money."""
    total_cents = cents * qty
    return f"{name} x{qty} - {format_money(total_cents)}"
