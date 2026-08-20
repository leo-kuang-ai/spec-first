"""Test bank.py transfer function for negative balance bug."""
import bank

def test_transfer_causes_negative_balance():
    """Reproduce the bug: transfer with insufficient funds creates negative balance."""
    # Reset balances
    bank.balances = {}

    # Setup: Alice has 100 cents, Bob has 0
    bank.deposit('alice', 100)
    bank.deposit('bob', 0)

    # Alice tries to transfer 150 cents to Bob (more than she has)
    bank.transfer('alice', 'bob', 150)

    # BUG: Alice now has -50 cents (should have been rejected or at least stayed at 0)
    print(f"Alice balance: {bank.balances['alice']} cents")
    print(f"Bob balance: {bank.balances['bob']} cents")

    # This assertion will fail with the current bug
    assert bank.balances['alice'] >= 0, f"Alice has negative balance: {bank.balances['alice']}"
    assert bank.balances['bob'] == 100, f"Bob should have 100 if transfer succeeded"

if __name__ == '__main__':
    test_transfer_causes_negative_balance()
    print("✓ Test passed - no negative balances")
