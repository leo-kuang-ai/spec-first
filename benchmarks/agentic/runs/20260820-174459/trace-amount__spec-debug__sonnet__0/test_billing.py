import unittest

from billing import invoice_total, parse_amount, tax_due


class ParseAmountTests(unittest.TestCase):
    def test_simple_amount(self):
        self.assertEqual(parse_amount('$10.50'), 1050)

    def test_amount_with_thousands_separator(self):
        self.assertEqual(parse_amount('$1,234.50'), 123450)

    def test_amount_with_multiple_thousands_separators(self):
        self.assertEqual(parse_amount('$1,234,567.89'), 123456789)


class InvoiceTotalTests(unittest.TestCase):
    def test_sums_plain_amounts(self):
        self.assertEqual(invoice_total(['$10.50', '$5.00']), 1550)

    def test_sums_amounts_with_thousands_separators(self):
        self.assertEqual(invoice_total(['$1,234.50', '$10.00']), 124450)


class TaxDueTests(unittest.TestCase):
    def test_tax_on_amount_with_thousands_separator(self):
        self.assertEqual(tax_due('$1,234.50'), 12345)


if __name__ == '__main__':
    unittest.main()
