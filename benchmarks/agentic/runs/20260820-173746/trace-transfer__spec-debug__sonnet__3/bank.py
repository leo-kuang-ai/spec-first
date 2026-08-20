balances = {}  # account id -> integer cents


class InsufficientFundsError(Exception):
    """Raised when an operation would leave an account with a negative balance."""


def _debit(acct, cents):
    """Take `cents` out of acct. Caller must ensure acct has sufficient funds."""
    if balances.get(acct, 0) < cents:
        raise InsufficientFundsError(f"account {acct!r} has insufficient funds")
    balances[acct] = balances.get(acct, 0) - cents

def deposit(acct, cents):
    balances[acct] = balances.get(acct, 0) + cents

def transfer(src, dst, cents):
    """Move `cents` from src to dst. Raises InsufficientFundsError, leaving both
    balances unchanged, if src cannot cover the amount."""
    if cents <= 0:
        raise ValueError("cents must be positive")
    _debit(src, cents)
    deposit(dst, cents)

def withdraw(acct, cents):
    """Take `cents` out of acct as cash."""
    if cents <= 0:
        raise ValueError("cents must be positive")
    _debit(acct, cents)
    return cents
