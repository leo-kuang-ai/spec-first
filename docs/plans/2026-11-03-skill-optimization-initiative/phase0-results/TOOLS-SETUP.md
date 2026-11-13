# Phase 0 工具准备清单

**文档版本**：v1.0  
**创建日期**：2026-11-03  
**目的**：确保 Phase 0 执行前所有必要工具已准备就绪

---

## 🎯 工具清单总览

| 类别 | 必备/可选 | 工具数量 | 状态 |
|---|---|---|---|
| Git 工具 | 必备 | 3 个 | [ ] |
| PR 分析工具 | 必备 | 1-2 个 | [ ] |
| 文档工具 | 必备 | 2 个 | [ ] |
| 自动化脚本 | 可选 | 3 个 | [ ] |
| 协作工具 | 可选 | 2 个 | [ ] |

---

## ✅ 必备工具（Phase 0 前必须安装）

### 1. Git 基础工具

**用途**：追踪任务历史、查看代码变更

**检查命令**：
```bash
# 检查 Git 是否安装
git --version
# 预期输出：git version 2.x.x
```

**如果未安装**：
```bash
# macOS
brew install git

# Ubuntu/Debian
sudo apt-get install git

# Windows
# 下载安装包：https://git-scm.com/download/win
```

**验证**：
```bash
# 测试基本命令
git log --oneline -5
git diff HEAD~1
```

**状态**：[ ] 已安装并验证

---

### 2. GitHub CLI (gh) 或 GitLab CLI (glab)

**用途**：查看 PR/MR 信息、讨论记录

**检查命令**：
```bash
# GitHub
gh --version

# GitLab
glab --version
```

**安装（GitHub CLI）**：
```bash
# macOS
brew install gh

# Ubuntu/Debian
(type -p wget >/dev/null || (sudo apt update && sudo apt-get install wget -y)) \
&& sudo mkdir -p -m 755 /etc/apt/keyrings \
&& wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
&& sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
&& echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
&& sudo apt update \
&& sudo apt install gh -y

# Windows
# 下载安装包：https://cli.github.com/
```

**配置**：
```bash
# 登录
gh auth login

# 验证
gh pr list --limit 5
```

**安装（GitLab CLI）**：
```bash
# macOS
brew install glab

# Ubuntu/Debian
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 3F02B05A
echo "deb https://ppa.launchpadcontent.net/gitlab-org/cli/ubuntu focal main" | sudo tee -a /etc/apt/sources.list
sudo apt update
sudo apt install glab

# 配置
glab auth login
```

**状态**：[ ] 已安装并验证

---

### 3. YAML 验证工具

**用途**：验证追踪 YAML 格式正确

**安装**：
```bash
# 使用 Python pip
pip install yamllint

# 或使用 npm
npm install -g yaml-lint
```

**验证**：
```bash
# 创建测试文件
echo "test: value" > test.yaml

# 验证
yamllint test.yaml
# 或
yaml-lint test.yaml

# 清理
rm test.yaml
```

**配置（可选）**：
```bash
# 创建 .yamllint 配置文件
cat > ~/.yamllint << 'YAMLEOF'
extends: default
rules:
  line-length:
    max: 120
  comments:
    min-spaces-from-content: 1
YAMLEOF
```

**状态**：[ ] 已安装并验证

---

### 4. Markdown 编辑器

**用途**：编写追踪文档、报告

**推荐选项**：

**选项 1：VSCode（推荐）**
```bash
# macOS
brew install --cask visual-studio-code

# Ubuntu
sudo snap install code --classic

# Windows
# 下载安装包：https://code.visualstudio.com/
```

**VSCode 插件（推荐）**：
```
- Markdown All in One
- YAML
- GitLens（查看 Git 历史）
- Code Spell Checker（拼写检查）
```

**选项 2：其他编辑器**
- Typora（所见即所得）
- Sublime Text
- Vim/Emacs（如果熟悉）

**状态**：[ ] 已安装

---

### 5. 文件访问权限

**检查清单**：
- [ ] 可以访问项目 Git 仓库
- [ ] 可以查看 PR/MR
- [ ] 可以访问项目文档（RESOURCE-PLAN.md 等）
- [ ] 可以创建 phase0-results/ 目录下的文件

**验证**：
```bash
# 进入项目目录
cd /path/to/project

# 测试 Git 访问
git status
git log -5

# 测试文件写入
mkdir -p phase0-results/test
echo "test" > phase0-results/test/test.txt
rm -rf phase0-results/test
```

**状态**：[ ] 已验证

---

## 🔧 可选工具（提升效率）

### 6. 自动化验证脚本

**用途**：自动检查 Contract/Protocol 合规性

#### 脚本 1：Contract 验证脚本

**创建文件**：`scripts/validate-contract.py`

