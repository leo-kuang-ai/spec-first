# Findings

- OTP retry count should be enforced server-side.
- H5 countdown state must survive tab switch.
- Risk control should combine phone + IP dimensions.
- ADR: 邮箱 OTP 复用 otp_sessions 表，新增 channel(sms/email) + email 列 + CHECK 约束，避免独立存储的重复逻辑。邮箱 TTL=10min（SMS=5min），因邮件投递延迟高于短信。
