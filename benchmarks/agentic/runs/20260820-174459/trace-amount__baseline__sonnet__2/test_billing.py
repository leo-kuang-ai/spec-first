from billing import invoice_total, parse_amount, tax_due


def test_parse_amount_thousands_separator():
    assert parse_amount('$1,234.50') == 123450


def test_parse_amount_no_separator():
    assert parse_amount('$10.50') == 1050


def test_invoice_total_with_thousands_separator():
    assert invoice_total(['$1,234.50', '$10.00']) == 124450


def test_invoice_total_mixed():
    assert invoice_total(['$1,000,000.00', '$0.50']) == 100000050


def test_tax_due_with_thousands_separator():
    assert tax_due('$1,234.50') == 12345
