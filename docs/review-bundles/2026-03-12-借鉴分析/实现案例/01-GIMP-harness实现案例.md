# GIMP Harness 实现案例分析

## 文档目的

这份文档补足当前 bundle 缺失的“实现案例”证据，回答两个问题：

1. `CLI-Anything` 的单个 harness 到底是怎么从方法论落到代码的。
2. 这些实现模式映射到 `spec-first` 时，哪些可以直接借鉴，哪些必须改写。

分析对象：

- `CLI-Anything/gimp/agent-harness`
- 重点文件：
  - `setup.py`
  - `cli_anything/gimp/gimp_cli.py`
  - `cli_anything/gimp/core/*.py`
  - `cli_anything/gimp/utils/gimp_backend.py`
  - `cli_anything/gimp/tests/*`

## 一、目录骨架

GIMP harness 的完整骨架如下：

```text
gimp/agent-harness/
├── GIMP.md
├── setup.py
└── cli_anything/gimp/
    ├── README.md
    ├── gimp_cli.py
    ├── core/
    │   ├── project.py
    │   ├── session.py
    │   ├── layers.py
    │   ├── filters.py
    │   ├── canvas.py
    │   ├── media.py
    │   └── export.py
    ├── utils/
    │   ├── gimp_backend.py
    │   └── repl_skin.py
    └── tests/
        ├── TEST.md
        ├── test_core.py
        └── test_full_e2e.py
```

这个结构体现出一个很清晰的分层：

- `GIMP.md`：软件分析与 SOP
- `gimp_cli.py`：CLI 入口与命令编排
- `core/`：领域能力
- `utils/`：真实后端与统一交互层
- `tests/`：测试与结果证据

## 二、关键实现链路

### 1. 入口层：`gimp_cli.py`

`gimp_cli.py` 做了 4 件事：

1. 定义 Click 命令组和子命令
2. 维护全局 `Session`
3. 提供 `--json` 与人类可读输出双通道
4. 通过 `handle_error` 统一错误出口

这说明它不是“把所有逻辑写进命令里”，而是让 CLI 只负责：

- 参数解析
- 调 Session
- 调 core 模块
- 统一输出

这套分层对 `spec-first` 是可以直接借鉴的，因为 `spec-first` 现在也已经采用：

- `src/cli/index.ts` 作为总入口
- `src/cli/commands/*.ts` 作为子命令处理器

但 `spec-first` 当前更接近“按命令文件拆分”，而不是“单软件单入口 + 单会话对象”的风格。

### 2. 状态层：`core/project.py` + `core/session.py`

GIMP harness 把状态拆成两层：

- `project.py` 管项目格式和读写
- `session.py` 管运行期状态、撤销/重做、修改标记

其中最值得关注的不是 JSON 格式本身，而是这种职责分离：

- `project.py` 负责“真相源”
- `session.py` 负责“交互过程中的可逆状态”

映射到 `spec-first`：

- `specs/<featureId>/stage-state.json`、`traceability-matrix.md`、`reports/*` 是真相源
- `process-engine`、`change-mgr`、`skill-runtime` 负责运行期推进与治理

差异也很明显：

- GIMP harness 有显式 `undo/redo`
- `spec-first` 当前主要提供阶段流转、RFC、defect、gate，而不是通用撤销栈

因此，这里的借鉴重点不该是“照抄 undo/redo”，而是：

- 明确区分“持久状态”和“会话状态”
- 对高风险动作保留更好的回滚/补救证据

### 3. 领域层：`core/export.py`

`export.py` 是 GIMP harness 的业务核心。它自己完成：

- 图层合成
- 滤镜链应用
- 格式选择与导出参数
- 输出文件落盘
- 基本产物验证

这里最重要的不是 Pillow 细节，而是“最终产物导向”：

- 不是只改中间状态
- 而是一定要导出一个真实文件
- 导出后立刻检查文件是否真的存在、大小是多少、格式是什么

这对 `spec-first` 的借鉴点非常明确：

- `spec-first` 现在的 gate 更偏文档完整性、追溯覆盖率、规则合规
- 真实构建、真实测试、真实可执行产物校验，应该补到现有 gate/validate 体系里

### 4. 真实后端层：`utils/gimp_backend.py`

这是这个案例里最有价值的一层。

`gimp_backend.py` 做的不是“模拟 GIMP”，而是：

- 先 `find_gimp()`
- 通过 `gimp -i -b` 调用批处理模式
- 导出完成后检查输出文件是否真的生成
- 若未生成，带着 stdout/stderr 直接报错

这正是 `CLI-Anything` 方法论里最重要的落地动作：

- 真实软件是硬依赖
- 不信任退出码
- 必须检查最终产物

映射到 `spec-first`，最接近的现有落点不是新写一个 `real_verification.py`，而是：

- `src/core/gate-engine/command-gate.ts`
- `src/core/gate-engine/gate-evaluator.ts`

原因很简单：

- `command-gate.ts` 已经具备“执行白名单命令并返回 PASS/FAIL 细节”的基础设施
- `gate-evaluator.ts` 已经是阶段质量门禁的总入口

所以最小改造路径应该是：

- 在现有 gate 条件中增加“真实命令证据”
- 在失败时输出更强的 stdout/stderr 摘要
- 必要时增加对最终产物存在性的二次检查

### 5. 测试层：`TEST.md` + `test_full_e2e.py`

GIMP harness 的测试不是一句“有 E2E”就结束，而是拆成了三层证据：

1. `test_core.py`
   - 纯单元测试
   - 只测 project/layer/filter/session 等内核行为

2. `test_full_e2e.py`
   - 真实文件输入输出
   - 像素级验证
   - CLI 子进程验证
   - 真实软件后端验证

