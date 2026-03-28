---
name: "spec:normalize-requirements-docs"
version: 1.0.0
description: |
  Use when the user provides requirement source documents in Markdown, PDF,
  DOCX, or image form and wants them converted faithfully into Markdown while
  preserving source structure, image evidence, and unresolved ambiguities.
user-invocable: true
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - AskUserQuestion
---

# Skill: normalize-requirements-docs

- Command: `/spec:normalize-requirements-docs`
- P0: Convert requirement source documents into faithful Markdown

## Scope

This is a document-conversion skill, not a requirement-analysis workflow.

It does:
- convert source documents into Markdown
- preserve original structure, ordering, and meaning
- preserve file and section hierarchy inside one output document
- analyze screenshots, diagrams, and embedded visuals only as needed to preserve source content
- record unclear or unreadable areas without guessing

It does **not**:
- rewrite the document as a PRD
- summarize away source detail
- invent missing business rules
- translate into another language unless explicitly requested
- turn the output into a planning or review workflow

## Supported Inputs

Priority v1 formats:
- Markdown: `.md`
- PDF: `.pdf`
- DOCX: `.docx`
- Images: `.png`, `.jpg`, `.jpeg`, `.webp`

Input may be:
- one file
- multiple files
- a folder containing source documents

If multiple files are provided, treat them as one source bundle and preserve file-level provenance.

## Templates and Examples

**Template location:**
- `normalize-requirements-docs/templates/normalized-source.md`

**Example location:**
- `normalize-requirements-docs/templates/examples/hk-us-brokerage-normalized-source.example.md`

The example demonstrates:
- Multi-file bundle (MD + PDF + DOCX + images)
- Chinese language output
- Image processing with annotations
- Clarifications handling

## Output Surface

Write exactly one file:
- `docs/requirements/{date}-{topic}-normalized-source-v{n}.md`

This file is the only durable output of the skill.

### Output Structure

The output file MUST follow the original document's structure:

1. **YAML front matter** - metadata (topic, date, language, etc.)
2. **Original document content** - exact structure as in source
   - Preserve all original section headings and numbering
   - Preserve heading depth hierarchy
   - Place images inline at their original positions
3. **Appendix: Clarifications** - at the end, only if there are unclear items

DO NOT impose a fixed template structure (like "Converted Markdown Content", "Image Notes", etc.).
The output should look like the original document converted to Markdown, not reorganized.

### Output Naming Rule

`{date}` is the normalization output date in `YYYY-MM-DD`.

`{topic}` is derived from the primary document topic or the user-provided topic.

`{n}` is the normalized output version number, starting at `1`.

Rules:
- use the normalization output date, not the source creation date
- Chinese is allowed in `{topic}`
- keep the topic short, stable, and human-readable
- remove only clearly unsafe filename characters such as `/`, `\\`, `:`, `*`, `?`, `"`, `<`, `>`, `|`
- prefer the document's natural title over an artificial English slug
- use `v1` for the first formal normalized output of the same topic on the same date
- increment to `v2`, `v3`, etc. only when generating another formal output for the same topic and date
- if a same-date same-topic file already exists, find the next available version instead of overwriting an existing file

Examples:
- `docs/requirements/2026-03-28-退款流程-normalized-source-v1.md`
- `docs/requirements/2026-03-28-商家入驻-normalized-source-v1.md`
- `docs/requirements/2026-03-28-checkout-refund-normalized-source-v2.md`

## Core Rules

1. **Source fidelity first**
   - Preserve what the source says before interpreting it.
   - Do not silently rewrite product meaning.

2. **Structure mapping, not content rewriting**
   - Map headings, paragraphs, lists, tables, and notes into Markdown.
   - Preserve original order and hierarchy as much as possible.
   - **Preserve original heading numbering** (e.g., "一、", "3.1", "3.11") exactly as in source
   - **Preserve original heading depth** - do not flatten or nest differently
   - Map source headings to appropriate Markdown levels (H1-H6) based on their actual depth in the source

3. **Visual evidence is part of the source**
   - Screenshots, diagrams, redlines, and annotated images must be converted into notes when they carry requirement content.
   - Do not drop visible labels, numbers, statuses, or marked changes.
   - Treat visual evidence as primary-source material, not decorative attachment, when it contains requirement meaning.

4. **Unclear points must be recorded, not guessed**
   - If content is blurry, incomplete, contradictory, or unreadable, record that in `Clarifications`.
   - Never fabricate missing text, rules, thresholds, or flow steps.
   - Do not place uncertainty wording such as `unclear`, `unknown`, `not confirmed`, `may`, or `possibly` inside `Converted Markdown Content`.
   - Do not place uncertainty wording inside `Notes`.
   - Move uncertainty into `Clarifications` or `Visual-only implications`.
   - Do not add unresolved image-context notes such as "reference position unclear" or "needs confirmation" inside the image-notes body.

