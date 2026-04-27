---
description: "Run the Spec-First standards proposal workflow"
argument-hint: "[target repo path]"
---

# Spec-First Standards

This source template defines Claude command metadata only.

During `spec-first init --claude`, spec-first renders the runtime command by combining this frontmatter with the body of `skills/spec-standards/SKILL.md`.

The generated `/spec:standards` entrypoint is a Claude host runtime workflow command, not a root `spec-first` CLI subcommand.

Edit the paired skill to change workflow behavior.
