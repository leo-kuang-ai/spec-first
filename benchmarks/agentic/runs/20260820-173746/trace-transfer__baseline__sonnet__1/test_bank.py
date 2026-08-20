import pytest

import bank


@pytest.fixture(autouse=True)
def _reset_balances():
    bank.balances.clear()
    yield
    bank.balances.clear()


def test_deposit_increases_balance():
    bank.deposit("a", 500)
    assert bank.balances["a"] == 500


def test_transfer_moves_funds_between_accounts():
    bank.deposit("a", 500)
    bank.transfer("a", "b", 200)
    assert bank.balances["a"] == 300
    assert bank.balances["b"] == 200


def test_transfer_with_insufficient_funds_raises_and_leaves_balances_unchanged():
    bank.deposit("a", 100)
    with pytest.raises(bank.InsufficientFundsError):
        bank.transfer("a", "b", 200)
    assert bank.balances["a"] == 100
    assert bank.balances.get("b", 0) == 0


def test_transfer_never_leaves_negative_balance():
    bank.deposit("a", 100)
    for amount in (50, 40, 30, 20):
        try:
            bank.transfer("a", "b", amount)
        except bank.InsufficientFundsError:
            pass
    assert bank.balances["a"] >= 0


def test_withdraw_with_insufficient_funds_raises_and_leaves_balance_unchanged():
    bank.deposit("a", 100)
    with pytest.raises(bank.InsufficientFundsError):
        bank.withdraw("a", 150)
    assert bank.balances["a"] == 100


def test_withdraw_success_decreases_balance_and_returns_amount():
    bank.deposit("a", 100)
    result = bank.withdraw("a", 40)
    assert result == 40
    assert bank.balances["a"] == 60
