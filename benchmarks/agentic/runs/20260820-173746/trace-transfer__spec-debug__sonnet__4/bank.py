balances = {}  # account id -> integer cents

class InsufficientFundsError(Exception):
    """Raised when a debit would take an account balance below zero."""

def _debit(acct, cents):
    """Take `cents` out of acct."""
    balance = balances.get(acct, 0)
    if cents > balance:
        raise InsufficientFundsError(
            f"account {acct!r} has {balance} cents, cannot debit {cents}"
        )
    balances[acct] = balance - cents

def deposit(acct, cents):
    balances[acct] = balances.get(acct, 0) + cents

def transfer(src, dst, cents):
    """Move `cents` from src to dst. Raises InsufficientFundsError if src can't cover it."""
    _debit(src, cents)
    deposit(dst, cents)

def withdraw(acct, cents):
    """Take `cents` out of acct as cash."""
    _debit(acct, cents)
    return cents
