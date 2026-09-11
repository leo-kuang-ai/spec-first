# Strategy Update Run

Required read before editing any existing `STRATEGY.md`, including before the update summary, drift check, or target question. This reference owns strategy updates, not trackers, schedules, or implementation plans.

## Document Shape and Ownership

Read the whole document, identify sections by meaning, and determine its maintenance shape from the current file. Git history alone cannot establish a section's author or grant write authority.

- **solely-owned**: at least one `##` heading comes from the local template, every `##` heading belongs to that set (Target problem, Our approach, Who it's for, Not working on, Key metrics, Tracks, Milestones, Marketing) or an equivalent house heading (Purpose, Positioning, Users, Boundaries, Brand), and no other tool's HTML-comment marker appears anywhere. `name`, `last_updated`, and a Strategy H1 corroborate but are not required. A handwritten file using exactly this shape follows the same path; a prose-only file without template headings does not. On an authorized write, align owned headings to the local template, use its section order, and offer missing required meanings; preserve untargeted body content. Do not freeze an old format merely because STRATEGY is a shared filename.
- **multi-writer**: any other `##` heading or another tool's marker means do not reorder any section or rewrite or shorten foreign content. Only headings attributable to this skill may be aligned to the local template. When a foreign section already carries the meaning, merge into it without renaming it or adding a duplicate. Missing owned sections may be contributed within authorization, using template headings without moving other sections. With insufficient evidence or a prose-only file, make minimal edits in its own idiom: do not impose the template, add frontmatter, or restructure.

For a section marked `author-approved`, preserve both heading and body and do not move it. Do not edit a document the user does not own; report the conflict or reference it in a separately authorized file. In a multi-writer file, preserve untargeted sections' content and position. In a solely-owned file, only the heading and ordering maintenance above is allowed outside the target; body content stays unchanged. Neither drift candidates nor shape classification grant write authority over other content.

## Update Sequence

1. Summarize the current file in three to five lines, then compare every section against the repo model's stated intent, structure, relevant docs, and recent history. Do not restrict the check to commits since `last_updated`: a targeted update does not review other sections.
2. Name potentially stale sections with specific evidence as candidates, never as a verdict that strategy has changed. Recent activity shows attention, not permission to rewrite purpose, approach, or users.
3. With a focus hint, revisit that section directly. Otherwise ask which section to update, listing drift candidates first while allowing any section.
4. Read the corresponding questions in `interview.md`; challenge existing answers using repo evidence, with two rounds maximum. Preserve content the user confirms is still accurate. Do not skip necessary pushback merely because an answer is already written.
5. Offer to add the meaning of Not working on when a house-format document lacks it; do not duplicate an equivalent section. Write the addition only within current authorization and do not force new sections onto other formats.
6. If YAML frontmatter exists, update only `last_updated` to the current date. Do not add frontmatter when absent; readers use the file's own date. Check the target diff, author protection, and preservation of other content before writing back.
