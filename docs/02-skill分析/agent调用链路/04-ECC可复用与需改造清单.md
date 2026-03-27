# ECC 可复用、需改造与应放弃清单

这份文档只回答一个问题：

**spec-first 在集成 ECC 风格 skill 体系时，哪些可以直接参考，哪些必须改造，哪些不该照搬。**

---

## 1. 可以直接参考的部分

### 1.1 Skill 资产结构

ECC 把 skill 组织成：

- `SKILL.md`
- `agents/openai.yaml`

这个结构可以直接参考，因为它把“正文”和“元数据”分开了。

### 1.2 Catalog / Manifest 两层结构

ECC 的 `install-components.json` 和 `SKILL.md` 分层很适合借鉴：

- `skill-catalog.json`
  - 负责目录级归类
  - 负责 `family / id / description / modules`
- `skill-manifest.json`
  - 负责单 skill 元数据
  - 负责初始分类和可见性

### 1.3 分层思路

ECC 的分层很清楚：

- `language pack`
- `framework pack`
- `capability pack`
- `agent`
- `skill`

这套思想对 spec-first 很有价值。

### 1.4 项目检测方式

ECC 的 `project-detect` 通过：

- 文件标记
- 扩展名
- 依赖项

识别语言和框架。

这个思路可以直接借鉴到 spec-first 的任务创建期解析里。

---

## 2. 需要改造后再用的部分

### 2.1 运行时隐式激活

ECC 里有 harness runtime 自动激活 skill 的概念。

这部分**不能直接照搬**到 spec-first，因为当前项目的核心是：

- workflow
- subagent
- hook/context
- 任务文件

更合适的做法是把 skill 选择前移到任务创建期。

### 2.2 安装期/运行期一体化

ECC 的 selective install 设计很完整，但它是围绕安装系统做的。

spec-first 如果照搬，会把系统做重。

推荐改造成：

- 安装期：登记和同步 skill 资产
- 任务创建期：解析出 `selected_skills`
- 运行期：hook 只消费结果

### 2.3 language/framework 的绑定方式

ECC 里 `lang:python / lang:java / lang:go / lang:kotlin` 是一级 pack，
`frontend/backend` 并不是一级 pack。

在 spec-first 里，如果直接照搬，容易让人误解。

更合适的是：

- `frontend/backend` 作为场景维度
- `python/java/go/kotlin` 作为语言维度
- `react/nextjs/django/springboot/gin/echo` 作为框架维度

---

## 3. 应该放弃的部分

### 3.1 仓库级 runtime 评分器

不要在 spec-first 里实现一个“自动给 skill 打分并运行时排序”的本地引擎。

这会：

- 增加复杂度
- 增加测试面
- 让职责边界不清晰

### 3.2 把所有 skill 都自动挂到所有节点

这会让 `implement / check / start / finish` 的上下文膨胀。

应该只保留：

- 节点 skill
- 上下文 skill
- 显式调用 skill

### 3.3 把领域 skill 直接当节点 skill

像：

- `market-research`
- `investor-outreach`
- `production-scheduling`

这类 skill 不适合自动挂到代码节点。

---

## 4. 对 spec-first 的推荐落法

### 4.1 第一阶段

- 先做 manifest
- 先分类
- 先给 `implement / check / start / finish` 做最小映射

### 4.2 第二阶段

- 任务创建期解析 `skill-profiles.json`
- 写入 `selected_skills`
- `explain` 可读展示

### 4.3 第三阶段

- hook 注入 skill
- agent 消费 skill
- 逐步扩展更多语言/框架/能力 skill

---

## 5. 最终结论

ECC 可以直接参考的，是：

- 资产结构
- catalog/manifest 分层
- 项目检测思路
- 分层命名习惯

ECC 需要改造后再用的，是：

- 运行时隐式激活
- 安装/运行一体化
- 语言/框架的绑定方式

ECC 应该放弃不照搬的，是：

- runtime 评分器
- 全量自动挂载
- 领域 skill 直接等同节点 skill

