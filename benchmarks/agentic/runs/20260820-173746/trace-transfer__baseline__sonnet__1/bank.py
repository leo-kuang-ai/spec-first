balances = {}  # account id -> integer cents

class InsufficientFundsError(Exception):
    """Raised when a debit would drive an account balance below zero."""

def _debit(acct, cents):
    """Take `cents` out of acct. Raises InsufficientFundsError if that would
    leave the account negative; balance is left unchanged in that case."""
    balance = balances.get(acct, 0)
    if cents > balance:
        raise InsufficientFundsError(
            f"account {acct!r} has {balance} cents, cannot debit {cents}"
        )
    balances[acct] = balance - cents

def deposit(acct, cents):
    balances[acct] = balances.get(acct, 0) + cents

def transfer(src, dst, cents):
    """Move `cents` from src to dst. Raises InsufficientFundsError and leaves
    both accounts untouched if src does not have enough funds."""
    _debit(src, cents)
    deposit(dst, cents)

def withdraw(acct, cents):
    """Take `cents` out of acct as cash."""
    _debit(acct, cents)
    return cents
