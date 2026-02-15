# TC-L2-AUTH-005

- verifies: [FR-AUTH-003/AC-3, FR-AUTH-003/AC-4, FR-AUTH-003/AC-5]
- scenario: email otp login error paths
- steps:
  1. Wrong OTP → AUTH_OTP_INVALID
  2. Expired OTP → AUTH_OTP_EXPIRED
  3. Repeat send within cooldown → AUTH_OTP_RATE_LIMIT
  4. Exceed retry limit → AUTH_OTP_RETRY_EXCEEDED
- result: pending
