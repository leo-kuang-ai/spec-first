balances = {}  # account id -> integer cents

def _debit(acct, cents):
    """Take `cents` out of acct. Raises ValueError if that would leave the account negative."""
    balance = balances.get(acct, 0)
    if balance < cents:
        raise ValueError(f"insufficient funds in {acct}: has {balance}, needs {cents}")
    balances[acct] = balance - cents

def deposit(acct, cents):
    balances[acct] = balances.get(acct, 0) + cents

def transfer(src, dst, cents):
    """Move `cents` from src to dst. BUG REPORT: after some transfers an account is left with
    a negative balance, which must never happen. Fix it."""
    _debit(src, cents)
    deposit(dst, cents)

def withdraw(acct, cents):
    """Take `cents` out of acct as cash."""
    _debit(acct, cents)
    return cents
