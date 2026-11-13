# S00 配置依赖最终补读

日期：2026-11-02。类型：源码事实与本轮纯函数结果为 confirmed；充分性判断为 advisory。当前 HEAD：`1aa272a606710407e69b22d0452a34cd9b0d1f8f`。本次承接剩余有界依赖审查，不替代 S00 全项分析，也不把继承上下文称为盲评。

**结论：已完成指定的 host-config 前半部及 TOML editor 全文阅读。** 授权对象、路径约束、配置优先级、精确卸载匹配及局部编辑目标有具体实现和测试断言支持；本轮未形成新增高置信缺陷。没有执行真实宿主安装、配置更新、网络操作或模型评测。不能据此宣布全部宿主行为验证完成。

## 目标映射

| S00目标 | 本次源码及已核对断言 | 结论与限制 |
|---|---|---|
| 事实与判断分工 | host-config:57–105 校验receipt/host/mutation字段；:636–744返回configured/conflict、effective/blocking scope/path和reason；TOML:529–597比较实际托管字段 | 输出是配置事实，不进行工程语义判断。SHA receipt是完整性绑定，不是用户意图的加密认证；用户授权仍由上游负责，不能把`explicit:true`等内部对象当不可伪造凭据。 |
| 写入范围与授权 | host-config:322–401先validateAuthority，检查user-scope opt-in再解析registry目标；:195–320限制containment和symlink；测试542–638、848–895逐条验证缺授权、wrong-host、user-scope、symlink和高优先级冲突 | 目标解析有确定性边界。该模块消费上游authority，不独立替代任务授权。实际事务落盘与锁在后半部，由主审已读依赖负责。 |
| 保护用户配置与幂等 | TOML:620–671只替换managed assignment ranges，保留其他段落和未知字段，写后比较；host-config:534–547提供exact-match与extra字段检测；测试274–357、896–959、1170–1317 | 普通配置检查允许额外用户字段；卸载使用更严格比较，含额外字段则冲突，防止把用户扩展一起移除。底层removeMcpSection本身不是授权API，必须由host-config消费者执行exact检查。 |
| 中断与回退 | 测试1318–1362实际调用事务并断言stale_lock_recovered、post_write_verified、BOM/其他内容保留与锁释放 | 本轮只审该测试断言，未重新执行事务测试；不以测试名或总数量证明所有回滚路径。本次纯函数无文件写入，不构成中断恢复实验。 |
| 多宿主适配 | host-config:112–157分离标准server和opencode-local表示；:322–401按registry targets、precedence与format选择；测试598–638包含多宿主surface参数 | 证明适配设计与fixture合同，不能证明八个宿主真实读取配置成功。TOML专项主要对应Codex，不能外推JSONC或其他宿主。 |
| 环境与安全 | host-config:403–437检测literal secrets，:489–547比较允许字段，:636–744优先级冲突阻断；测试960–988只回传冲突字段，不泄露值 | 这不是通用secret scanner。供应链下载/integrity/安装在installation-executor等既有阅读范围，不由TOML编辑器证明。 |
| 下游消费 | host-config:11–14调用extract/compare/exact/remove/upsert；:574–597精确比较额外字段及子表；:636–744产出可消费reason | 已闭合TOML→host-config这条直接消费者边。Graphify freshness及workflow降级不是该配置模块职责，沿用主审project-graph合同证据。 |

## 三类静态场景及反例

1. 正常：Codex配置已有其他server、BOM/CRLF和用户metadata，更新一个托管server；应保留其余字节与metadata，再次更新no-op。对应TOML:620–671与测试274–314、1318–1362。
2. 信息冲突：同名server配置位于更高优先级且值不同，或用户配置缺user-scope授权；应返回具体阻断，不向低优先级写一份再声称有效。对应host-config:322–380、636–715与测试542–599、848–895。
3. 失败与恢复：重复目标表、未闭合多行字符串、目标subtable使编辑不可靠；应返回duplicate/grammar/subtable reason，不能拿字符串匹配强写。对应TOML:200–278、620–632与测试316–334。反例：常规compare匹配但存在metadata，不等于可安全卸载；exact比较必须保留冲突，测试1253–1317覆盖该区分。

## 本轮验证

执行一次纯内存Node断言，exit 0：非目标段落字节保留、用户字段保留、重复upsert no-op、exact比较识别extra、重复表阻断、subtable写入阻断均通过。未创建测试文件、未改真实配置、未重跑全量测试。这仅证明当前编辑器这六个输入，不是任意TOML语法、并发或真实宿主验收。

## 发现与排除

- 本轮没有新增需修改source的确认问题；原F-S00条目不由本次局部补读撤销或升级。
- TOML模块是有界section editor，不是完整TOML验证器：value parser不支持的合法语法会以unsupported阻断，符合保守编辑设计；不能宣传为全TOML兼容。未对所有TOML语法做模糊测试。
- 真实宿主读取、Windows文件替换、安装网络故障、所有并发交错不在本次有界验证范围；这些是行为证据上限，不再把“未逐行读全部约2万行”机械列为指定补读未完成。
- 不建议为缩短入口而删除授权、exact卸载、路径和readback门禁。业界对照复用research R16最小权限、R17脆弱操作脚本化；只支持保留这些机制，不证明本项目现场收益。

## 阅读清单与完整文件SHA-256

哈希绑定下表所列文件当前完整字节；行范围记录实际读取，不把哈希计算视为阅读。

| 路径 | 实际阅读范围 | SHA-256 |
|---|---|---|
| `skills/spec-runtime-setup/scripts/lib/host-config.cjs` | 1–744，完整读取本次指定范围；745–1486由主审负责，不冒充本执行者已读 | `3b6d1ec8901ac2558818d117a2d5e85b2466b5907f46b2e0a8587203ae6e45ee` |
| `skills/spec-runtime-setup/scripts/lib/toml-section-editor.cjs` | 1–698，全文 | `2f462b2bdabb29f4a9df949f8834cd593a9a3030761edbada8bb2eefed82fdc8` |
| `tests/unit/mcp-setup-host-config.test.js` | 274–357、542–638、848–988、1170–1362，逐条读取测试输入和断言 | `a5ddbc6b21fd8506ca3fd965bbbfb0ec0c29e736c9e73e989abd213baed4faee` |
| `docs/project-reviews/2026-11-01-development-skills-review-requirements.md` | 86–104，S00专项目标 | `4415b828c0eba3867618237b5cc9bd82ad2f5ec2b952156f096a3836d62c0aa1` |
| `docs/project-reviews/evidence/S00-spec-runtime-setup/analysis.md` | 全文，历史结果及范围限制 | `3b778d3d670f3d76c8369831c1eda75c5d90756502c92cbd23a5a40dd11de23c` |
| `docs/project-reviews/evidence/resume-audit-2026-11-01.md` | 全文，增量阅读与归因修正 | `fdd08e92f8a860396d2815bce250568a00a8a4f2c2fc5345b4a0d551d4f65cd1` |
