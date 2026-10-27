# CE 398 条候选路径：owner 与执行单元导航

本表绑定 [历史范围清单](historical-exclusions.json) 的 H5 集合。候选 owner 是本地入口读取位置，执行时须回源 consumer；目录存在不证明语义等价或需要更新。逐文件映射见 [candidate-owner-map.json](candidate-owner-map.json)。

| CE 导航组 | 数量 | 本地读取 owner | 执行单元 | 处理说明 |
|---|---:|---|---|---|
| `.agents/skills/ce-skill-work` | 2 | `skills/spec-write-skill` | U9 | CE authoring source；逐行为差分，不按 runtime 排除。 |
| `assets/**` | 2 | 范围/产品裁决，不指定实现 owner | U7-A | 演示/宣传 asset，范围裁决后 reference-only；不变成本地 runtime。 |
| `scripts/**` | 3 | 范围/产品裁决，不指定实现 owner | U7-A | CE 发布/测试/acpx 工具，先检查是否仅服务 CE 构建；不复制其 runner。 |
| `site/**` | 34 | 范围/产品裁决，不指定实现 owner | U7-A | CE 站点及 Jekyll 构建候选；按当前不复制 CE 产品/构建链边界补证据后 evidence-only。 |
| `skills/CODING_STANDARDS.md` | 1 | `skills/spec-project-rules` | U9 | 共享规范输入；仅映射项目规则 owner，不全量导入 CE 指令。 |
| `skills/ce-bakeoff` | 1 | 范围/产品裁决，不指定实现 owner | U9 | 产品待决策/新增入口候选；不创建同名 public Skill，先记录用途与现有能力重叠。 |
| `skills/ce-brainstorm` | 24 | `skills/spec-brainstorm` | U9 | 已有 owner 导航候选；按行为差额裁决，不预设需要改动。 |
| `skills/ce-code-review` | 40 | `skills/spec-code-review` | U2 | 已有 owner 导航候选；按行为差额裁决，不预设需要改动。 |
| `skills/ce-commit` | 1 | `skills/spec-commit` | U3 | 已有 owner 导航候选；按行为差额裁决，不预设需要改动。 |
| `skills/ce-commit-push-pr` | 8 | `skills/spec-commit-push-pr` | U3 | 已有 owner 导航候选；按行为差额裁决，不预设需要改动。 |
| `skills/ce-compound` | 18 | `skills/spec-compound` | U5 | 已有 owner 导航候选；按行为差额裁决，不预设需要改动。 |
| `skills/ce-compound-refresh` | 7 | `skills/spec-compound-refresh` | U5 | 已有 owner 导航候选；按行为差额裁决，不预设需要改动。 |
| `skills/ce-debug` | 8 | `skills/spec-debug` | U9 | 已有 owner 导航候选；按行为差额裁决，不预设需要改动。 |
| `skills/ce-doc-review` | 26 | `skills/spec-doc-review` | U9 | 已有 owner 导航候选；按行为差额裁决，不预设需要改动。 |
| `skills/ce-dogfood` | 5 | `skills/spec-dogfood` | U9 | 已有 owner 导航候选；按行为差额裁决，不预设需要改动。 |
| `skills/ce-explain` | 8 | `skills/spec-explain` | U9 | 已有 owner 导航候选；按行为差额裁决，不预设需要改动。 |
| `skills/ce-handoff` | 2 | `skills/spec-handoff` | U9 | 已有 owner 导航候选；按行为差额裁决，不预设需要改动。 |
| `skills/ce-ideate` | 17 | `skills/spec-ideate` | U9 | 已有 owner 导航候选；按行为差额裁决，不预设需要改动。 |
| `skills/ce-noslop` | 3 | 范围/产品裁决，不指定实现 owner | U9 | 产品待决策/新增入口候选；不创建同名 public Skill，先记录用途与现有能力重叠。 |
| `skills/ce-optimize` | 18 | `skills/spec-optimize` | U4 | 已有 owner 导航候选；按行为差额裁决，不预设需要改动。 |
| `skills/ce-plan` | 32 | `skills/spec-plan` | U9 | 已有 owner 导航候选；按行为差额裁决，不预设需要改动。 |
| `skills/ce-polish` | 9 | `skills/spec-polish` | U9 | 已有 owner 导航候选；按行为差额裁决，不预设需要改动。 |
| `skills/ce-pov` | 15 | `skills/spec-pov` | U9 | 已有 owner 导航候选；按行为差额裁决，不预设需要改动。 |
| `skills/ce-product-pulse` | 3 | `skills/spec-product-pulse` | U9 | 已有 owner 导航候选；按行为差额裁决，不预设需要改动。 |
| `skills/ce-promote` | 3 | `skills/spec-promote` | U9 | 已有 owner 导航候选；按行为差额裁决，不预设需要改动。 |
| `skills/ce-prototype` | 10 | `skills/spec-prototype` | U9 | 已有 owner 导航候选；按行为差额裁决，不预设需要改动。 |
| `skills/ce-resolve-pr-feedback` | 10 | `skills/spec-resolve-pr-feedback` | U4 | 已有 owner 导航候选；按行为差额裁决，不预设需要改动。 |
| `skills/ce-riffrec-feedback-analysis` | 1 | `skills/spec-riffrec-feedback-analysis` | U9 | 已有 owner 导航候选；按行为差额裁决，不预设需要改动。 |
| `skills/ce-setup` | 9 | `skills/spec-runtime-setup` | U6 | 已有 owner 导航候选；按行为差额裁决，不预设需要改动。 |
| `skills/ce-simplify-code` | 6 | `skills/spec-simplify-code` | U9 | 已有 owner 导航候选；按行为差额裁决，不预设需要改动。 |
| `skills/ce-strategy` | 2 | `skills/spec-strategy` | U9 | 已有 owner 导航候选；按行为差额裁决，不预设需要改动。 |
| `skills/ce-sweep` | 12 | `skills/spec-sweep` | U9 | 已有 owner 导航候选；按行为差额裁决，不预设需要改动。 |
| `skills/ce-test-browser` | 2 | `skills/spec-test-browser` | U9 | 已有 owner 导航候选；按行为差额裁决，不预设需要改动。 |
| `skills/ce-test-xcode` | 2 | `skills/spec-test-xcode` | U9 | 已有 owner 导航候选；按行为差额裁决，不预设需要改动。 |
| `skills/ce-work` | 19 | `skills/spec-work` | U3 | 已有 owner 导航候选；按行为差额裁决，不预设需要改动。 |
| `skills/lfg` | 12 | `skills/spec-lfg` | U9 | 已有 owner 导航候选；按行为差额裁决，不预设需要改动。 |
| `skills/wtf` | 2 | 范围/产品裁决，不指定实现 owner | U9 | 产品待决策/新增入口候选；不创建同名 public Skill，先记录用途与现有能力重叠。 |
| `src/**` | 10 | `src/cli` | U6 | CLI/adapter 局部差分；Kiro 删除不迁移。 |
| `其余根文件与宿主配置` | 11 | 范围/产品裁决，不指定实现 owner | U7-A | 逐文件区分规范、入口、插件与构建；隐藏目录不自动代表 generated。 |

总计 398；未将 H1-H4 的 625 条加入本候选执行队列。

其中 U9 承接重点单元之外的已有 Skill owner；U7-A 的非行为资产可有据归 evidence-only，产品待决策项保持 deferred，不强行指定 implementation target。
