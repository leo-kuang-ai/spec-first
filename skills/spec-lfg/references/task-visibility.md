# Task Visibility

Keep pipeline stages visible to the caller. Record the selected plan path, task or unit identities, returned status, verification results, blockers, and the exact handoff boundary. Conditional stages are added only when their gate fires; skipped stages retain an explicit skipped reason. Do not treat a green test, commit, or PR fact as proof that upstream tasks are complete.
