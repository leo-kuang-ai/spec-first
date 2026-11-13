# S03 修复记录

2026-11-02；修复前HEAD：21f02e203。范围：UP-S03-01/02。授权：逐项本地修复和提交，不刷新runtime或推送。

## 根因和变更

UP-S03-01：原Canonical及三个调用处把“不会影响本release”一律视为仅调整提问顺序，另一个段落又要求跳过低价值/范围外问题，导致可反复追问无关分支或漏掉真负载缺口。统一为先由LLM基于当前授权范围与来源判断相关性：纯范围外且不影响行为、验收、权限、安全或必要依赖的问题不进入追问；真实负载缺口不能因低价值、暂不发布或未绑定写入位置被跳过。四类合法停止点、checkpoint与checker/finalize边界不变。

UP-S03-02：CLI模板固定列五宿主，与当前getSupportedPlatforms()八宿主不一致。模板改为按目标实际支持集填写，明确当前八宿主仅作来源提示；只验证影响面，区分生成、加载和真实结果。

## 验证与限制

4套39项针对性测试通过，6个eval配置加载有效，见tests.txt/eval.txt。独立fresh-source reviewer /root/s04_source_review 首轮发现domain-language末段仍允许跳过非本release问题；本项修正后复读最终源码，结论passed。仅为源码/本地合同验证，未执行真实PRD问答或八宿主验证；不把模板结构视作产品语义充分。无新抽象或通用状态机，simplify不适用；judge/human校准未运行，不作模型质量claim。structured closeout仅覆盖实际本地命令。
