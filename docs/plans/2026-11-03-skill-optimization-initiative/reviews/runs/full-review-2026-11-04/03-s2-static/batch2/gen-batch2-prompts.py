#!/usr/bin/env python3
# 生成批次2 提示词：6 skill × 3 评审者 = 18 份
# 用法: python3 gen-batch2-prompts.py
import os

RUN = "/Users/kuang/xiaobu/spec-first/docs/plans/2026-11-03-skill-optimization-initiative/reviews/runs/full-review-2026-11-04"
OUT = os.path.join(RUN, "03-s2-static/batch2")
os.makedirs(OUT, exist_ok=True)

SKILLS = {
    "spec-debug": "主链路·排障修复",
    "spec-compound": "知识沉淀",
    "spec-compound-refresh": "知识保鲜",
    "spec-runtime-setup": "运行时准备（批次2 增补）",
    "spec-project-rules": "架构知识库（批次2 增补）",
    "spec-doc-review": "独立文档评审（批次2 增补）",
}

ROLES = {
    "1": ("R1", "**D01-D05 + D08**（去补丁化/领域知识/验证门/衔接/紧凑性/上下文效率）", "zhipu/glm-5.3"),
    "2": ("R2", "**B01-B04 + X01-X04**（入口职责/输入输出/授权信任/source-runtime 边界 + 四类扩展场景）", "hst-2/gpt-6.1-sol"),
    "3": ("R3", "**B05/B06 + 归因验证**（失败恢复隔离/完整交付审查 + 对既有 findings 的归因复核）", "kiro/kimi-k3"),
}

TEMPLATE = """# 角色：Skill 鉉态审查评审者 {rid}（fresh-source 盲评）

你是独立评审者。评审对象冻结于当前目录（git worktree，5b59293b）。你看不到其他评审者的输出，不要猜测他们。

## 评审对象：{skill}（{role_label}）

- 入口：`skills/{skill}/SKILL.md`；按需读取同目录 references/、scripts/、templates/、evals/
- 消费者清单：`{run}/evidence/input-packs/{skill}.consumers.txt` 所列 tests/src 文件
- 检查表：`docs/plans/2026-11-03-skill-optimization-initiative/process/REVIEW-EXECUTION-WORKFLOW.md` 第 4 节（D01-D08 / B01-B06 / X01-X04，含各维必查问题与最小证据）
- 合同基线：`docs/plans/2026-11-03-skill-optimization-initiative/core/08-skill-contract-protocol.md`

## 任务

1. **先读完全部必读材料**（SKILL.md、全部相关 references、检查表、合同基线、消费者清单所列文件）再输出裁决表；时间不够时砍 Findings 深度，不砍裁决覆盖
2. 对 D01-D08、B01-B06、X01-X04 **逐行裁决**：pass / fail / not-applicable / not-verified；每项带 file:line 证据；记 not-applicable 必须写适用性理由
3. findings：每条含位置（file:line）、后果、最小修复建议或「保持现状成立」
4. 主责深挖面（额外深挖，全表裁决仍须完成）：{lens}
5. 未读文件：列路径 + 理由 + 未覆盖后果

## 输出格式（markdown 直接输出，不写任何文件；开头不要过程性陈述）

```
# {skill} 评审（{rid}）
## 逐项裁决表
| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
（D01…D08、B01…B06、X01…X04 共 18 行；ID 列只写 ID）
## Findings
## 主责深挖面发现
## 未读文件
## 结论一句话
```

## 裁决纪律（S1/批次1 校准补强）

- 裁决词表只允许：pass / fail / not-applicable / not-verified，禁止 partial 等其他值
- 静态层 pass 标准：源码承诺存在、内部一致、可定位（file:line）
- **「我没有运行证据/运行成本未测」不构成 fail，也不构成 not-verified**：运行成本与行为质量属 S3 行为层，本轮只裁静态合同；静态承诺可定位且内部一致即 pass
- 「我没读完某文件」不是 not-verified 的理由（先读完）；只有「静态层承诺本身无法用文本证据判断」才记 not-verified
- D06 按该 Skill 自身能力假设审查；不因「本轮单模型执行」自动记 not-verified

## 纪律

只读，禁止修改任何文件；findings 无位置不入册；证据不足记 not-verified；全程简体中文。
"""

count = 0
for skill, role_label in SKILLS.items():
    for num, (rid, lens, _model) in ROLES.items():
        content = TEMPLATE.format(rid=rid, skill=skill, role_label=role_label, lens=lens, run=RUN)
        # 修正常量拼写回退
        content = content.replace("鉉态", "静态")
        path = os.path.join(OUT, f"prompt-{skill}-{rid}.md")
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        count += 1
print(f"generated {count} prompts in {OUT}")
