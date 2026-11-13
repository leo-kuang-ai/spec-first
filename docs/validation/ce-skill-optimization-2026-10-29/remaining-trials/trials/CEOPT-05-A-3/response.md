Target: `example/support-api`, head `fix/export-tenant` → base `release/2026-10`  
Range: `release/2026-10...fix/export-tenant`

Title: `fix(export): restrict monthly CSV exports to the requesting tenant`

### Summary

Monthly CSV exports now include only records belonging to `req.tenantId`, preventing other tenants’ records from appearing. UTC month boundaries remain inclusive at month start and exclusive at the next month’s start. The existing CSV serializer is reused without dependency changes.

### Validation

Supplied local receipt: `node --test test/export.test.cjs` exited with code 0. All 4 tests passed, covering tenant isolation, month bounds, header columns, and empty results.

### Related work

Related to `example/support-api#412`, which tracks the broader scheduled-export initiative. This patch does not implement scheduling or close that issue.

### Rollout

Description-only draft; no PR has been created or updated. CI, deployment, and public release have not been verified.
