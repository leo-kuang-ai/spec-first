| 维度 | 最终裁决 | 关键证据（file:line + 一句事实） | 一句理由 |
|---|---|---|---|
| D04 | fail | `skills/spec-write-skill/SKILL.md:59` 要求 apply 更新必要的 tests/docs/Changelog；`skills/spec-write-skill/scripts/validate-authoring-preview.cjs:141-144` 对声明路径要求位于 canonical source root 内，root 外路径会报错。 | 两项承诺无法由当前 preview 写集同时满足：涉及包外文件的完整交付不能绑定到同一个合法 preview。 |
| B02 | fail | `skills/spec-write-skill/references/authoring-workbench.md:35` 要求 manifest、snapshot、would-change 等绑定写集；`skills/spec-write-skill/scripts/validate-authoring-preview.cjs:142-144` 拒绝 canonical source root 之外的声明路径。 | semantic envelope 要覆盖完整 changed surfaces，但消费者将可验证写集限制在 Skill canonical root 内，二者冲突。 |
| B05 | fail | `skills/spec-write-skill/scripts/validate-skill.cjs:172-176` 发现 root 路径含 symlink 后标记 inventory halted；但 `:357-362` 随后仍可能通过 realpath 后的路径检查并读取 `SKILL.md`。 | 对 symlink root 的停止承诺只阻止 inventory，没有阻止后续目标文件读取，失败路径未闭合。 |
| X02 | fail | `skills/spec-write-skill/references/authoring-method.md:104-111` 规定迁移 disposition 和未知文件默认保留；`skills/spec-write-skill/scripts/validate-authoring-preview.cjs:142-144` 则拒绝 canonical source root 外的路径。 | 迁移保留规则本身存在，但涉及 contract、consumer 或 governance 的联动改动无法纳入同一合法 preview 写集。 |
| X03 | fail | `skills/spec-write-skill/references/delivery-gates.md:17,37` 承诺 no-follow inventory 并将其用于外部或未知 package；`skills/spec-write-skill/scripts/validate-skill.cjs:172-176,357-362` 在 root 含 symlink 时仍可能读取 `SKILL.md`。 | 高风险分支依赖的 validator 没有兑现根路径 no-follow，外部 package 的读取边界不可靠。 |

### 修复建议

- **D04、B02、X02：** 保留单 repo、单 Skill owner 与 canonical root 语义；为 preview 明确支持经授权的精确 supporting source paths，并让 snapshot、写集绑定和 receipt 覆盖这些路径。补充「Skill + tests/docs/Changelog」跨路径通过案例，以及未授权相邻路径被拒绝的案例。
- **B05、X03：** 在任何目标内容读取前，对 root/ancestor symlink、授权范围外路径及无法确认的 containment 失败执行短路；补测试确认这些场景不会读取目标目录或 `SKILL.md`，而不只是断言最终结果为 fail。
