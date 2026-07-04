# Pattern Categories

本参考在抽取规则前读取，用来组织证据和防止只写表层命名规范。只把当前目标仓库中稳定、重复、偏离默认的模式写入规则。

## 基础策略

- 默认证据阈值：同一规则至少出现在 2 个文件；中大型仓库只把 80%+ 一致的模式写成规则。
- 大仓库（>500 个源码文件或上下文预算不足）：100% 阅读核心/shared 模块，按目录比例抽样剩余源码；preview 中披露抽样范围。
- 小仓库（<5 个源码文件）：可以输出规则，但必须标注样本小，降低到 2 次出现即可候选。
- 混合语言：按语言分节；跨语言规则只写目录布局、提交约定、测试组织这类共同模式。
- 生成代码占比高：跳过 generated/scaffolded 文件；若 >80% 是生成代码，先警告并只写人工源码证据。
- 冲突模式：50/50 分裂不写规则；可在 `limitations` 中说明“未生成规则”。

## 必查类别

### 1. 函数与代码体风格

函数长度、声明形式、参数数量与 options object 使用、解构习惯、早返回或单出口、async/await 与错误边界、变量可变性、集合处理、类型系统风格、字符串和链式调用。AI 最常生成函数体，这一类优先级最高。

### 2. 命名约定

文件名、目录名、类型/类/接口后缀、函数前缀、handler/hook 命名、常量命名、私有成员或测试 helper 命名。不要写语言默认，例如普通 PascalCase 类名。

### 3. 代码组织

feature-first 或 layer-first、barrel export 使用、index 文件密度、单文件多 export、目录复数/单数、模块边界、循环依赖规避方式。

### 4. Import 与依赖使用

import 分组、路径别名与相对路径选择、named/default import、总是成组出现的依赖、禁止直接依赖的底层库。若 import order 已由 formatter/linter 强制，跳过规则正文。

### 5. 错误处理、日志与可观测性

异常、Result/Either、错误码、错误包装、日志库、结构化日志、request/correlation id、常用 log level、错误返回 envelope。

### 6. 注释与文档风格

注释密度、why/what 取向、inline/block 形式、JSDoc/TSDoc/docstring 使用范围、TODO/FIXME 格式、section divider、注释语言。若项目几乎不写注释，规则应是“不要添加噪声注释”。

### 7. 测试风格

测试框架、文件位置、命名、describe/it 层级、fixture/factory、mock 策略、集成测试偏好、测试数据组织、快照使用边界。

### 8. Hidden Associations

寻找总是一起出现的隐性耦合：service 与 types 文件、handler 与 validation、route 与 registry、model 与 migration/test、API handler 的固定生命周期、数据库访问的 transaction wrapper。这是最高价值规则之一，至少写一条，除非证据明确不存在。

### 9. Anti-Patterns

寻找项目几乎从不使用的常见写法：默认导出、`any`、raw SQL、直接 `process.env`、类继承、全局状态、直接调用外部 SDK、未包装错误、远距离测试文件。只写当前仓库证据支持的禁用项。

## 条件类别

- 前端：组件文件结构、props 解构、state/data fetching、loading/error state、CSS/utility class、routing、event handler、form 处理、accessibility state。
- 后端：REST route 命名、response envelope、pagination、middleware 顺序、validation 层、DTO/types、ORM/repository、transaction、auth/permission。
- Mobile/Desktop：React Native navigation/StyleSheet/platform split，Flutter widget/state/const constructor，Swift optional/extension/UI 架构，Android ViewModel/Flow/DI/null-safety，WPF MVVM binding，Qt signal/slot/ownership。

条件类别只在目标仓库实际属于该应用类型时使用；library、CLI、infra 工具无需硬套。
