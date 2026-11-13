A. Continuing under `spec-work`: `total(undefined)` tries to access `.reduce` on `undefined`. Since missing items means an empty invoice, the smallest change is a default parameter:

```js
function total(items = []) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

This returns `0` for `total(undefined)` or `total()`, while preserving totals for supplied arrays. This change has not been applied or tested.

B. It means a bug affecting password resets when the reset link has expired was fixed.

C. Entering `spec-plan`: the behavior and acceptance criteria are settled, so the next step is a concrete implementation outline.

1. Add the monthly CSV download handler behind `requireSupportManager`, following the existing Express route conventions.
2. Accept a month in `YYYY-MM` format. Validate it strictly and reject invalid input using the existing validation response convention.
3. Compute `closedFrom` as midnight UTC on the first day of that month and `closedBefore` as midnight UTC on the first day of the next month. Use an inclusive start and exclusive end.
4. Query through the existing service:

   ```js
   const tickets = await listTickets({
     tenantId: req.tenantId,
     closedFrom,
     closedBefore,
   });
   ```

   Always derive tenant scope from `req.tenantId`. Verify that the service applies both tenant filtering and closed-ticket filtering with those boundary semantics.
5. Map results to the existing timestamp and public-reference fields, then serialize through `writeCsv(rows, columns)` with explicit columns in the required order. Use the established timestamp representation.
6. Return the CSV with `Content-Type: text/csv; charset=utf-8` and an attachment filename such as `closed-tickets-2026-10.csv`. An empty result should produce the column headers without ticket rows.
7. Validate manager authorization, tenant isolation, exclusion of open tickets, exact UTC boundaries, December-to-January rollover, invalid months, empty results, and correct CSV escaping through the existing serializer.

This is an implementation outline only; no code changes or checks have been run.

D. For `null`, the function returns `'(missing)'` because `null == null` is true. For an empty string, it returns `''` because `'' == null` is false and `String('')` remains empty. The snippet is sufficient to determine both results; Graphify is unnecessary here.
