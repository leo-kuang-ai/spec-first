---
type: feat
status: active
origin: month-filter
---

# Month Filter - Plan

## Implementation Units

### U1: month 过滤参数

- Goal: GET /entries 支持可选 month=YYYY-MM 过滤
- Files: `src/server.js`
- Test scenarios: 无参数返回全部;合法月份只返回该月;非法格式 400
