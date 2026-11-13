# 规划验证可执行性的有界收敛

- 日期：2026-11-05。
- 类型：`advisory` 合同充分性判断；测试输出和源文件指纹为对应确定性证据。
- 来源：[对照语义复核](plan-tool-boundary/semantic-review.md) 发现 caller 计划要求跨月/月界数据，却只给 curl smoke；原接口不能直接构造指定时间戳。
- 边界：不改已归档计划和评分，不修改用例或 judge，不手改 runtime，不把本次修订冒充原四例受测源码。

## 逐项归属裁决

1. **POST 排除与扩大行为冲突**：`plan-sections.md` 的 One Rule, One Owner 与 `structure.md` 的范围外工作规则已有覆盖，不复制一套 POST 专用约束。
2. **未决产品选择与 readiness**：`intake.md` 第 103、137 行要求有实质影响的未确认 WHAT 保留为产品决策/阻塞，pipeline 不豁免；`plan-sections.md` 第 32–44 行区分 blocking/deferred，终审再次检查产品阻塞。不以“所有假设都必须等待人工确认”的新规则替代语义判断。
3. **验证状态不可构造**：终审原条目只要求输入、动作和期望明确；计划可形式上满足三者，却没有真实的测试数据/状态准备路径。仅在该条目补一处通用充分性检查。

## 最小源码修订

`skills/spec-plan/references/final-review.md` 第 21 行：除列输入、动作和结果，还核对测试数据、时间或外部状态能否由现有接口或计划内测试接缝构造；不能把尚未实现的构造条件当已有能力。缺可行路径时记录缺口并判断是否阻断对应验证/readiness，不扩大工具授权，不要求规划阶段真实运行测试或修改超范围接口。

不新增 schema、状态机、脚本语义评分或专项日期词表。验证可执行性仍由 LLM 判断；脚本只检查 owning 条目存在及原有合同未破坏。

## 实际验证

- 新增一项合同保真断言：修前 1 FAIL、9 PASS；修后相关三套共 **50/50 PASS**。
- `npm run lint:skill-entrypoints`：519 文件通过。
- builder `--check`、`git diff --check`：通过。
- 未重跑全量 20 套；此前 337 项属于上一源码节点，不迁移为本次结果。
- fresh-source 有界语义校验已完成，仅读取当前终审第 11–23 行：A（仅 curl 却承诺历史月界数据）判有缺口；B（计划内隔离受控时钟）、C（原 API 可构造的当前时间场景）、D（保留第三方状态缺口并按影响阻塞）均判可接受。未发现规则要求本次运行测试、扩大接口范围或所有缺口一律阻塞的误导。这是四个合成片段的语义校验，不是完整规划 live 或跨模型可靠性证据。追加源码指纹见 [版本记录](verification-feasibility-source.json)。
- 用户续作后已启动追加候选的两例串行 live：`claude_code`、`zhipu/glm-5.3`、相同 case/prompt/judge/environment，每例一次，输出 `/private/tmp/plan-feasibility-20261105/runs/candidate`。冻结 88 文件与上一候选比较，仅 `references/final-review.md` 不同，evals 全部相同，见 [完整受测指纹](verification-feasibility-live-source.json)。上一候选两例结果作为相同条件下的比较基线复用；不是旧版全套比较或稳定性采样。
- 本轮真实执行重点核对规划语义：范围是否自洽、测试状态可构造、未决事项与 readiness 是否相容；同时保持 shell 判据不变。该修订不触及 shell 首次调用规则，不预期或声称必然修复越界。结果已返回：**0 PASS、2 FAIL、0 ERROR**，925681 ms、220976 tokens。配对轨迹确认授权外 shell；两份计划均保持 POST 范围，但 caller 测试接缝仍未充分闭合，blocked 用设计逻辑代替月界验证依据，另有兼容性前后表述矛盾。详见 [结果与归因](verification-feasibility-results/README.md)。8 项原始证据 SHA 校验通过，计划已按成功 Write/Edit 重建并审阅。未达到候选验收条件，未启动完整十例回归，停止无变化重跑。

## 状态与停止条件

本次完成可定位的验证合同遗漏修订，但不宣称整体行为验收完成。历史 154/155、上一候选机械 1/2 及本次追加候选 0/2 分版本保留；两次单次观测不证明修订导致退化。保留该条目为静态与合成语义校验支持的合同澄清，不接受为已验证行为修复。新增反例或新合同冲突时再修 owning boundary；没有新证据时停止扩张 prose 与无变化评测，不重建宿主权限引擎。真实 runtime 未同步，commit/push/发布未执行。
