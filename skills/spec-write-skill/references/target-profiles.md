# Target Profiles

仅当目标宿主 metadata、invocation 或 packaging 会改变交付时读取。Target profile 是带来源和限制的条件事实，不是 portable contract。

## Open Agent Skills Portable Floor

- Package root 包含 `SKILL.md`。
- Frontmatter 至少有 `name` 和 `description`。
- `name` 使用 kebab-case；description 表达触发意图和近邻边界。
- Runtime 依赖只来自被明确引用的 package resources。
- 未知 extension fields 默认保留并报告；没有 target evidence 时不擅自删除。

Portable validator 只能检查本 Skill 声明支持的 YAML subset。合法但未支持的 YAML 返回 `incomplete`，不能误报 invalid。

## Codex Profile

Evidence record:

- target: Codex
- source: `https://developers.openai.com/codex/skills`
- local_source: `skills/spec-write-skill/agents/openai.yaml`
- checked_at: 2026-07-12
- verification: `npx jest --runTestsByPath tests/unit/spec-write-skill-contracts.test.js tests/unit/plugin-modules.test.js tests/smoke/cli-smoke.test.js --runInBand`
- limitations: 当前只确认 project package 的 Codex-facing sidecar 和 implicit invocation policy，不把该字段外推为其他宿主标准或 execution sandbox。
- invalidation_condition: Codex 官方 metadata schema、sidecar path、policy key 或 runtime projection 行为变化时重新核对并降级旧事实。

Confirmed source 表明 project packages 可提供 `agents/openai.yaml` 作为 Codex-facing metadata。`spec-write-skill` 自身使用：

```yaml
policy:
  allow_implicit_invocation: false
```

该字段只限制 invocation，不等于 execution safety。涉及 shell、network、secret、外发或不可逆动作时，仍需在 Skill contract 中定义最小权限、允许范围、确认点和失败行为。

## Other Targets

Claude、Cursor、Kiro、Qoder 或其他宿主只有在当前项目 source、官方文档或实际 packaging 结果提供 direct evidence 时才增加 delta。没有 confirmed delta 时：

- 保持单一 portable package；
- 报告 target readiness `degraded`；
- 不把 Codex metadata 翻译或激活为其他宿主的等价配置；package 即使携带该 sidecar，非 Codex consumer 也只忽略它；
- 不发明 adapter、projection engine 或目标专属 sidecar。

## Profile Evidence

新增 target rule 时记录：target、source URL/path、checked_at、影响字段/文件、验证命令、limitations、失效条件。过期或无法回源的事实降级为 advisory。

## Target Payload Smoke

只在 direct target evidence 已命中且临时 payload 已由宿主/target staging owner 准备后，调用 bundled `inspect-context.cjs` 的 target payload smoke：

```bash
node "$SKILL_DIR/scripts/inspect-context.cjs" --payload-smoke <temporary-payload-dir> \
  --runtime-file-set <run-local-runtime-file-set.json> --json
```

它不创建、复制或执行 payload：run-local `runtime_file_set` 必须逐项声明 path、consumer 和 source-derived `expected_sha256`（`SKILL.md` reference、selected runtime script/asset、target sidecar 或 metadata），并与实际 payload 双向闭包。payload 缺声明 runtime reference、包含 `evals/`、`reports/`、repo-local docs 或 secret-like paths，或 metadata/runtime file drift 时 target readiness 为 `not-ready`；动态依赖无法静态声明时为 `degraded`。真实 invocation/init/publish 或 target-provided validator 仍需单独授权和 evidence，不能由 smoke 推断其他 host feature parity。
