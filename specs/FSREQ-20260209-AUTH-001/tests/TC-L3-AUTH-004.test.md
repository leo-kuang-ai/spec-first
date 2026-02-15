# TC-L3-AUTH-004

- verifies: [NFR-SEC-001 (email dimension)]
- scenario: email rate limiting and replay protection
- steps:
  1. Send 2 OTPs within 60s to same email → second blocked (AUTH_OTP_RATE_LIMIT)
  2. Use verified OTP again → AUTH_OTP_REPLAY_BLOCKED
  3. 6 failed attempts on same OTP → locked (AUTH_OTP_RETRY_EXCEEDED)
- result: pending
