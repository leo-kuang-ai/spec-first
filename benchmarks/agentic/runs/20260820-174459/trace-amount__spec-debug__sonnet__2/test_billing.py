import pytest
from billing import invoice_total, parse_amount, tax_due

def test_invoice_total_with_thousands_separator():
    """Test that invoice_total handles amounts with thousands separators."""
    amounts = ['$1,234.50', '$2,500.00', '$100.25']
    # Expected: 1234.50 + 2500.00 + 100.25 = 3834.75 dollars = 383475 cents
    assert invoice_total(amounts) == 383475

def test_parse_amount_with_thousands_separator():
    """Test that parse_amount handles amounts with thousands separators."""
    assert parse_amount('$1,234.50') == 123450
    assert parse_amount('$10,000.00') == 1000000
    assert parse_amount('$5,678.90') == 567890

def test_invoice_total_without_thousands_separator():
    """Test that invoice_total still works with simple amounts."""
    amounts = ['$10.50', '$20.00', '$5.25']
    assert invoice_total(amounts) == 3575

def test_parse_amount_without_thousands_separator():
    """Test that parse_amount still works with simple amounts."""
    assert parse_amount('$10.50') == 1050
    assert parse_amount('$100.00') == 10000
