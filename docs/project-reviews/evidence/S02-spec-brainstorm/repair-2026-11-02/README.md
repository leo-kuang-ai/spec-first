# S02 修复记录

2026-11-02；修复前HEAD：a7ce802c1。范围：UP-S02-01；用户已授权逐项修复与本地提交。

## 根因与修复

当前synthesis-summary一面允许existing authorization，一面无条件要求Standard/Deep、任何revision再次确认；approaches及phase-0复制了旧规则。该冲突由前后源码直接确认，不据此宣称真实宿主已发生越权。

分离摘要呈现深度与等待条件：WHAT闭合且已授权自主整理/写入/续跑时说明后继续；真实产品决定、权限/副作用缺口或明确逐阶段确认要求仍等待。更新Path A/B、无文档提示、修订、soft-cut与入口引用，统一同一判断；自动继续仍在写入前核实负载事实，不把委托判断称为人工确认。

## 复核与验证

独立fresh-source reviewer /root/s04_source_review 首轮发现Path A不等待、Path B提问、无文档确认及二次修订soft-cut仍冲突，结论concerns。已修上述残余并同步phase-0；同一只读reviewer重新读取最终磁盘三文件与diff后结论passed，无本范围阻断问题。

3套13项既有契约测试在修改后通过；7个eval配置加载有效。未新增只匹配新措辞的镜像测试；本次prose变更使用直接前后对比及独立四类场景源码推演（完整输入自主写入、授权内修订、真实WHAT缺口、明确逐阶段确认），并非真实模型行为实验。双模型/真实宿主行为与收益未运行；judge/human校准未执行，不作行为收益claim。

无新抽象或额外重构；未刷新runtime、推送或新增付费评测。structured closeout仅覆盖真实执行的本地检查，报告回填后独立提交。
