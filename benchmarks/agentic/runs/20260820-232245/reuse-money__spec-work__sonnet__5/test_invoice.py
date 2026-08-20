from invoice import line_item


def test_line_item_formats_name_qty_and_total():
    assert line_item("Widget", 1050, 2) == "Widget x2 - $21.00"


def test_line_item_uses_project_money_formatting_with_thousands_separator():
    assert line_item("Gadget", 123456, 1) == "Gadget x1 - $1,234.56"


def test_line_item_single_unit():
    assert line_item("Widget", 1050, 1) == "Widget x1 - $10.50"
