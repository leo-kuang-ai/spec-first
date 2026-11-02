# Batch 5：S07 跨文件合同审查评测包

这是新增候选评测包，不是已完成的模型评测。范围为多租户支付账本的金额、请求去重、失败重试和HTTP消费者，补充此前小diff饱和场景；不能保证更大diff就有模型区分力。

- `fixture/`：只给被测reviewer的基线仓库，含业务合同和公开smoke tests，零依赖。
- `candidate.patch`：跨4个实现文件的待审补丁。含新增顺序批量入口、3项缺陷及1项无缺陷格式化重构。
- `private/frozen-criteria.md`：首次本地验证前冻结的判据；不得发给被测reviewer。
- `private/oracle.cjs`：隐藏确定性行为判定器，同样不得复制到fixture。
- `verify.py`：创建临时Git仓库、真实initial commit、check/apply patch、运行基线与candidate验证，自动清理临时仓库。
- `verification.json`：实际结果、差异文件、完整smoke输出、文件SHA-256。临时base commit的SHA随提交时间变化，输入文件哈希用于内容身份。

复现：

```bash
python3 docs/project-reviews/evidence/batch5/review/verify.py
```

已执行：exit 0。基线四项隐藏断言通过；candidate三项缺陷断言失败、无缺陷负对照通过；公开smoke两组均通过；candidate批量入口结果形状通过。只创建临时仓库的fixture commit，没有创建本项目commit，没有安装、网络、支付调用或模型调用。

后续成对模型试验应复制相同fixture，在临时仓库initial commit后应用candidate.patch，让两组审阅同一个`git diff`；唯一处理差异是是否加载S07当前磁盘源码。评估应先保存原始review输出，再在模型不可见的父目录用冻结判据评分；既有公开业务合同可以给模型，隐藏答案和oracle不可给模型。必须记录实际Skill加载、模型/host/provider、成本、原始trace和基线身份。

检出这3项不等于完成真实支付系统审计，也不证明官方模型、所有代码库或S07整体收益。若两组再次饱和，应如实保留无差异结果，不能事后调整判据增加某组得分。
