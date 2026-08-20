balances = {}  # account id -> integer cents

class InsufficientFundsError(Exception):
    """Raised when a debit would leave an account with a negative balance."""

def _debit(acct, cents):
    """Take `cents` out of acct. Refuses if it would leave a negative balance."""
    balance = balances.get(acct, 0)
    if cents > balance:
        raise InsufficientFundsError(
            f"account {acct!r} has {balance} cents, cannot debit {cents}"
        )
    balances[acct] = balance - cents

def deposit(acct, cents):
    balances[acct] = balances.get(acct, 0) + cents

def transfer(src, dst, cents):
    """Move `cents` from src to dst. Raises InsufficientFundsError if src's
    balance is too low, leaving both accounts unchanged."""
    _debit(src, cents)
    deposit(dst, cents)

def withdraw(acct, cents):
    """Take `cents` out of acct as cash."""
    _debit(acct, cents)
    return cents
