# TC-L2-AUTH-004

- verifies: [FR-AUTH-003/AC-1, FR-AUTH-003/AC-2]
- scenario: email otp login success
- steps:
  1. POST /api/auth/email/send-otp with valid email
  2. Assert 200, cooldownSeconds > 0
  3. POST /api/auth/email/login with correct OTP
  4. Assert 200, accessToken present
- result: pending