```python
#!/usr/bin/env python3
"""
Contract 验证脚本
用法：python scripts/validate-contract.py task-01.yaml
"""

import sys
import yaml

def validate_prd_contract(prd_output):
    """验证 spec-prd 输出是否符合 Contract"""
    required_fields = [
        'functional_requirements',
        'boundary_conditions',
        'out_of_scope'
    ]
    
    issues = []
    for field in required_fields:
        if field not in prd_output:
            issues.append(f"缺少必需字段: {field}")
    
    # 验证 functional_requirements
    if 'functional_requirements' in prd_output:
        frs = prd_output['functional_requirements']
        if not frs or len(frs) < 1:
            issues.append("functional_requirements 至少需要 1 项")
        
        for fr in frs:
            if 'acceptance_criteria' not in fr or not fr['acceptance_criteria']:
                issues.append(f"FR {fr.get('id', '?')} 缺少 acceptance_criteria")
    
    # 验证 boundary_conditions
    if 'boundary_conditions' in prd_output:
        bcs = prd_output['boundary_conditions']
        if not bcs or len(bcs) < 3:
            issues.append("boundary_conditions 至少需要 3 项")
    
    return issues

def main():
    if len(sys.argv) < 2:
        print("用法: python validate-contract.py <task-yaml-file>")
        sys.exit(1)
    
    filename = sys.argv[1]
    
    with open(filename, 'r', encoding='utf-8') as f:
        task = yaml.safe_load(f)
    
    print(f"验证文件: {filename}")
    
    # 查找 spec-prd 阶段
    for stage in task.get('workflow', []):
        if stage.get('skill_used') == 'spec-prd':
            print("\n检查 spec-prd Contract...")
            issues = validate_prd_contract(stage.get('output', {}))
            
            if issues:
                print("❌ 发现问题:")
                for issue in issues:
                    print(f"  - {issue}")
            else:
                print("✅ spec-prd Contract 验证通过")
    
    print("\n验证完成")

if __name__ == '__main__':
    main()
```

**使用**：
```bash
chmod +x scripts/validate-contract.py
python scripts/validate-contract.py phase0-results/task-flow-traces/task-01.yaml
```

**状态**：[ ] 已创建

---

#### 脚本 2：统计分析脚本

**创建文件**：`scripts/analyze-phase0.py`

```python
#!/usr/bin/env python3
"""
Phase 0 统计分析脚本
用法：python scripts/analyze-phase0.py phase0-results/task-flow-traces/
"""

import sys
import os
import yaml
from collections import Counter

def analyze_tasks(task_dir):
    """分析所有追踪任务"""
    tasks = []
    
    # 读取所有 YAML 文件
    for filename in os.listdir(task_dir):
        if filename.endswith('.yaml'):
            with open(os.path.join(task_dir, filename), 'r', encoding='utf-8') as f:
                tasks.append(yaml.safe_load(f))
    
    print(f"共分析 {len(tasks)} 个任务\n")
    
    # 统计端到端质量
    correct = sum(1 for t in tasks if t.get('summary', {}).get('correct', False))
    rework = sum(1 for t in tasks if t.get('summary', {}).get('correct', True) == False)
    
    print("=== Layer 3: 端到端质量 ===")
    print(f"端到端正确率: {correct}/{len(tasks)} = {correct/len(tasks)*100:.1f}%")
    print(f"端到端返工率: {rework}/{len(tasks)} = {rework/len(tasks)*100:.1f}%")
    
    # 统计阻力点
    friction_types = Counter()
    for task in tasks:
        for stage in task.get('workflow', []):
            for fp in stage.get('friction_points', []):
                friction_types[fp.get('type')] += 1
    
    print("\n=== Layer 2: 阻力点分布 ===")
    for ftype, count in friction_types.most_common():
        print(f"{ftype}: {count} 次 ({count/len(tasks)*100:.1f}% 任务)")
    
    # 统计根因
    root_causes = Counter()
    for task in tasks:
        for stage in task.get('workflow', []):
            for fp in stage.get('friction_points', []):
                root_causes[fp.get('root_cause', {}).get('category')] += 1
    
    print("\n=== 根因归因 ===")
    for cause, count in root_causes.most_common():
        print(f"{cause}: {count} 次 ({count/sum(root_causes.values())*100:.1f}%)")
    
    print("\n分析完成")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("用法: python analyze-phase0.py <task-dir>")
        sys.exit(1)
    
    analyze_tasks(sys.argv[1])
```

**使用**：
```bash
chmod +x scripts/analyze-phase0.py
python scripts/analyze-phase0.py phase0-results/task-flow-traces/
```

**状态**：[ ] 已创建

---

### 7. 协作工具（多人追踪时）

**选项 1：GitHub Projects / GitLab Boards**

**用途**：跟踪追踪进度

**设置**：
```
1. 创建 Project：Phase 0 Tracking
2. 列：To Track / Tracking / Done
3. 每个任务一张卡片
4. 分配给执行者
```

**状态**：[ ] 已设置（如果需要）

---

**选项 2：Jira / Notion（如果团队已使用）**

**用途**：项目管理和进度同步

**设置**：
```
1. 创建 Epic：Phase 0 - Task Flow Tracking
2. 创建 11 个 Story（每个任务一个）
3. 设置 Sprint（2 周）
```

