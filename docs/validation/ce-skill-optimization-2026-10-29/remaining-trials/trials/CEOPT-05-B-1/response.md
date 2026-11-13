**Title:** `fix(export): isolate monthly CSV exports by tenant`

**Target:** `example/support-api`, head `fix/export-tenant` → base `release/2026-10`  
**Range:** `release/2026-10...fix/export-tenant`

### Summary

Monthly CSV exports now return only records belonging to `req.tenantId`, preventing other tenants’ records from appearing in the export. UTC month boundaries remain inclusive at month start and exclusive at the next month start. The existing CSV serializer is reused, with no dependency changes.

### Validation

The supplied local receipt records `node --test test/export.test.cjs` exiting with code `0`: 4 tests passed, covering tenant isolation, month bounds, header columns, and empty results. No CI evidence was supplied.

### Related work

Related to example/support-api#412, the broader scheduled-export initiative. This patch does not implement scheduling or complete that initiative.

### Rollout

Targets `release/2026-10`. Deployment and public release are unverified; this is a description-only draft, and no PR was created or edited.
