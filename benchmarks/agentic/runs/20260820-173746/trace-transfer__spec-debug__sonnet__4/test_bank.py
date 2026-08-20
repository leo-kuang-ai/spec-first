import pytest

import bank


@pytest.fixture(autouse=True)
def reset_balances():
    bank.balances.clear()
    yield
    bank.balances.clear()


def test_transfer_moves_cents_between_accounts():
    bank.deposit("a", 500)
    bank.transfer("a", "b", 200)
    assert bank.balances["a"] == 300
    assert bank.balances["b"] == 200


def test_transfer_raises_when_source_has_insufficient_funds():
    bank.deposit("a", 100)
    with pytest.raises(bank.InsufficientFundsError):
        bank.transfer("a", "b", 200)
    # balances must be unchanged: no debit, no deposit
    assert bank.balances["a"] == 100
    assert bank.balances.get("b", 0) == 0


def test_transfer_never_leaves_source_negative():
    bank.deposit("a", 50)
    with pytest.raises(bank.InsufficientFundsError):
        bank.transfer("a", "b", 51)
    assert bank.balances["a"] >= 0


def test_withdraw_raises_when_insufficient_funds():
    bank.deposit("a", 10)
    with pytest.raises(bank.InsufficientFundsError):
        bank.withdraw("a", 20)
    assert bank.balances["a"] == 10


def test_withdraw_succeeds_and_returns_amount():
    bank.deposit("a", 100)
    assert bank.withdraw("a", 40) == 40
    assert bank.balances["a"] == 60