**状态**：[ ] 已设置（如果需要）

---

## 🚀 一键安装脚本

### 自动化安装脚本

**创建文件**：`scripts/setup-phase0-tools.sh`

```bash
#!/bin/bash
# Phase 0 工具一键安装脚本

set -e

echo "=== Phase 0 工具安装脚本 ==="
echo ""

# 检测操作系统
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="Linux"
else
    echo "不支持的操作系统: $OSTYPE"
    exit 1
fi

echo "检测到操作系统: $OS"
echo ""

# 检查 Git
echo "检查 Git..."
if command -v git &> /dev/null; then
    echo "✅ Git 已安装: $(git --version)"
else
    echo "❌ Git 未安装"
    if [[ "$OS" == "macOS" ]]; then
        echo "安装 Git..."
        brew install git
    else
        echo "请手动安装 Git: sudo apt-get install git"
        exit 1
    fi
fi

# 检查 GitHub CLI
echo ""
echo "检查 GitHub CLI..."
if command -v gh &> /dev/null; then
    echo "✅ GitHub CLI 已安装: $(gh --version | head -1)"
else
    echo "❌ GitHub CLI 未安装"
    if [[ "$OS" == "macOS" ]]; then
        echo "安装 GitHub CLI..."
        brew install gh
    else
        echo "请手动安装 GitHub CLI"
        exit 1
    fi
fi

# 检查 yamllint
echo ""
echo "检查 yamllint..."
if command -v yamllint &> /dev/null; then
    echo "✅ yamllint 已安装"
else
    echo "❌ yamllint 未安装"
    echo "安装 yamllint..."
    pip3 install yamllint
fi

# 创建必要目录
echo ""
echo "创建必要目录..."
mkdir -p phase0-results/task-flow-traces
mkdir -p phase0-results/decisions
mkdir -p scripts
echo "✅ 目录已创建"

# 测试权限
echo ""
echo "测试文件权限..."
touch phase0-results/test.txt && rm phase0-results/test.txt
echo "✅ 文件权限正常"

echo ""
echo "=== 安装完成 ==="
echo ""
echo "下一步:"
echo "1. 如果使用 GitHub，运行: gh auth login"
echo "2. 阅读 core/02-execution-quick-reference.md"
echo "3. 开始 Phase -1 试点"
```

**使用**：
```bash
chmod +x scripts/setup-phase0-tools.sh
./scripts/setup-phase0-tools.sh
```

**状态**：[ ] 已创建并运行

---

## ✅ 工具就绪检查清单

### Phase -1 前检查

- [ ] Git 已安装并验证（git --version）
- [ ] GitHub CLI 或 GitLab CLI 已安装
- [ ] 已配置 Git 身份（git config user.name/email）
- [ ] 可以访问项目仓库（git log 可用）
- [ ] 可以查看 PR（gh pr list 或 glab mr list）
- [ ] Markdown 编辑器已准备
- [ ] 文件权限已验证

### Phase 0 前检查（额外）

- [ ] yamllint 已安装
- [ ] phase0-results/ 目录已创建
- [ ] 追踪模板已准备（见 core/02-execution-checklist.md）
- [ ] 可选：验证脚本已创建
- [ ] 可选：统计脚本已创建
- [ ] 可选：协作工具已设置

---

## 📞 工具问题排查

### 问题 1：Git 命令权限不足

**症状**：git log 返回 "permission denied"

**解决**：
```bash
# 检查目录权限
ls -la .git

# 修复权限
chmod -R u+rwX .git
```

---

### 问题 2：GitHub CLI 认证失败

**症状**：gh pr list 返回 "authentication failed"

**解决**：
```bash
# 重新登录
gh auth logout
gh auth login

# 选择 GitHub.com
# 选择 HTTPS
# 使用 浏览器登录
```

---

### 问题 3：yamllint 找不到命令

**症状**：command not found: yamllint

**解决**：
```bash
# 检查 Python
python3 --version

# 重新安装
pip3 install --user yamllint

# 添加到 PATH（如果需要）
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

---

## 📝 工具使用快速参考

### Git 常用命令

```bash
# 查看最近 10 个提交
git log --oneline -10

# 查看某个提交的详细信息
git show <commit-hash>

# 查看某个文件的历史
git log --follow -- path/to/file

# 查看 PR 相关的提交
git log --oneline --grep="PR-123"
```

### GitHub CLI 常用命令

```bash
# 查看最近的 PR
gh pr list --limit 10

# 查看 PR 详情
gh pr view 123

# 查看 PR 的讨论
gh pr view 123 --comments

# 查看 PR 的文件变更
gh pr diff 123
```

### yamllint 使用

```bash
# 验证单个文件
yamllint file.yaml

# 验证目录下所有 YAML
yamllint phase0-results/

# 忽略特定规则
yamllint -d '{extends: default, rules: {line-length: disable}}' file.yaml
```

---

**文档版本**：v1.0  
**创建日期**：2026-11-03  
**更新日期**：Phase -1 前应验证所有必备工具  
**维护责任人**：执行者
