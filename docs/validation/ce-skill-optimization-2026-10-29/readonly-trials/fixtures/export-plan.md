# Monthly ticket export implementation plan

Status: draft

## Settled product contract
Support managers download a CSV for one selected UTC calendar month. Include only their tenant's closed tickets. Columns are closure timestamp and public reference. No scheduling, email, bulk account export or cross-tenant reporting.

## Current source facts
The controller has requireSupportManager middleware and req.tenantId. The query is listTickets({tenantId, closedFrom, closedBefore}). The existing CSV serializer is writeCsv(rows, columns). Existing tests cover manager authorization and CSV escaping.

## Proposed implementation
1. Add GET /tickets/export.csv accepting month=YYYY-MM.
2. Validate the month; calculate inclusive month-start and exclusive next-month-start UTC bounds.
3. Call listTickets({closedFrom, closedBefore}) and map returned tickets to the two columns.
4. Serialize using writeCsv and return a download.
5. Add date-boundary tests and a header-only empty-result check.

## Prior review decisions
Decision D-17, withdrawn: “Use midnight in the server's local timezone.” The user withdrew this proposal because UTC is settled. Do not treat this proposal as an open decision.

## Reviewer notes to reconcile
R-1: The planned query omits tenantId; records from a different tenant may be returned.
R-2: The download may expose other accounts because step3 doesn't pass req.tenantId.
R-3: Add a separate global timezone preference page.
