# spec-polish 收敛报告（批次3）

**K=2**：R1 zhipu/glm-5.3 / R2 gpt-6.1-sol（ai-qianxing2 备用；hst-2 loop-guard 击杀后重跑）　**冻结**：5b59293b

## 一致率：全一致 11/18、分歧 7/18（X02 为 na/pass 范围注记）

## 最终逐项裁决：17/18 pass + D05 fail（双评审各自独立证实，已修复）

**D05 2/2 fail（双方不同证据，均确定性证实）**：

1. **R1 证据成立**：dev-server-rails.md:21-23 级联摘要把 Procfile.dev 列第 1 优先，而 resolve-port.sh 实际探测顺序 puma.rb（Probe 3）先于 Procfile.dev（Probe 4）——文档与脚本序反。**运行时语义 prose 是对的**（foreman/overmind 的 web 行 `-p` 直接传给 puma，覆盖 puma.rb 端口），故修脚本：两探针块交换（25/25 测试绿，无测试锁定旧序）
2. **R2 证据成立（同时证实 B02 的框架优先级子项）**：dev-server-astro.md:57 声称「astro 类型优先于 vite」，detect-project-type.sh 对双签名返回 `multiple`。已在 root 多匹配分支补 astro 前置优先（astro.config.* 是更 specific 签名，Astro 内置 Vite，遗留 vite.config 不构成歧义）

**其余 R2 lone fail 裁决**：

- **B05 成立为 P3，已修**：run.md 工作区选择段无首编前 dirty-overlap 拦截，提交期混合变更检查过晚——已补「首编前捕获 dirty/untracked 集；polish 编辑面与既有用户变更重叠即阻断并上浮冲突」
- **D04/X04（handoff envelope 缺 source/freshness/limitations）不成立**：polish 的移交是同会话内 Plan/Work 接力，不触发跨 context-reset 交接的信封门槛；跨会话场景已有 spec-handoff 承载。留观：若未来出现异步移交再补
- **D07/B04（eval 读 runtime 路径、判据不能排除点名后越界）→ S3**：eval 资产类

## 结论

- **spec-polish 静态层：17/18 pass + D05 fail（已修复：探针交换 + astro 优先 + dirty 拦截）**
- 行为层/成本/收益：未验证（S3 另测）

## 产物

spec-polish-R1-glm53.md / -R2-sol-v2.md（ai-qianxing2）
