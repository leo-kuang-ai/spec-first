# Setup And Build

Read before preparing an Xcode test run. The entrypoint owns mutation and evidence boundaries.

## Verify Readiness

Require Xcode with command-line tools, a valid project/workspace, at least one simulator, and a connected XcodeBuildMCP server. Call its available `list_simulators` tool; resolve the actual tool name from the active host.

If the tool is missing or fails, report the actual failure and stop dependent testing. Return `spec-runtime-setup` as the setup handoff. XcodeBuildMCP can be configured using `npx -y xcodebuildmcp@latest mcp` or a supported installation path, but do not install or change host configuration from a testing request. Continue only after a successful readiness probe.

## Select Project, Scheme, And Simulator

Use `discover_projs` and `list_schemes` for the project/workspace. A named argument selects that scheme; blank or `current` selects the default/last-used scheme when known. Resolve genuine ambiguity with the user rather than inventing a default.

Record the entrypoint's pre-build target/source identity. Use `list_simulators` to select an available device. Record whether it was already booted. Boot only when needed using `boot_simulator`, then wait for readiness.

## Build, Install, And Launch

1. Call `build_ios_sim_app` with the selected project/workspace and scheme. On failure, preserve the build errors and stop before installation. On success, retain the actual built app path.
2. Call `install_app_on_simulator` for that path and simulator UUID. Stop on failure.
3. Call `launch_app_on_simulator` for the actual bundle ID and simulator. Stop on failure.
4. Start `capture_sim_logs` and retain this run's capture handle. Confirm the app is visibly running with a screenshot/observation and the log capture is usable. A successful launch call alone does not prove the app remained open.

Do not proceed to screen verification until these observations support readiness. Preserve a missing log or visibility limitation, report the failed stage, and use [Test and report](test-and-report.md) for honest status and run-owned cleanup.
