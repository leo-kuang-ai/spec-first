# ECC Governance Quality Gates

| Gate | Check | Failure Handling |
| --- | --- | --- |
| Source Evidence Gate | ECC 清单数量与 provider source 可追溯 | 标记 stale，重新生成或回读 source |
| Workflow Compatibility Gate | 不覆盖现有 persona catalog、workflow-native schema 或 synthesis 输出 | 阻断进入 prompt/runtime，先补 adapter |
| Overlap Gate | direct_match 不新增 agent，native 不被 ECC 覆盖，profile 不进默认路由 | 阻断该 entry 进入 registry |
| Rubric Extraction Gate | 每个 ECC skill 采纳项有 source、target、dedupe、quality_node、adoption_action | 不写入 agent prompt，只保留 candidate |
| Naming Gate | canonical_id 产品化，个人名只保留在 origin_aliases | 阻断 runtimeName 推广 |
| Router Gate | candidate facts 有 reason_code、budget_hint、degraded_mode，脚本不输出 selected_agents | 降级为 checklist mode 或减少候选 |
| Context Gate | 只给 selected experts 构造 context pack | 不加载全量 ECC skills / agents |
| Finding Compatibility Gate | 保留 workflow-native schema，并生成 Finding Core compatibility view | 不更新 reviewer prompt，只补 adapter 草案 |
| Finding Evidence Gate | finding 有 severity、confidence、evidence、recommendation、not_reviewed 或 native 等价字段 | 降级为 advisory 或 reject |
| Synthesis Gate | 最终 verdict 只能由 Skill 输出，必须说明 adopt/reject/downgrade | 不写 durable final report |
| Standards Gate | standards 写入必须 preview-first + human confirmation | 只生成 standards candidate |
| Capability Plugin Gate | capability pack pack-gated、source-attributed、workflow-compatible、doctor-able/clean-able | 只能保留 preview，不进入 runtime |
| Opt-in Gate | 研发向 optional pack、style profile、missing_in_spec_first 显式启用；excluded domain references 不进能力包 | 默认 disabled / checklist mode |
| Host Compatibility Gate | 每个 pack 声明 Claude / Codex 支持度、fallback 和 unsupported reason | host 不支持时降级为 checklist/reference |
| Source Freshness Gate | 每个 ECC 采纳项声明 source file、revision、loaded_from、freshness、runtime_cached | freshness 不足时只保留 candidate |
| Command Idea Gate | ECC commands 只进入 idea matrix，不进入 command registry 或 runtime command surface | 阻断 /ecc:*、$ecc-* 或 runtime command 生成 |
| Runtime Merge Gate | 未来 runtime delivery 必须 managed marker merge、add-only config merge、preview-first | 阻断 silent overwrite 用户配置或 generated runtime |
| Runtime Gate | 未显式启用 capability pack 时不得生成 ECC runtime asset | doctor 报告 residual / drift |
| Fresh-source Eval Gate | agent/skill prose 改动后必须用当前磁盘 source 做 fresh-source eval | 记录未执行原因，不能声称通过 |
