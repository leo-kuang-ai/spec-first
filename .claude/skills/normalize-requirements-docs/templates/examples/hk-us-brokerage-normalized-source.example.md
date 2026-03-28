---
topic: 港美股券商开户与入金交易链路
output_file: docs/requirements/2026-03-28-港美股券商开户与入金交易链路-normalized-source-v1.md
output_date: 2026-03-28
output_version: v1
source_language: 中文
output_language: 中文
language_detection_basis: 主文档、截图标签和大多数业务术语均为中文，仅保留 W-8BEN、AML/KYC 等原始英文术语
notes: 保留源文档中的英文术语原文，不补充源文档未写明的监管或业务规则
source_files:
  - id: S1
    path: broker-prd/01-overview.md
    type: Markdown
    scope: 6 sections
  - id: S2
    path: broker-prd/02-onboarding.pdf
    type: PDF
    scope: 18 pages
  - id: S3
    path: broker-prd/03-trading-flow.docx
    type: DOCX
    scope: 9 sections
  - id: S4
    path: broker-prd/images/account-opening-annotated.png
    type: Image
    scope: 1 annotated screen
  - id: S5
    path: broker-prd/images/order-ticket.png
    type: Image
    scope: 1 screen
  - id: S6
    path: broker-prd/images/funding.png
    type: Image
    scope: 1 screen
  - id: S7
    path: broker-prd/images/marketing-banner.png
    type: Image
    scope: 1 screen (decorative)
---

# 港美股券商产品需求文档

## 一、产品范围

### 1.1 市场范围
- 产品支持港股与美股市场交易。
- 账户类型至少包含现金账户与保证金账户。
- 用户需先完成开户审核，审核通过后方可进行入金与交易。

### 1.2 用户角色
- 终端角色包括个人投资者与内部审核人员。

## 二、开户流程

### 2.1 开户入口
- 源锚点：`broker-prd/02-onboarding.pdf | p.3 | Account Opening Entry`
- 开户入口展示市场选择、账户类型、身份信息收集与风险披露确认。

#### 开户表单页面

**图片说明：开户表单标注图**
- 源锚点：`broker-prd/images/account-opening-annotated.png | image | Account Opening Form`
- 可见文字：开户市场、账户类型、税务身份、居住地址、职业信息、上传身份证明、上传住址证明
- 备注：
  - 页面为开户表单，包含多个填写字段
  - 红线标注强调 W-8BEN 仅在涉及美股税务声明时出现
  - 图中有"上传身份证明""上传住址证明"两个独立上传区

```
┌─────────────────────────────────────┐
│  开户市场: [香港] [美国]           │
│  账户类型: [现金] [保证金]         │
│  税务身份: [W-8BEN] (美股时显示)   │
│  身份证明: [上传文件]               │
│  住址证明: [上传文件]               │
└─────────────────────────────────────┘
```

### 2.2 身份认证与合规采集
- 源锚点：`broker-prd/02-onboarding.pdf | p.5-p.9 | Identity Verification`
- 开户流程要求提交身份证明、住址证明与职业信息。
- 对美股交易相关账户，文档明确提到税务声明表单 W-8BEN。
- 文档要求 AML/KYC 校验。

### 2.3 风险披露确认
- 源锚点：`broker-prd/02-onboarding.pdf | p.10-p.12 | Risk Disclosure`
- 用户在提交开户申请前，需阅读并确认风险披露。
- 保证金账户另有杠杆与强平风险提示。

## 三、交易链路

### 3.1 下单与校验
- 源锚点：`broker-prd/03-trading-flow.docx | Order Ticket | Order Entry`
- 下单页包含证券代码、买卖方向、订单类型、数量、价格与可用购买力信息。
- 提交前会进行余额/购买力校验与交易时段校验。

#### 下单页面

**图片说明：下单页面原型**
- 源锚点：`broker-prd/images/order-ticket.png | image | Order Ticket Screen`
- 可见文字：证券代码、买卖方向、订单类型、数量、价格、可用购买力、提交订单
- 备注：
  - 页面展示下单表单
  - 包含实时购买力计算
  - 显示风险提示信息

### 3.2 交易时段约束
- 源锚点：`broker-prd/03-trading-flow.docx | Session Rules | Trading Constraints`
- 港股与美股交易时段规则不同。
- 文档要求在非交易时段提示"可预约下单"或"当前不可交易"。

### 3.3 结算与资金可用性
- 源锚点：`broker-prd/03-trading-flow.docx | Settlement | Funds Availability`
- 成交后展示预计结算信息。
- 入金到账后才可释放对应购买力。

#### 入金方式

**图片说明：入金页面**
- 源锚点：`broker-prd/images/funding.png | image | Funding Screen`
- 可见文字：入金方式、到账时间、手续费
- 备注：
  - 页面展示多种入金渠道
  - 每种方式显示预计到账时间
  - 标注是否收取手续费

---

## 附录：待确认项

| ID | 源锚点 | 问题 | 不清楚原因 | 影响 | 需要确认的内容 |
|----|--------|------|------------|------|----------------|
| C1 | `broker-prd/images/marketing-banner.png` | 装饰性图片，未承载需求内容 | 图片为营销横幅，无功能需求含义 | 无 | 无需确认（已标注为装饰性） |
