---
title: "凭据恢复"
module: "凭据恢复"
date: "2026-11-02"
problem_type: best_practice
component: application_code
severity: medium
source_refs: ["src/auth.js"]
invalidation_condition: "src/auth.js不再保留离线凭据时复查"
---
# 凭据恢复

认证失败时刷新凭据。

## 离线恢复

离线时保留最后可用凭据，不删除备份。
