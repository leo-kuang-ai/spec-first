# Node Quality Pilot Scenarios

| Workflow | Input Signal | Expected Quality Gain | Must Not |
| --- | --- | --- | --- |
| spec-code-review | auth/session/runtime code changed | security, correctness, and testing findings have evidence and not_reviewed disclosure | select more than workflow cap or let agent output final merge verdict |
| spec-plan | new API and data model plan | architecture/API/data decisions include evidence, alternatives, risks, and test strategy | override repository facts with ECC best practice |
| spec-doc-review | large requirements document with scope and security implications | coherence, feasibility, scope, and security-lens findings are deduped and ranked | replace doc-review native schema or skip deferred questions |
| spec-skill-audit | skill/agent prompt governance change | agent-native, standards, CLI readiness, security, and simplicity checks prevent overreach | depend on cached runtime skill definitions instead of fresh source |
