---
name: spec-test-xcode
description: "Build and test iOS apps on simulator using XcodeBuildMCP. Use after making iOS code changes, before creating a PR, or when verifying app behavior and checking for crashes on simulator."
argument-hint: "[scheme name or 'current' to use default]"
disable-model-invocation: true
---

# Xcode Test Skill

Build, install, and test iOS apps on the simulator using XcodeBuildMCP. Captures screenshots, logs, and verifies app behavior.

## Prerequisites

- Xcode installed with command-line tools
- XcodeBuildMCP MCP server connected
- Valid Xcode project or workspace
- At least one iOS Simulator available

## Workflow

### 0. Verify XcodeBuildMCP is Available

Check that the XcodeBuildMCP MCP server is connected by calling its `list_simulators` tool.

MCP tool names vary by platform:
- Claude Code: `mcp__xcodebuildmcp__list_simulators`
- Other platforms: use the equivalent MCP tool call for the `XcodeBuildMCP` server's `list_simulators` method

If the tool is not found or errors, inform the user they need to add the XcodeBuildMCP MCP server:

```
XcodeBuildMCP not installed

Install via Homebrew:
  brew tap getsentry/xcodebuildmcp && brew install xcodebuildmcp

Or via npx (no global install needed):
  npx -y xcodebuildmcp@latest mcp

Then add "XcodeBuildMCP" as an MCP server in your agent configuration
and restart your agent.
```

Do NOT proceed until XcodeBuildMCP is confirmed working.

MCP readiness 只证明 provider 能响应 capability probe；它不证明目标 App 已完成 build、install、launch，或渲染了任何被测 screen。

### 1. Discover Project and Scheme

Call XcodeBuildMCP's `discover_projs` tool to find available projects, then `list_schemes` with the project path to get available schemes.

If an argument was provided, use that scheme name. If "current", use the default/last-used scheme.

第一次 build 前，记录目标 project/workspace path、scheme、所选 simulator identity，以及当前可获得的最佳 source identity。优先记录 Git revision 与 dirty-state/fingerprint context；目标不是 Git worktree 或无法捕获 fingerprint 时，必须将其保留为显式 source-binding limitation，不得让该字段隐式缺失。

### 2. Boot Simulator

Call `list_simulators` to find available simulators. Boot the preferred simulator (iPhone 15 Pro recommended) using `boot_simulator` with the simulator's UUID.

Wait for the simulator to be ready before proceeding.

### 3. Build the App

Call `build_ios_sim_app` with the project path and scheme name.

**On failure:**
- Capture build errors
- Report to user with specific error details

**On success:**
- Note the built app path for installation
- Proceed to step 4

### 4. Install and Launch

1. Call `install_app_on_simulator` with the built app path and simulator UUID
2. Call `launch_app_on_simulator` with the bundle ID and simulator UUID
3. Call `capture_sim_logs` with the simulator UUID and bundle ID to start log capture

### 5. Test Key Screens

For each key screen in the app:

**Take screenshot:**
Call `take_screenshot` with the simulator UUID and a descriptive filename (e.g., `screen-home.png`).

**Review screenshot for:**
- UI elements rendered correctly
- No error messages visible
- Expected content displayed
- Layout looks correct

**Check logs for errors:**
Call `get_sim_logs` with the simulator UUID. Look for:
- Crashes
- Exceptions
- Error-level log messages
- Failed network requests

**Known automation limitation — SwiftUI Text links:**
Simulated taps (via XcodeBuildMCP or any simulator automation tool) do not trigger gesture recognizers on SwiftUI `Text` views with inline `AttributedString` links. Taps report success but have no effect. This is a platform limitation — inline links are not exposed as separate elements in the accessibility tree. When a tap on a Text link has no visible effect, prompt the user to tap manually in the simulator.

`xcrun simctl openurl <device> <URL>` is an effect-bearing fallback, not an automatic tap substitute. Parse the exact target before execution: reject `file:`, `data:`, and `javascript:` URLs; allow credential-free loopback HTTP(S) only after displaying the resolved URL; and require the run-local fact `url_open_authorization: authorized | missing` for external HTTP(S) or custom app schemes. Show the exact target, scheme, expected network/app-state effect, and device before asking. Missing authority returns `url_open_authorization_missing` with zero `simctl openurl` calls. Permission to build/test, simulator selection, a visible link, or a known URL does not imply this authority.

### 6. Human Verification (When Required)

Pause for human input when testing touches flows that require device interaction.

| Flow Type | What to Ask |
|-----------|-------------|
| Sign in with Apple | "Please complete Sign in with Apple on the simulator" |
| Push notifications | "Send a test push and confirm it appears" |
| In-app purchases | "Complete a sandbox purchase" |
| Camera/Photos | "Grant permissions and verify camera works" |
| Location | "Allow location access and verify map updates" |
| SwiftUI Text links | "Please tap on [element description] manually — automated taps cannot trigger inline text links" |

