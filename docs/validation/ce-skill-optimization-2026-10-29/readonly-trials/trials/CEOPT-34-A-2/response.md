**A.** Continuing under `spec-work`: `total(undefined)` fails because `undefined` has no `.reduce()` method. The smallest change is to default missing items to an empty array:

```js
function total(items = []) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

This makes `total(undefined)` return `0`, matching an empty invoice. This is a proposed change; I haven’t applied or tested it.

**B.** It means a bug affecting password reset when the reset link has expired was fixed.

**C.** Entering `spec-plan`: the behavior and acceptance criteria are settled, and you need a concrete implementation outline.

1. Add a month selector to the support manager’s export UI and submit its value as `YYYY-MM` to an Express download endpoint.
2. Protect the endpoint with `requireSupportManager`. Validate the month strictly and reject invalid input with HTTP `400`.
3. Compute UTC boundaries: `closedFrom` is midnight on the first day of the selected month; `closedBefore` is midnight on the first day of the following month. Use an inclusive lower bound and exclusive upper bound.
4. Retrieve tickets using the authenticated tenant context:
   ```js
   const tickets = await listTickets({
     tenantId: req.tenantId,
     closedFrom,
     closedBefore,
   });
   ```
   Confirm that the existing query returns only closed tickets and applies both tenant and date filters.
5. Map tickets to the two requested columns, then call `writeCsv(rows, columns)`. For this outline, assume “timestamp” means the ticket’s closure time; serialize it as a UTC ISO timestamp and use the existing public reference field.
6. Return a CSV download with `Content-Type: text/csv; charset=utf-8` and a filename such as `closed-tickets-2026-10.csv`. An empty result should produce a header-only CSV.
7. Verify authorization, tenant isolation, exclusion of open tickets, inclusion at the month’s start, exclusion at the next month’s start, December rollover, invalid month input, empty results, and correct CSV escaping.

This is a chat-only outline; no implementation or checks have been run.

**D.** For `null`, the function returns `'(missing)'` because `null == null` is true. For an empty string, it returns `''` because the condition is false and `String('')` remains empty. The supplied snippet is sufficient; Graphify’s unavailability does not affect this explanation.
