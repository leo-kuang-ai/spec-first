A. Continuing within `spec-work`: the test passes `undefined`, so accessing `items.reduce` throws before summation begins. Since missing items means an empty invoice, the smallest change is a default empty array:

```js
function total(items = []) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

This makes `total(undefined)` return `0`. No changes or tests were run.

B. It means a problem with password resets involving expired reset links has been corrected.

C. Entering `spec-plan`: the behavior and acceptance criteria are settled, and the requested deliverable is an implementation outline.

1. Add a download endpoint, such as `GET /tickets/export.csv?month=2026-10`, protected by the existing `requireSupportManager` middleware.
2. Validate `month` as a real calendar month in `YYYY-MM` format; return `400` for missing or invalid input.
3. Calculate `closedFrom` as midnight UTC on the first day of that month and `closedBefore` as midnight UTC on the first day of the next month. Use an inclusive start and exclusive end, including the December-to-January rollover.
4. Query with the tenant supplied by the authenticated request:

   ```js
   const tickets = await listTickets({
     tenantId: req.tenantId,
     closedFrom,
     closedBefore,
   });
   ```

   Verify that this query applies both closure bounds and excludes open tickets. Tenant scope must come from `req.tenantId`.
5. Map the results to the agreed timestamp and public reference columns using the existing ticket model fields, then call `writeCsv(rows, columns)`. Preserve the settled meaning of “timestamp”; the supplied behavior does not identify its backing field.
6. Return the CSV with `Content-Type: text/csv; charset=utf-8` and an attachment filename such as `closed-tickets-2026-10.csv`. An empty result should still produce the column headers.
7. Verify authorization, tenant isolation, invalid months, exact UTC boundaries, year rollover, exclusion of open tickets, column mapping, CSV escaping, and an empty export.

This outline reuses the existing middleware, query, and serializer. No implementation or checks were run.

D. For `null`, the function returns `'(missing)'` because `value == null` is true. For an empty string, it returns `''` because the condition is false and `String('')` remains empty. The snippet is sufficient to determine both results; Graphify is unnecessary.
