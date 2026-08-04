# Contributing

Thanks for helping improve `spec-first`.

This project is Chinese-first: `README.md` is the default entry, while `README.en.md` serves international open-source readers. Keep contributions small, traceable, and grounded in the existing source/runtime boundary.

## Local Setup

```bash
npm install
npm run typecheck
npm test
```

Use narrower checks while iterating:

```bash
npm run test:unit
npm run test:smoke
npm run test:integration
npm run build
```

## Source Of Truth

Do not hand-edit generated runtime assets.

- Edit source assets under `skills/`, `agents/`, `templates/`, or `src/cli/`.
- Generated runtime copies under `.claude/`, `.codex/`, and `.agents/skills/` are disposable.
- Regenerate runtime copies with `spec-first init` and choose the target host when prompted.

## Changelog

Any source or documentation change must add a `CHANGELOG.md` entry following the existing format.

Use the project developer profile for the author. In Codex, that profile is read from `.codex/spec-first/.developer`.

## Common Change Areas

- README/docs changes: update `README.md`, `README.en.md`, the compatible `README.zh-CN.md`, relevant docs, and README contract tests when the public surface changes.
- CLI changes: update `src/cli/` and the narrowest unit/smoke tests that prove the behavior.
- Skill or agent changes: update source assets, not generated runtime copies, and add contract tests when behavior changes.
- Runtime governance changes: verify supported-host behavior and keep unified `spec-*` entrypoint mappings centralized.

## Pull Request Checklist

- The change is scoped to the stated problem.
- `CHANGELOG.md` includes the user-visible impact when applicable.
- Tests or validation commands are listed in the PR description.
- Generated runtime assets were not hand-edited as source truth.
- README links and examples remain valid for both Claude Code and Codex when they mention public workflow entrypoints.
