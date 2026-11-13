完成。记账 demo 已按计划升级并验证，6 个实现单元（U1–U6）全部落地。

## 交付结果

**更好用的部分**（对照 README 原先自述的三个缺口）：
- **随手可录**：`POST /entries` 现在只必填 `amount`（正数，自动保留两位小数），`note` 默认空、`category` 默认 `general`
- **分类**：每条记录带分类，`GET /entries?category=food` 可精确过滤
- **汇总**：新增 `GET /summary` → `{total, count, byCategory}`
- **修了两个硬伤**：无效 JSON 请求原来会直接打崩进程，现在返回 400 JSON 错误且服务存活；数据原来重启全丢，现在原子写入本地 JSON 文件（`data/entries.json`，可用 `DATA_FILE` 覆盖），损坏文件启动时明确报错退出而非静默清空
- **可删改错账**：`DELETE /entries/:id`，id 单调不复用；`PORT` 环境变量、启动日志、`npm start` / `npm test` 脚本齐备；README 重写为与实现一致的 API 文档 + 可复制 curl 示例

保持零 npm 依赖、单文件 CommonJS 形态（`src/server.js` 导出 `createApp` 工厂便于测试）。

## 验证

- `npm test`：**16/16 通过**（`node --test`，覆盖校验、过滤、汇总、持久化、重启保留、写盘失败 500 且内存不变、损坏 fail-fast、id 不复用等场景）
- 冒烟：README 示例全流程实测通过——录入 → 过滤 → 汇总 → 删除 → **重启后数据保留** → 损坏文件以非零码退出

## 计划与限制

- 计划文档：`/private/var/folders/0v/f_smd31500113ppkqs66c9yr0000gn/T/skill-up-3125211175/docs/plans/2026-11-04-001-feat-miniledger-usability-upgrade-plan.md`（`implementation-ready`，执行完毕已标记 `completed`）
- 推断性决策记录在计划的 Assumptions 一节（如“更好用”的解读、不做 Web UI/CLI）——若你想要网页界面或 CLI，范围随时可重议
- 如实披露：`spec-doc-review` 独立审查在当前宿主不可用，仅完成 producer 自审（`review_status: degraded`）；测试不覆盖长时间运行稳定性与并发写竞争（单用户 demo 定位下接受）
- 未提交 git（你没有要求提交；`data/` 已加入 `.gitignore`）
