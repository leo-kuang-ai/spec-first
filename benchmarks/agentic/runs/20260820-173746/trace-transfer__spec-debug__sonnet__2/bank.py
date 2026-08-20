balances = {}  # account id -> integer cents

def _debit(acct, cents):
    """Take `cents` out of acct."""
    balance = balances.get(acct, 0)
    if cents > balance:
        raise ValueError(f"insufficient funds in {acct}: balance {balance}, requested {cents}")
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
