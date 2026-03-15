# Tool Integration Review Checklists

## Install Chain Review

- `postinstall`, `init --bootstrap`, `update` agree on baseline scope
- first-install guidance is explicit
- failure path preserves actionable remediation text

## Config Safety Review

- writes create backup before mutation
- merge is preferred over overwrite
- failure path restores previous state
- repeated execution is idempotent

## Runtime Policy Review

- scenario-to-tool mapping is explicit
- research prefers `fetch + context7`
- code analysis prefers `serena`
- browser verification prefers `playwright-mcp`
- fallback path is documented for each scenario

## Multi-Agent Review

- implementer confirms scope against task
- spec reviewer checks no over-build / under-build
- code reviewer checks safety, maintainability, and regression risk
- final verification includes tests and command output
