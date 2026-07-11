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

Confirmed local source: project packages may provide `agents/openai.yaml` as Codex-facing metadata。`spec-write-skill` 自身使用：

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