5. **Keep the output in the source language by default**
   - The normalized Markdown should follow the dominant source language unless the user explicitly requests translation.

## Required Behavior

### Source Language Detection Rules

Before conversion, identify the dominant language:

**Evidence to use:**
- Primary document language
- Heading language across bundle
- UI label language in screenshots
- Repeated business terminology

**Decision process:**
1. If single clear language → use that language for output
2. If mixed but primary document is clear → use primary document language
3. If uncertain → ask user which language to use

**Output rules:**
- Normalized Markdown follows dominant source language
- Keep copied field labels in original language when that preserves fidelity
- Do not translate unless user explicitly requests it

Record language detection basis in metadata.

### Domain Hint Rules

If the business domain is clear in the source itself, record it as optional metadata.

This metadata is secondary. It exists only to preserve terminology when the source already makes the domain explicit.
It must not change the structure, wording, or certainty level of the converted Markdown body.
If the source does not make the domain explicit, omit this metadata entirely.

Typical domains include:
- securities
- banking
- lending / credit
- payments
- insurance
- wealth management
- compliance / risk control

If the domain is uncertain:
- mark it uncertain
- use neutral wording
- do not turn domain assumptions into source facts

### Image and Diagram Rules

For each meaningful image or diagram:

**Always fill:**
- Source anchor (required format: `path | locator | optional-sub-locator`)
- Visible text / OCR (when readable)
- Notes (grounded visible observations only)