3. `TEST.md`
   - 测试清单
   - 覆盖面说明
   - 最终测试结果粘贴

这里最值得借鉴的不是“必须用 TEST.md”，而是“测试计划和测试结果都能被人复核”。

## 三、最值得借鉴的 5 个实现模式

### 模式 1：入口薄，核心厚

CLI 文件不承载核心逻辑，核心逻辑进 `core/`。

对 `spec-first` 的意义：

- 保持 `src/cli/commands/*.ts` 只做参数分发
- 复杂逻辑继续沉到 `core/` 下的各 engine

### 模式 2：真相源与会话状态分离

GIMP harness 把项目文件和会话状态分成 `project.py` / `session.py`。

对 `spec-first` 的意义：

- 把 `specs/<featureId>` 内的持久产物和运行期上下文严格区分
- 对自动编排与人工修复链路保留更清晰的状态边界

### 模式 3：真实后端单独封装

`gimp_backend.py` 独立封装系统依赖和真实软件调用。

对 `spec-first` 的意义：

- 真实构建/测试/验证命令不要散落在多个地方
- 最好集中抽象成 gate-engine 可复用的执行单元

### 模式 4：用户视角子进程测试

`test_full_e2e.py` 里专门有 `TestCLISubprocess`，验证装好后的 CLI 是否可用。

对 `spec-first` 的意义：

- 现在已有 unit/integration/e2e，但还缺一层“安装后命令是否真的可用”的用户视角验证
- 这部分应该是 Node/Vitest 版，不是 Python 版

### 模式 5：测试证据落盘

`TEST.md` 让测试计划和最终结果都可追溯。

对 `spec-first` 的意义：

- 可以考虑把“验证计划 + 命令 + 结果摘要”落到 feature 目录
- 不一定叫 `TEST.md`，但应该有同等级别的可复核证据

## 四、映射到 spec-first 现有模块

| GIMP harness 元素 | 作用 | spec-first 当前对应点 | 结论 |
|---|---|---|---|
| `gimp_cli.py` | 命令入口、参数解析、统一错误处理 | `src/cli/index.ts` + `src/cli/commands/*.ts` | 已有基础，不需要照搬 |
| `project.py` | 项目格式真相源 | `specs/<featureId>/stage-state.json` 等产物 | 思路可借鉴 |
| `session.py` | 运行期状态、undo/redo | `process-engine` / `change-mgr` / `skill-runtime` | 只借鉴状态分层，不必照抄 |
| `export.py` | 最终产物导出与校验 | `gate-evaluator.ts` / `validate.ts` | 应补“最终产物证据” |
| `gimp_backend.py` | 调真实软件并验证输出 | `command-gate.ts` | 高度相关，适合增强 |
| `TEST.md` | 测试计划与结果证据 | feature 内 reports/findings/tests 产物 | 可借鉴为证据落盘模式 |
| `TestCLISubprocess` | 用户视角 CLI 校验 | `tests/e2e/*` | 当前偏弱，值得补 |
| `setup.py` + PEP420 | Python 打包与命名空间 | 无直接对应 | 不适用，跳过 |
| `repl_skin.py` | 统一终端交互层 | 可考虑未来 `shared` 输出层 | 可以借鉴接口，不要照搬实现 |

## 五、对 spec-first 的最小改造建议

如果只基于这个案例提炼最小、最现实的改造项，优先级建议如下。

### P0：增强 gate 的真实证据能力

落点：

- `src/core/gate-engine/command-gate.ts`
- `src/core/gate-engine/gate-evaluator.ts`

目标：

- 在现有 gate 条件里增加真实构建/真实测试命令的证据采集
- 对 stdout/stderr 和最终产物存在性做更强校验

### P1：补 CLI 子进程 E2E

落点：

- `tests/e2e/`

目标：

- 用 Node 子进程调用已构建的 `spec-first` 命令
- 覆盖 `--help`、基础工作流、错误路径和安装态行为

### P1：统一输出接口而不是统一皮肤实现

落点：

- `src/shared/` 或新的 `src/cli/support/`

目标：

- 先统一成功/错误/警告/表格/状态块的接口
- 不要一开始就引入复杂 REPL 皮肤

### P2：补验证证据文档

落点：

- `specs/<featureId>/reports/`

目标：

- 为验证阶段补充一份计划 + 结果摘要文档
- 让“跑了什么、为什么算通过”可被复核

## 六、不应直接借鉴的部分

以下内容不应直接搬到 `spec-first`：

- Python 文件命名、目录结构、`setup.py`
- PEP 420 命名空间包
- `sys.executable -m ...` 这类 Python CLI fallback
- Pillow/GIMP 这类与图像处理领域强绑定的实现细节

这些内容属于“GIMP harness 为了服务图像编辑场景采取的具体技术解”，不是 `spec-first` 的通用解。

## 七、结论

GIMP harness 这个案例证明了一件事：

- `CLI-Anything` 真正强的不是单个技巧，而是“入口薄、核心分层、真实后端、用户视角测试、证据落盘”这一整套闭环

对 `spec-first` 来说，最应该借鉴的是这 5 个抽象模式：

1. 真实后端/真实命令必须有证据
2. 最终产物比中间状态更重要
3. CLI 子进程测试必须存在
4. 测试与验证结果必须可复核
5. 借鉴要落在现有 TypeScript 架构上，而不是另起一套 Python 结构

因此，这个实现案例给出的结论不是“去写 `output_skin.py` 或 `stage_gates.py`”，而是：

- 在 `spec-first` 现有 `gate + validate + tests + reports` 体系上，补齐真实证据链和用户视角验证链
