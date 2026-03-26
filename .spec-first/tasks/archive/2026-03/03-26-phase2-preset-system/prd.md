# Phase 2: Preset System - with-tdd & debug

## Goal

在不扩张 topology 的前提下,通过 preset 机制增加高价值策略组合,支持 `with-tdd` 和 `debug` 两个预设。

## Requirements

### 1. Preset 机制
- 支持 `--preset` CLI 参数
- Preset 是编译输入,不是新的 runtime 字段
- 编译结果仍然收敛到 `workflow_type + decision_hints`

### 2. 支持两个 Preset
- `with-tdd`: default topology + tdd_required mode
- `debug`: quick-fix topology + tdd_required mode

### 3. 编译规则
```python
# with-tdd
workflow_type = "default"
decision_hints.implement.mode = "tdd_required"

# debug
workflow_type = "quick-fix"
decision_hints.implement.mode = "tdd_required"
```

### 4. CLI 接口
```bash
python3 task.py create "title" --workflow default --preset with-tdd
python3 task.py create "title" --preset debug  # 隐式 workflow=quick-fix
```

## Acceptance Criteria

- [ ] CLI 支持 `--preset` 参数 (with-tdd, debug)
- [ ] with-tdd 编译为 default + tdd_required
- [ ] debug 编译为 quick-fix + tdd_required
- [ ] task.json 包含正确的 workflow_type 和 decision_hints
- [ ] 不新增独立 phase
- [ ] 不修改 topology registry

## Technical Notes

**修改文件**:
1. `task_store.py` - 添加 preset 编译逻辑
2. `task.py` - 添加 --preset 参数
3. 可选: 创建 `preset_registry.py`

**不做**:
- 不支持 with-review
- 不把 research 纳入 workflow
- 不新增 tdd/review/debug-systematic phase
