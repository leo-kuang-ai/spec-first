# Tool Integration Gates

## P0 Gate

Entry criteria:

- baseline Skills and MCP are defined in `bootstrap-manifest.ts`
- `update`, `doctor`, `init --bootstrap`, `postinstall` share the same baseline vocabulary

Exit criteria:

- baseline install path is test-covered
- config writes support backup and rollback
- `doctor` can explain missing impact and tool policy

## P1 Gate

Entry criteria:

- P0 exit criteria are all green
- host adapters, tool registry, capability matrix exist

Exit criteria:

- update / doctor consume adapter and selection data
- tool choice for `research / review / verify` is documented and validated

## P2 Gate

Entry criteria:

- P1 exit criteria are all green
- baseline path is stable for Claude and Codex

Exit criteria:

- Gemini / Cursor adapters have explicit capability status
- component install plan is available
- standard templates and review checklists are in place

