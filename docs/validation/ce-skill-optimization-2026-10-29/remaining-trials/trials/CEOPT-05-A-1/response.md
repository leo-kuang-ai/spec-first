**Title:** `fix(export): isolate monthly CSV exports by tenant`

**Target:** `example/support-api`  
**Head → base:** `fix/export-tenant` → `release/2026-10`  
**Range:** `release/2026-10...fix/export-tenant`

### Summary

Monthly CSV exports now include only records belonging to `req.tenantId`, preventing records from other tenants from appearing in the export. The UTC month window remains inclusive of month start and exclusive of next month start.

### Validation

The supplied local receipt confirms `node --test test/export.test.cjs` exited with code 0: 4 tests passed, covering tenant isolation, month bounds, header columns, and empty results.

### Related work

Related to example/support-api#412, which tracks the broader scheduled-export initiative. This patch does not implement scheduling or close that issue.

### Rollout

No dependency changes. CI, deployment, and public release have not been verified.