Ask the user using the platform's blocking question tool: `AskUserQuestion` in Claude Code (call `ToolSearch` with `select:AskUserQuestion` first if its schema isn't loaded) or `request_user_input` in Codex. Fall back to numbered options in chat only when no blocking tool exists in the harness or the call errors (e.g., Codex edit modes) — not because a schema load is required. Never silently skip the question:

```
Human Verification Needed

This test requires [flow type]. Please:
1. [Action to take on simulator]
2. [What to verify]

Did it work correctly?
1. Yes - continue testing
2. No - describe the issue
```

### 7. Handle Failures

When a test fails:

1. **Document the failure:**
   - Take screenshot of error state
   - Capture console logs
   - Note reproduction steps

2. **Ask the user how to proceed:**

   ```
   Test Failed: [screen/feature]

   Issue: [description]
   Logs: [relevant error messages]

   How to proceed?
   1. Fix now - debug, propose a fix, rebuild and retest
   2. Skip - continue testing other screens
   ```

3. **If "Fix now":** investigate, propose a fix, rebuild and retest。发生 behavior-bearing source mutation 后，在下一次 rebuild 前刷新 build-source identity，并以新 identity 取代旧 build identity
4. **If "Skip":** log as skipped, continue

### 8. Test Summary

After all tests complete, present a summary:

```markdown
## Xcode Test Results

**Project:** [project name]
**Scheme:** [scheme name]
**Simulator:** [simulator name]
**Provider:** XcodeBuildMCP [可用时填写 server/tool identity]
**Target identity:** [project/workspace path、scheme、simulator UUID、bundle ID]
**Source binding:** [Git revision 加 clean/dirty state、caller fingerprint，或显式 unavailable limitation]
**Evidence authority:** [provider-confirmed / transcribed / mixed]
**Freshness:** [build 开始时间、final tested action 完成时间、最近一次 pre-build identity 与最终 identity 的比较结果]
**Limitations:** [manual-only flows、skipped screens、missing logs、provider/tool gaps]
**Claim ceiling:** [observed build/run/screens 能直接支持的精确范围]

### Build: Success / Failed

### Screens Tested: [count]

| Screen | Status | Notes |
|--------|--------|-------|
| Launch | Pass | |
| Home | Pass | |
| Settings | Fail | Crash on tap |
| Profile | Skip | Requires login |

### Console Errors: [count]
- [List any errors found]

### Human Verifications: [count]
- Sign in with Apple: Confirmed
- Push notifications: Confirmed

### Failures: [count]
- Settings screen - crash on navigation

### Result: [PASS / FAIL / PARTIAL]
```

只有真实调用 XcodeBuildMCP tool 并取得返回结果时，才能使用 `provider-confirmed`。人工观察和 caller 提供的 command output 保持为 `transcribed`，除非它们自身带有可验证的 provider/process receipt。

在最后一次 build/retest 以及全部 final tested actions 完成后，重新捕获与最近一次 pre-build identity 同口径的 revision 与 working-tree fingerprint，并比较两者。只有 comparison 一致时，summary 才能标记 `source-bound`；comparison 不一致或无法重新捕获时，必须记录 limitation、禁止 `source-bound`，并将结果降为 `PARTIAL`/degraded。caller 需要最终树证据时，必须对新 identity 重新 build/retest。只有 revision 而没有 dirty-state 或 fingerprint context 属于显式 limitation，不能证明完整 working tree。

`PARTIAL` 必须列出 limitation，不得改写成 `PASS`。Provider readiness、successful build、App launch、screenshot capture、log inspection 与 human verification 是彼此分离的 observations；只能报告实际完成的阶段。

本 Skill 向 caller 返回 bounded evidence，不创建平行的 `EVIDENCE.md` 或 shared evidence artifact。只有存在真实 canonical command identity，且 caller 保留 provider、target、source binding、freshness 与 limitations 时，才能在自己的 run summary 中引用结果；否则将其作为 `verification-run-summary.v1` 之外的 provider evidence，并降低 claim。

### 9. Cleanup

After testing:

1. Call `stop_log_capture` with the simulator UUID
2. Optionally call `shutdown_simulator` with the simulator UUID

## Quick Usage Examples

```bash
# Test with default scheme
spec-test-xcode

# Test specific scheme
spec-test-xcode MyApp-Debug

# Test after making changes
spec-test-xcode current
```

## Invocation Boundary

本 skill 仅由用户显式调用。当前没有 `spec-code-review` 或其他 public workflow 的自动 caller；代码审查中的 Swift 静态 lens 不等于 Simulator 构建与运行验证。
