# Task Visibility

Before step 1, use the platform's task-tracking capability when available to publish a short view of the remaining pipeline outcomes. Before invoking a child skill, replace or clear LFG's view so only the child skill's task surface is visible; after it returns, recreate or refresh LFG's remaining work. Add conditional stages only when their gate fires; skipped stages retain an explicit reason. If no task-tracking capability is available, continue without simulating a task list in chat. Do not treat a green test, commit, or PR fact as proof that upstream tasks are complete.

## Chat narration and completion discipline

Narrate pipeline progress in chat as each step settles: one line when a step starts mattering to the user (a plan written, a work return accepted, a review pass folded in) and one line when its outcome lands. Narration reports observed outcomes, never intentions — do not announce a step as progressing before its invocation has produced an observable result, and do not count a step's evidence (a green test, a returned envelope, a created PR) as a later step's completion.

A step is done only after it actually ran. The turn does not end before the pipeline reaches its `DONE` state or an explicit `GATE` stop: a stop means the blocking condition, its owner, and the recovery path are stated in chat. Ending a turn with steps unstarted and no gate stated is a silent stall, not a pause.
