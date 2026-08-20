balances = {}  # account id -> integer cents

def _debit(acct, cents):
    """Take `cents` out of acct."""
    if balances.get(acct, 0) < cents:
        raise ValueError(f"insufficient funds in {acct}")
    balances[acct] = balances.get(acct, 0) - cents

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