**Add when applicable:**
- ASCII layout (when UI structure or flow diagram carries requirement meaning)
- Image role (when it adds useful clarity)
- Current vs target state (only with explicit before/after evidence)
- Change points (only when source shows actual changes)
- Visual-only implications (only when image implies something text doesn't state)

**Process flow:**
1. Extract readable text via OCR
2. Record directly visible content in Notes
3. Add ASCII diagram if flow/structure would be lost without it
4. Mark inferred content separately as visual-only implications
5. Move unreadable/ambiguous items to Clarifications

**Notes rules:**
- Use Notes only for directly visible, grounded observations
- Do not put unreadable details, uncertainty, or questions in Notes
- Move unresolved items to Clarifications

**Decorative images:**
- Note as decorative, no further analysis required

If image is too blurry, cropped, or ambiguous:
- Do not guess
- Record issue in Clarifications with source anchor

### Clarification Rules

`Clarifications` must capture unresolved issues such as:
- unreadable labels
- contradictory documents
- missing page context
- incomplete diagrams
- low-confidence OCR
- values that cannot be read reliably

If there are no clarifications, keep the section and state `None`.

### Source Anchor Format

Use one consistent anchor format everywhere:
- `relative/path/to/file.ext | locator | optional-sub-locator`

Rules:
- always start with the relative source path
- use the second segment for the primary locator, such as a heading name, page number, or screen name
- use the third segment only when it improves precision, such as a subsection name, figure id, or image id
- keep the order stable instead of mixing `>` and free-form notes

Examples:
- `broker-prd/01-overview.md | Product Scope`
- `broker-prd/02-onboarding.pdf | p.3 | Account Opening Entry`
- `broker-prd/images/order-ticket.png | image | Order Ticket Screen`

## Workflow

### Step 0: Prerequisites check

Before starting conversion, verify:
- source files are accessible
- output directory exists or can be created
- required tools are available (PDF extraction, image reading)

Classification:
- If all prerequisites met → proceed to Step 1
- If source files missing or inaccessible → stop with `NEEDS_CONTEXT`
- If required tools unavailable → stop with `BLOCKED`
- If partial tools unavailable → enter degraded mode (see Degraded Mode section)

### Step 1: Inventory and decide

Identify:
- every input file and type
- rough size signals (page count, section count, image count)
- source language signals
- domain signals (only when obvious)

Determine output file name:
- use today's normalization date as `{date}`
- prefer primary source document title for `{topic}`
- otherwise use user-provided topic
- otherwise derive from most representative file name
- default `{n}` to `1` unless same-topic same-date file exists

Decision point:
- If single clear file OR clear file bundle with obvious language/topic → proceed directly to Step 2
- If ambiguity triggers present → enter confirmation mode (see Step 1.5)

Ambiguity triggers:
- Multiple files with conflicting topics
- Mixed language with no clear primary document
- Output path does not exist and user preference unclear

If no usable source files present, stop with `NEEDS_CONTEXT`.

### Step 1.5: Confirmation mode (only if needed)

Enter confirmation mode only when ambiguity triggers from Step 1 are present.

Ask minimal questions to resolve:
- Which file is the primary document? (if topic conflict)
- What language should the output use? (if mixed language unclear)
- Where should output be written? (if path missing and unclear)

Do not ask if the answer is obvious from context.

### Step 2: Create output skeleton and extract content

Create output file from `normalize-requirements-docs/templates/normalized-source.md`.

Replace placeholders with output language equivalents, then fill metadata:
- topic, output file, output date, output version
- source language, output language, language detection basis
- optional domain hint (only if source makes it explicit)

Process each file by format:
- Markdown: read directly
- PDF: extract text and identify visuals
- DOCX: extract text and identify visuals
- Image: analyze visually

If environment cannot read a required file type, enter degraded mode or stop with `BLOCKED`.

### Step 3: Convert and preserve content

For each source file, in sequence:

**Convert structure to Markdown:**
- headings, paragraphs, lists, tables, callouts
- preserve original order and nesting
- preserve file hierarchy in output

**Process images inline:**

When encountering an image in the source document:
1. **Extract**: OCR visible text
2. **Observe**: Record directly visible content in `Notes`
3. **Structure**: Add ASCII layout if UI/flow structure carries requirement meaning
4. **Infer**: Mark visual-only implications separately (only when image shows something text doesn't)
5. **Clarify**: Move unreadable/ambiguous items to `Clarifications`

**Image placement rule:**
- **Place image notes at the exact location where the image appears in the source document**
- **Do NOT move all images to a separate section at the end**
- **Preserve the flow of text → image → text as in the original**

Always fill:
- Source anchor
- Visible text / OCR (when readable)
- Notes (grounded observations only)

Optional fields (use only when applicable):
- ASCII layout (for flows, diagrams, UI structure)
- Image role (when it adds clarity)
- Current vs target state (only with explicit before/after evidence)
- Change points (only when source shows actual changes)
- Visual-only implications (only when image implies something text doesn't state)

Decorative images: note as decorative inline, no further analysis.

**Record clarifications:**
Whenever content is unclear, contradictory, truncated, or low-confidence:
- add to `Clarifications` table
- include precise source anchor
- state why unclear and impact

**Rules:**
- Do not summarize away detail
- Do not place uncertainty in `Converted Markdown Content` or `Notes`
- Move all unresolved items to `Clarifications`

### Step 4: Self-check and complete

Verify before finishing:
- [ ] Output language matches source language (unless user requested translation)
- [ ] Original hierarchy recoverable in `Converted Markdown Content`
- [ ] Not a compressed shorthand (detail preserved)
- [ ] Image evidence preserved where meaningful
- [ ] Screenshots translated to explicit text notes
- [ ] No major source content silently dropped
- [ ] Unclear items captured, not guessed
- [ ] `Notes` contains only grounded visible observations
- [ ] No completion-status section in output file

Minimum acceptance invariants:
- [ ] Every source file has destination in output
- [ ] Every meaningful image has notes or explicit decorative classification
- [ ] `Converted Markdown Content` contains no uncertainty wording
- [ ] Every clarification row includes valid source anchor
- [ ] Output file contains no completion-status section

If any check fails, revise before completing.

## Degraded Mode

When tools are partially unavailable, continue with reduced capability:

**PDF extraction unavailable:**
- Skip PDF files
- Record in `Clarifications`: "PDF extraction unavailable - file skipped"
- Continue with other formats
- Output `DONE_WITH_CONCERNS`

**Image reading unavailable:**
- Record file name and issue in `Clarifications`
- Continue with other images
- Output `DONE_WITH_CONCERNS`

**Partial file failures:**
- Process successful files
- List failed files in `Clarifications`
- Output `DONE_WITH_CONCERNS`

Degraded mode allows partial success rather than complete failure.

The final file should contain exactly these semantic sections:
- topic
- document metadata
- source manifest
- converted Markdown content
- image / diagram notes
- clarifications

Write the section titles in the output language instead of keeping fixed English headings.

## Completion Status Protocol

Use exactly one:
- `DONE`
- `DONE_WITH_CONCERNS`
- `NEEDS_CONTEXT`
- `BLOCKED`

### `DONE`
- Markdown conversion complete
- Structure and visual evidence preserved
- No unresolved issues blocking basic use

### `DONE_WITH_CONCERNS`
- Markdown conversion usable
- Some non-blocking ambiguities remain (captured in `Clarifications`)
- Or degraded mode was used (some files skipped)

### `NEEDS_CONTEXT`
- Source incomplete, ambiguous, or partially unreadable
- But conversion can partially proceed
- Missing information specified in `Clarifications`

### `BLOCKED`
- Required file type cannot be read
- Or environment cannot access source files
- Or all tools unavailable (no degraded mode possible)

## Final Response Format

Always end with:
- completion status
- one short paragraph describing what was converted
- explicit clarification items or blockers
- exact file written
