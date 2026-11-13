Target: `example/support-api`, head `fix/export-tenant` → base `release/2026-10`  
Range: `release/2026-10...fix/export-tenant`

Title: `fix(exports): restrict monthly CSV exports to the requesting tenant`

### Summary

Monthly CSV exports now include only records belonging to `req.tenantId`. The export preserves the inclusive UTC month start and exclusive next-month start and reuses the existing CSV serializer.

### Validation

Supplied local receipt: `node --test test/export.test.cjs` exited with code `0`; all 4 tests passed, covering tenant isolation, month bounds, header columns, and empty results. CI results are not available.

### Related work

Related to example/support-api#412, which tracks the broader scheduled-export initiative. This patch does not implement scheduling or close that issue.

### Rollout

Deployment and public release have not been verified. This is a description-only draft; no PR was created or updated.
