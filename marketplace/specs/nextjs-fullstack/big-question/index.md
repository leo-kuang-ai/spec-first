# Common Issues and Solutions

> Documented pitfalls discovered while building production Next.js fullstack applications.
> These issues apply to any project using Next.js with PostgreSQL, Drizzle ORM, Tailwind CSS, and i18n.

## Severity Levels

| Level    | Description                                          |
| -------- | ---------------------------------------------------- |
| Critical | Build fails or data corruption                       |
| Warning  | Degraded experience, workaround exists               |
| Info     | Minor visual issue, easy to fix once identified      |

---

## Issue Index

| Issue                                                            | Category         | Severity |
| ---------------------------------------------------------------- | ---------------- | -------- |
| [postgres-json-jsonb.md](./postgres-json-jsonb.md)               | Database/ORM     | Critical |
| [sentry-nextintl-conflict.md](./sentry-nextintl-conflict.md)    | Plugin Conflicts | Critical |
| [turbopack-webpack-flexbox.md](./turbopack-webpack-flexbox.md)   | Build System     | Warning  |
| [webkit-tap-highlight.md](./webkit-tap-highlight.md)             | Mobile/CSS       | Info     |

---

## How to Contribute

Found a new pitfall? Add it to this directory:

1. Create a new `.md` file with a descriptive kebab-case name
2. Follow the existing format: Problem, Root Cause, Solution, Key Takeaways
3. Update this index table with the correct category and severity
4. Include reproducible code examples whenever possible
