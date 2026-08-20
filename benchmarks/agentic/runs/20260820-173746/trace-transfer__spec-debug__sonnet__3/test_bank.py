import unittest

import bank


class TransferTests(unittest.TestCase):
    def setUp(self):
        bank.balances.clear()

    def test_transfer_moves_money_between_accounts(self):
        bank.deposit("a", 500)
        bank.transfer("a", "b", 200)
        self.assertEqual(bank.balances["a"], 300)
        self.assertEqual(bank.balances["b"], 200)

    def test_transfer_exceeding_balance_raises_and_leaves_balances_unchanged(self):
        bank.deposit("a", 100)
        with self.assertRaises(bank.InsufficientFundsError):
            bank.transfer("a", "b", 200)
        self.assertEqual(bank.balances["a"], 100)
        self.assertEqual(bank.balances.get("b", 0), 0)

    def test_transfer_never_leaves_negative_balance(self):
        bank.deposit("a", 50)
        for _ in range(5):
            try:
                bank.transfer("a", "b", 30)
            except bank.InsufficientFundsError:
                pass
        self.assertGreaterEqual(bank.balances["a"], 0)

    def test_transfer_rejects_non_positive_amount(self):
        bank.deposit("a", 100)
        with self.assertRaises(ValueError):
            bank.transfer("a", "b", 0)
        with self.assertRaises(ValueError):
            bank.transfer("a", "b", -10)

    def test_withdraw_exceeding_balance_raises(self):
        bank.deposit("a", 50)
        with self.assertRaises(bank.InsufficientFundsError):
            bank.withdraw("a", 100)
        self.assertEqual(bank.balances["a"], 50)


if __name__ == "__main__":
    unittest.main()
