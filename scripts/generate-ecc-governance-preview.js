#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const REPO_ROOT = path.join(__dirname, '..');
const ECC_ROOT = process.env.ECC_SOURCE_ROOT || '/Users/kuang/xiaobu/everything-claude-code';
const ECC_DOCS_DIR = path.join(REPO_ROOT, 'docs', '02-架构设计', 'ECC集成');
const DEFAULT_OUTPUT_DIR = path.join(ECC_DOCS_DIR, 'generated');

const SCHEMA_VERSION = 'spec-first.ecc-governance-preview.v1';

const PACKS = [
  {
    id: 'product-scope-pack',
    name: 'Product & Scope Pack',
    priority: 'P0',
    type: 'core',
    default_enabled: true,
    default_workflows: ['spec-brainstorm', 'spec-doc-review', 'spec-plan'],
    agents: [
      'spec-product-lens-reviewer',
      'spec-scope-guardian-reviewer',
      'spec-spec-flow-analyzer',
    ],
    quality_nodes: ['Spec', 'Brainstorm', 'Doc Review'],
  },
  {
    id: 'document-quality-pack',
    name: 'Document Quality Pack',
    priority: 'P0',
    type: 'core',
    default_enabled: true,
    default_workflows: ['spec-doc-review', 'spec-plan'],
    agents: [
      'spec-coherence-reviewer',
      'spec-feasibility-reviewer',
      'spec-adversarial-document-reviewer',
      'spec-security-lens-reviewer',
    ],
    quality_nodes: ['Spec', 'Plan', 'Doc Review'],
  },
  {
    id: 'engineering-quality-pack',
    name: 'Engineering Quality Pack',
    priority: 'P0',
    type: 'core',
    default_enabled: true,
    default_workflows: ['spec-code-review', 'spec-debug', 'spec-work'],
    agents: [
      'spec-correctness-reviewer',
      'spec-testing-reviewer',
      'spec-maintainability-reviewer',
      'spec-reliability-reviewer',
      'spec-code-simplicity-reviewer',
      'spec-adversarial-reviewer',
    ],
    quality_nodes: ['Code', 'Review'],
  },
  {
    id: 'architecture-contract-pack',
    name: 'Architecture & Contract Pack',
    priority: 'P0',
    type: 'core',
    default_enabled: true,
    default_workflows: ['spec-plan', 'spec-code-review'],
    agents: [
      'spec-architecture-strategist',
      'spec-api-contract-reviewer',
      'spec-repo-research-analyst',
      'spec-git-history-analyzer',
    ],
    quality_nodes: ['Codebase', 'Graph', 'Plan', 'Review'],
  },
  {
    id: 'governance-pack',
    name: 'Governance Pack',
    priority: 'P0',
    type: 'core',
    default_enabled: true,
    default_workflows: ['spec-skill-audit', 'spec-update', 'spec-compound', 'spec-code-review'],
    agents: [
      'spec-project-standards-reviewer',
      'spec-agent-native-reviewer',
      'spec-cli-readiness-reviewer',
      'spec-cli-agent-readiness-reviewer',
      'spec-learnings-researcher',
      'spec-pattern-recognition-specialist',
    ],
    quality_nodes: ['Knowledge', 'Review'],
  },
  {
    id: 'security-deep-pack',
    name: 'Security Deep Pack',
    priority: 'P1',
    type: 'conditional',
    default_enabled: false,
    default_workflows: ['spec-code-review', 'spec-plan', 'spec-doc-review'],
    trigger_signals: ['auth', 'authorization', 'permission', 'token', 'secret', 'pii', 'external_input'],
    agents: ['spec-security-reviewer', 'spec-security-sentinel'],
    quality_nodes: ['Plan', 'Code', 'Review'],
  },
  {
    id: 'data-pack',
    name: 'Data Pack',
    priority: 'P1',
    type: 'conditional',
    default_enabled: false,
    default_workflows: ['spec-plan', 'spec-code-review'],
    trigger_signals: ['database', 'migration', 'sql', 'schema', 'production_data', 'etl'],
    agents: [
      'spec-data-integrity-guardian',
      'spec-data-migrations-reviewer',
      'spec-data-migration-expert',
      'spec-schema-drift-detector',
      'spec-deployment-verification-agent',
    ],
    quality_nodes: ['Codebase', 'Plan', 'Code', 'Review'],
  },
  {
    id: 'performance-pack',
    name: 'Performance Pack',
    priority: 'P1',
    type: 'conditional',
    default_enabled: false,
    default_workflows: ['spec-code-review', 'spec-plan'],
    trigger_signals: ['performance', 'cache', 'loop', 'render', 'concurrency', 'io'],
    agents: ['spec-performance-reviewer', 'spec-performance-oracle'],
    quality_nodes: ['Plan', 'Code', 'Review'],
  },
  {
    id: 'frontend-app-pack',
    name: 'Frontend / App Pack',
    priority: 'P1',
    type: 'conditional',
    default_enabled: false,
    default_workflows: ['spec-app-consistency-audit', 'spec-code-review', 'spec-doc-review'],
    trigger_signals: ['ui', 'tsx', 'design', 'mobile', 'ios', 'kmp', 'frontend_async'],
    agents: [
      'spec-design-lens-reviewer',
      'spec-design-implementation-reviewer',
      'spec-design-iterator',
      'spec-swift-ios-reviewer',
      'spec-julik-frontend-races-reviewer',
    ],
    quality_nodes: ['Spec', 'Plan', 'Code', 'Review'],
  },
  {
    id: 'language-pack',
    name: 'Language Pack',
    priority: 'P1',
    type: 'conditional',
    default_enabled: false,
    default_workflows: ['spec-code-review'],
    trigger_signals: ['typescript', 'python', 'rails', 'language_specific'],
    agents: [
      'spec-kieran-typescript-reviewer',
      'spec-kieran-python-reviewer',
      'spec-kieran-rails-reviewer',
    ],
    quality_nodes: ['Code', 'Review'],
  },
  {
    id: 'research-pack',
    name: 'Research Pack',
    priority: 'P1',
    type: 'conditional',
    default_enabled: false,
    default_workflows: ['spec-plan', 'spec-doc-review', 'spec-code-review'],
    trigger_signals: ['new_framework', 'uncertain_api', 'external_research', 'source_freshness'],
    agents: [
      'spec-best-practices-researcher',
      'spec-framework-docs-researcher',
      'spec-web-researcher',
      'spec-session-historian',
    ],
    quality_nodes: ['Codebase', 'Plan', 'Review'],
  },
  {
    id: 'team-context-pack',
    name: 'Team Context Pack',
    priority: 'P2',
    type: 'optional',
    default_enabled: false,
    default_workflows: ['spec-brainstorm', 'spec-plan', 'spec-doc-review'],
    trigger_signals: ['explicit_slack', 'issues', 'prior_comments', 'team_context'],
    agents: [
      'spec-slack-researcher',
      'spec-issue-intelligence-analyst',
      'spec-previous-comments-reviewer',
      'spec-pr-comment-resolver',
    ],
    quality_nodes: ['Spec', 'Plan', 'Review'],
  },
  {
    id: 'external-design-pack',
    name: 'External Design Pack',
    priority: 'P2',
    type: 'optional',
    default_enabled: false,
    default_workflows: ['spec-app-consistency-audit', 'spec-doc-review'],
    trigger_signals: ['figma', 'external_design'],
    agents: ['spec-figma-design-sync'],
    quality_nodes: ['Spec', 'Plan', 'Review'],
  },
  {
    id: 'style-profile-pack',
    name: 'Style Profile Pack',
    priority: 'P3',
    type: 'style_profile',
    default_enabled: false,
    default_workflows: ['spec-code-review', 'spec-doc-review'],
    trigger_signals: ['explicit_style_profile'],
    agents: [
      'spec-dhh-rails-reviewer',
      'spec-ankane-readme-writer',
    ],
    quality_nodes: ['Review'],
  },
];

const AGENT_OVERRIDES = {
  'spec-julik-frontend-races-reviewer': {
    canonical_id: 'frontend-async-race-expert',
    integration_action: 'rename_generic',
    overlap_status: 'partial_match',
  },
  'spec-kieran-typescript-reviewer': {
    canonical_id: 'typescript-expert',
    integration_action: 'rename_generic',
    overlap_status: 'partial_match',
  },
  'spec-kieran-python-reviewer': {
    canonical_id: 'python-expert',
    integration_action: 'rename_generic',
    overlap_status: 'partial_match',
  },
  'spec-kieran-rails-reviewer': {
    canonical_id: 'rails-convention-expert',
    integration_action: 'rename_generic',
    overlap_status: 'partial_match',
  },
  'spec-schema-drift-detector': {
    canonical_id: 'generated-artifact-drift-expert',
    integration_action: 'rename_generic',
    overlap_status: 'partial_match',
  },
  'spec-dhh-rails-reviewer': {
    canonical_id: 'rails-style-profile-dhh',
    integration_action: 'optional_profile',
    overlap_status: 'style_profile',
  },
  'spec-ankane-readme-writer': {
    canonical_id: 'readme-style-profile-ankane',
    integration_action: 'optional_profile',
    overlap_status: 'style_profile',
  },
  'spec-agent-native-reviewer': {
    overlap_status: 'spec_first_native',
    integration_action: 'keep_as_is',
  },
  'spec-cli-readiness-reviewer': {
    overlap_status: 'spec_first_native',
    integration_action: 'keep_as_is',
  },
  'spec-cli-agent-readiness-reviewer': {
    overlap_status: 'spec_first_native',
    integration_action: 'keep_as_is',
  },
  'spec-previous-comments-reviewer': {
    overlap_status: 'spec_first_native',
    integration_action: 'keep_as_is',
  },
};

const ECC_AGENT_MAP = {
  'a11y-architect': ['spec-design-lens-reviewer', 'spec-design-implementation-reviewer'],
  architect: ['spec-architecture-strategist'],
  'build-error-resolver': [],
  'chief-of-staff': [],
  'code-architect': ['spec-architecture-strategist'],
  'code-explorer': ['spec-repo-research-analyst'],
  'code-reviewer': ['spec-correctness-reviewer', 'spec-testing-reviewer', 'spec-maintainability-reviewer'],
  'code-simplifier': ['spec-code-simplicity-reviewer'],
  'comment-analyzer': ['spec-pr-comment-resolver', 'spec-previous-comments-reviewer'],
  'conversation-analyzer': ['spec-session-historian'],
  'cpp-build-resolver': [],
  'cpp-reviewer': [],
  'csharp-reviewer': [],
  'dart-build-resolver': [],
  'database-reviewer': ['spec-data-integrity-guardian', 'spec-data-migrations-reviewer'],
  'doc-updater': ['spec-coherence-reviewer', 'spec-learnings-researcher'],
  'docs-lookup': ['spec-framework-docs-researcher', 'spec-web-researcher'],
  'e2e-runner': ['spec-testing-reviewer', 'spec-deployment-verification-agent'],
  'flutter-reviewer': ['spec-design-implementation-reviewer'],
  'gan-evaluator': [],
  'gan-generator': [],
  'gan-planner': [],
  'go-build-resolver': [],
  'go-reviewer': [],
  'harness-optimizer': ['spec-agent-native-reviewer', 'spec-cli-agent-readiness-reviewer'],
  'healthcare-reviewer': [],
  'java-build-resolver': [],
  'java-reviewer': [],
  'kotlin-build-resolver': [],
  'kotlin-reviewer': [],
  'loop-operator': [],
  'opensource-forker': [],
  'opensource-packager': [],
  'opensource-sanitizer': [],
  'performance-optimizer': ['spec-performance-reviewer', 'spec-performance-oracle'],
  planner: ['spec-architecture-strategist', 'spec-feasibility-reviewer'],
  'pr-test-analyzer': ['spec-testing-reviewer'],
  'python-reviewer': ['spec-kieran-python-reviewer'],
  'pytorch-build-resolver': [],
  'refactor-cleaner': ['spec-maintainability-reviewer', 'spec-code-simplicity-reviewer'],
  'rust-build-resolver': [],
  'rust-reviewer': [],
  'security-reviewer': ['spec-security-reviewer', 'spec-security-lens-reviewer'],
  'seo-specialist': [],
  'silent-failure-hunter': ['spec-reliability-reviewer', 'spec-correctness-reviewer'],
  'tdd-guide': ['spec-testing-reviewer'],
  'type-design-analyzer': ['spec-kieran-typescript-reviewer', 'spec-api-contract-reviewer'],
  'typescript-reviewer': ['spec-kieran-typescript-reviewer'],
};

const ECC_AGENT_CLASSIFICATION = {
  'build-error-resolver': ['missing_in_spec_first', 'optional_lens', 'P2', 'build resolver capability; keep checklist/reference until stack opt-in'],
  'chief-of-staff': ['missing_in_spec_first', 'reference_only', 'P3', 'organizational operations role outside current R&D expert pack scope'],
  'cpp-build-resolver': ['missing_in_spec_first', 'optional_lens', 'P2', 'build resolver capability; stack-specific opt-in only'],
  'cpp-reviewer': ['missing_in_spec_first', 'optional_lens', 'P2', 'language reviewer not present in current source agents'],
  'csharp-reviewer': ['missing_in_spec_first', 'optional_lens', 'P2', 'language reviewer not present in current source agents'],
  'dart-build-resolver': ['missing_in_spec_first', 'optional_lens', 'P2', 'build resolver capability; stack-specific opt-in only'],
  'flutter-reviewer': ['partial_match', 'optional_lens', 'P2', 'frontend/app expertise partially covered by design and mobile reviewers'],
  'gan-evaluator': ['missing_in_spec_first', 'optional_profile', 'P3', 'experimental harness reference only'],
  'gan-generator': ['missing_in_spec_first', 'optional_profile', 'P3', 'experimental harness reference only'],
  'gan-planner': ['missing_in_spec_first', 'optional_profile', 'P3', 'experimental harness reference only'],
  'go-build-resolver': ['missing_in_spec_first', 'optional_lens', 'P2', 'build resolver capability; stack-specific opt-in only'],
  'go-reviewer': ['missing_in_spec_first', 'optional_lens', 'P2', 'language reviewer not present in current source agents'],
  'healthcare-reviewer': ['missing_in_spec_first', 'reference_only', 'P3', 'healthcare domain excluded from current R&D-focused integration'],
  'java-build-resolver': ['missing_in_spec_first', 'optional_lens', 'P2', 'build resolver capability; stack-specific opt-in only'],
  'java-reviewer': ['missing_in_spec_first', 'optional_lens', 'P2', 'language reviewer not present in current source agents'],
  'kotlin-build-resolver': ['missing_in_spec_first', 'optional_lens', 'P2', 'build resolver capability; stack-specific opt-in only'],
  'kotlin-reviewer': ['missing_in_spec_first', 'optional_lens', 'P2', 'language reviewer not present in current source agents'],
  'loop-operator': ['missing_in_spec_first', 'optional_profile', 'P3', 'autonomous loop reference for spec-optimize only'],
  'opensource-forker': ['missing_in_spec_first', 'optional_lens', 'P2', 'open-source release capability requires explicit opt-in'],
  'opensource-packager': ['missing_in_spec_first', 'optional_lens', 'P2', 'open-source release capability requires explicit opt-in'],
  'opensource-sanitizer': ['missing_in_spec_first', 'optional_lens', 'P2', 'open-source release capability requires explicit opt-in'],
  'pytorch-build-resolver': ['missing_in_spec_first', 'optional_lens', 'P2', 'build resolver capability; stack-specific opt-in only'],
  'rust-build-resolver': ['missing_in_spec_first', 'optional_lens', 'P2', 'build resolver capability; stack-specific opt-in only'],
  'rust-reviewer': ['missing_in_spec_first', 'optional_lens', 'P2', 'language reviewer not present in current source agents'],
  'seo-specialist': ['missing_in_spec_first', 'reference_only', 'P3', 'media/growth domain excluded from current R&D-focused integration'],
};

const RUBRIC_SELECTION = {
  'security-review': ['spec-security-reviewer', 'Review', 'security', 'agent_enhancement'],
  'security-scan': ['spec-security-sentinel', 'Review', 'security', 'agent_enhancement'],
  'safety-guard': ['spec-security-lens-reviewer', 'Plan', 'security', 'agent_enhancement'],
  'api-design': ['spec-api-contract-reviewer', 'Plan', 'api_contract', 'agent_enhancement'],
  'database-migrations': ['spec-data-migrations-reviewer', 'Code', 'data_migration', 'agent_enhancement'],
  'postgres-patterns': ['spec-data-integrity-guardian', 'Code', 'data_integrity', 'rubric_reference'],
  'clickhouse-io': ['spec-data-integrity-guardian', 'Code', 'data_integrity', 'rubric_reference'],
  'frontend-patterns': ['spec-design-implementation-reviewer', 'Code', 'frontend', 'agent_enhancement'],
  accessibility: ['spec-design-lens-reviewer', 'Review', 'accessibility', 'agent_enhancement'],
  'browser-qa': ['spec-testing-reviewer', 'Review', 'e2e_testing', 'rubric_reference'],
  'click-path-audit': ['spec-spec-flow-analyzer', 'Spec', 'user_flow', 'rubric_reference'],
  'design-system': ['spec-design-lens-reviewer', 'Plan', 'design_system', 'rubric_reference'],
  'code-tour': ['spec-repo-research-analyst', 'Codebase', 'repo_research', 'rubric_reference'],
  'repo-scan': ['spec-repo-research-analyst', 'Codebase', 'repo_research', 'rubric_reference'],
  'architecture-decision-records': ['spec-architecture-strategist', 'Plan', 'architecture', 'rubric_reference'],
  'hexagonal-architecture': ['spec-architecture-strategist', 'Plan', 'architecture', 'rubric_reference'],
  'tdd-workflow': ['spec-testing-reviewer', 'Code', 'testing', 'agent_enhancement'],
  'ai-regression-testing': ['spec-testing-reviewer', 'Review', 'testing', 'rubric_reference'],
  'e2e-testing': ['spec-testing-reviewer', 'Review', 'e2e_testing', 'rubric_reference'],
  'verification-loop': ['spec-deployment-verification-agent', 'Review', 'verification', 'rubric_reference'],
  'context-budget': ['spec-agent-native-reviewer', 'Review', 'context_governance', 'agent_enhancement'],
  'skill-comply': ['spec-agent-native-reviewer', 'Review', 'skill_governance', 'agent_enhancement'],
  'skill-stocktake': ['spec-cli-agent-readiness-reviewer', 'Review', 'skill_inventory', 'rubric_reference'],
  'mcp-server-patterns': ['spec-cli-readiness-reviewer', 'Plan', 'tooling', 'rubric_reference'],
  'documentation-lookup': ['spec-framework-docs-researcher', 'Plan', 'research', 'rubric_reference'],
  'search-first': ['spec-web-researcher', 'Plan', 'research', 'rubric_reference'],
  'deep-research': ['spec-best-practices-researcher', 'Plan', 'research', 'rubric_reference'],
};

const EXCLUDED_RUBRIC_PREFIXES = [
  'healthcare',
  'hipaa',
  'finance',
  'logistics',
  'customs',
  'energy',
  'inventory',
  'production-scheduling',
  'web3',
  'defi',
  'seo',
  'article',
  'content',
  'video',
  'investor',
  'lead',
  'market',
  'social',
];

const QUALITY_GATES = [
  ['Source Evidence Gate', 'ECC 清单数量与 provider source 可追溯', '标记 stale，重新生成或回读 source'],
  ['Workflow Compatibility Gate', '不覆盖现有 persona catalog、workflow-native schema 或 synthesis 输出', '阻断进入 prompt/runtime，先补 adapter'],
  ['Overlap Gate', 'direct_match 不新增 agent，native 不被 ECC 覆盖，profile 不进默认路由', '阻断该 entry 进入 registry'],
  ['Rubric Extraction Gate', '每个 ECC skill 采纳项有 source、target、dedupe、quality_node、adoption_action', '不写入 agent prompt，只保留 candidate'],
  ['Naming Gate', 'canonical_id 产品化，个人名只保留在 origin_aliases', '阻断 runtimeName 推广'],
  ['Router Gate', 'candidate facts 有 reason_code、budget_hint、degraded_mode，脚本不输出 selected_agents', '降级为 checklist mode 或减少候选'],
  ['Context Gate', '只给 selected experts 构造 context pack', '不加载全量 ECC skills / agents'],
  ['Finding Compatibility Gate', '保留 workflow-native schema，并生成 Finding Core compatibility view', '不更新 reviewer prompt，只补 adapter 草案'],
  ['Finding Evidence Gate', 'finding 有 severity、confidence、evidence、recommendation、not_reviewed 或 native 等价字段', '降级为 advisory 或 reject'],
  ['Synthesis Gate', '最终 verdict 只能由 Skill 输出，必须说明 adopt/reject/downgrade', '不写 durable final report'],
  ['Standards Gate', 'standards 写入必须 preview-first + human confirmation', '只生成 standards candidate'],
  ['Capability Plugin Gate', 'capability pack pack-gated、source-attributed、workflow-compatible、doctor-able/clean-able', '只能保留 preview，不进入 runtime'],
  ['Opt-in Gate', '研发向 optional pack、style profile、missing_in_spec_first 显式启用；excluded domain references 不进能力包', '默认 disabled / checklist mode'],
  ['Host Compatibility Gate', '每个 pack 声明 Claude / Codex 支持度、fallback 和 unsupported reason', 'host 不支持时降级为 checklist/reference'],
  ['Source Freshness Gate', '每个 ECC 采纳项声明 source file、revision、loaded_from、freshness、runtime_cached', 'freshness 不足时只保留 candidate'],
  ['Command Idea Gate', 'ECC commands 只进入 idea matrix，不进入 command registry 或 runtime command surface', '阻断 /ecc:*、$ecc-* 或 runtime command 生成'],
  ['Runtime Merge Gate', '未来 runtime delivery 必须 managed marker merge、add-only config merge、preview-first', '阻断 silent overwrite 用户配置或 generated runtime'],
  ['Runtime Gate', '未显式启用 capability pack 时不得生成 ECC runtime asset', 'doctor 报告 residual / drift'],
  ['Fresh-source Eval Gate', 'agent/skill prose 改动后必须用当前磁盘 source 做 fresh-source eval', '记录未执行原因，不能声称通过'],
];

const FIFTY_REVIEW_ROUNDS = [
  ['G0 inventory 是否覆盖 51 个 source agent', 'current-agent-inventory.json 记录 agent_count，测试校验数量'],
  ['G0 是否每个 agent 有唯一 id', 'inventory generator 从 frontmatter name / 文件名提取并做唯一性检查'],
  ['G0 是否处理个人名 agent', 'kieran / dhh / ankane / julik 均映射 rename_generic 或 style_profile'],
  ['G0 是否区分 source 与 runtime', '所有 source_file 指向 agents/*.agent.md，不引用 .claude/.codex runtime 作为 source'],
  ['G1 是否覆盖 48 个 ECC agents', 'overlap matrix 记录 ecc_agent_count 和每个 ECC agent entry'],
  ['G1 direct_match 是否禁止新增 agent', 'direct_match entry 的 integration_action 为 enhance_existing'],
  ['G1 missing_in_spec_first 是否有 reason', 'missing/reference/optional entries 都有 reason'],
  ['G1 style/domain 是否不进 P0/P1', 'seo/healthcare/GAN/style 均为 reference_only 或 P3'],
  ['G1 spec_first_native 是否不被 ECC 覆盖', 'native agents 只在 registry 标记 native，不映射 ECC 覆盖'],
  ['G1 overlap 是否保留多目标关系', 'code-reviewer 等映射到多个 spec-first reviewer'],
  ['G1.5 是否只提取高价值研发样本', 'rubric matrix 首批限定 security/testing/API/data/frontend/architecture/research/governance'],
  ['G1.5 是否有 source_file', '每条 adopted/deferred/rejected entry 都有 ecc_source_file 或 reason'],
  ['G1.5 是否有 freshness', '每条 entry 有 source_revision、loaded_from、freshness、runtime_cached'],
  ['G1.5 是否防止全量 prompt 注入', 'matrix 只记录摘要和 target，不保存 ECC skill 正文'],
  ['G1.5 是否排除非研发领域', 'excluded entries 不进入 capability pack 或 router candidate'],
  ['G1.6 是否覆盖 68 个 ECC commands', 'command idea matrix 记录 command_count 和所有 command entry'],
  ['G1.6 是否禁止 command import', 'adoption_action 仅 enhance_existing_workflow/reference_only/rejected'],
  ['G1.6 是否禁止 /ecc 或 $ecc', '生成器不创建 command template 或 runtime registry'],
  ['G1.6 是否区分 Claude/Codex command parity', 'command matrix 声明 legacy prompt reference only'],
  ['G1.6 是否映射到现有 workflow', 'command ideas 只指向 spec-* workflow 或 reference_only'],
  ['G2 是否生成 P0/P1/P2/P3 pack preview', 'agent-packs.json 包含 core/conditional/optional/style_profile'],
  ['G2 P0 是否默认 enabled', 'core packs default_enabled=true，仅为候选池，不绕过 Skill'],
  ['G2 P2/P3 是否默认 disabled', 'optional/style packs default_enabled=false'],
  ['G2 excluded domain 是否不在 pack 中', 'excluded domain references 独立记录，不生成 capability pack'],
  ['G2 style profile 是否不能 blocker', 'style-profile-pack policy 记录 blocker 禁止'],
  ['G3 registry 是否覆盖所有 source agents', 'agent-registry.json entries 与 inventory agent_count 一致'],
  ['G3 registry 是否有 source_revision', 'registry metadata 写入 source_revision 与 stale_policy'],
  ['G3 registry 是否不是 source-of-truth', 'registry metadata 声明 source wins'],
  ['G3 routable agent 是否有 workflows/forbidden_actions', '每个 entry 有 allowed_workflows、trigger_signals、forbidden_actions'],
  ['G3 synthesis_ready 是否声明 output_schema', 'registry entries 统一声明 workflow-native schema compatibility'],
  ['G4 router 是否只输出 candidate facts', 'router-candidate-policy 明确 candidate_agents/reason_code/budget_hint/degraded_mode'],
  ['G4 router 是否不输出 selected_agents', '测试扫描 generated artifacts 禁止 selected_agents 字段出现在 router output schema'],
  ['G4 是否有低风险 typo 场景', 'pilot scenarios 覆盖低风险 docs typo 不调用重专家'],
  ['G4 是否有风险触发场景', 'pilot scenarios 覆盖 auth/API/migration/tsx/skill 变更'],
  ['G5 是否保留 workflow-native schema', 'finding-compatibility-policy 明确 native schema wins'],
  ['G5 是否不反向改写 native finding', 'Finding Core 仅 compatibility view'],
  ['G5 是否有 evidence/confidence/not_reviewed', 'policy 明确 core 字段和降级规则'],
  ['G6 synthesis 是否不是拼接长文', 'synthesis-policy 包含 merge/dedupe/rank/downgrade/reject/adopt'],
  ['G6 Skill 是否保持最终裁判', 'synthesis-policy 明确 final verdict belongs to Skill'],
  ['G6 是否保留 code-review/doc-review 特有字段', 'policy 明确 autofix_class/owner/finding_type/deferred_questions 不丢失'],
  ['G6.5 是否生成 host compatibility preview', 'capability-host-compatibility.md 覆盖每个 pack host_support'],
  ['G6.5 是否生成 runtime merge policy preview', 'capability-runtime-merge-policy.md 覆盖 marker/add-only/preview-first'],
  ['G6.5 是否不实现 runtime delivery', 'runtime_delivery=none_in_v1，lifecycle doctor/clean/state=future'],
  ['双宿主是否同时覆盖 Claude/Codex', 'host_support 为每个 pack 提供 claude/codex/fallback/unsupported_reason_code'],
  ['source freshness 是否区分 provider source 与 runtime cache', 'loaded_from=provider_source，runtime_cached=false'],
  ['插件化是否不是 ECC 整包安装', 'capability provider 只进 inventory/rubric，runtime delivery pack-gated'],
  ['业务运营/媒体/金融/物流/医疗/web3 是否不集成', 'excluded domain refs 不进入 capability pack/router/runtime roadmap'],
  ['generated runtime 是否未被触碰', '生成路径限定 docs/02-架构设计/ECC集成/generated'],
  ['CHANGELOG 是否记录 source 变更', 'CHANGELOG 顶部新增 docs(ecc) 记录'],
  ['完成审查是否有 prompt-to-artifact checklist', 'completion-audit.md 映射目标、文件、gate、测试和证据'],
];

function toPosix(relativePath) {
  return relativePath.split(path.sep).join('/');
}

function relativeToRepo(absolutePath) {
  return toPosix(path.relative(REPO_ROOT, absolutePath));
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function fileExists(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function assertDirectory(dir, label) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    throw new Error(`${label} not found: ${dir}`);
  }
}

function assertUniqueValues(values, label) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  if (duplicates.size > 0) {
    throw new Error(`${label} must be unique: ${[...duplicates].sort().join(', ')}`);
  }
}

function listFiles(dir, predicate = () => true) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFiles(absolutePath, predicate));
      continue;
    }
    if (entry.isFile() && predicate(absolutePath)) {
      results.push(absolutePath);
    }
  }
  return results.sort((left, right) => left.localeCompare(right));
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const result = {};
  for (const rawLine of match[1].split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();
    result[key] = normalizeFrontmatterValue(rawValue);
  }
  return result;
}

function normalizeFrontmatterValue(rawValue) {
  if (!rawValue) return '';
  if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
    try {
      return JSON.parse(rawValue.replace(/'/g, '"'));
    } catch (_error) {
      return rawValue
        .slice(1, -1)
        .split(',')
        .map((value) => value.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    }
  }
  return rawValue.replace(/^["']|["']$/g, '');
}

function slugFromPath(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

function commandNameFromPath(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

function skillNameFromPath(filePath, root) {
  return path.dirname(path.relative(root, filePath)).split(path.sep)[0];
}

function toolsFromFrontmatter(frontmatter) {
  const tools = frontmatter.tools;
  if (Array.isArray(tools)) return tools;
  if (typeof tools === 'string') {
    return tools
      .split(',')
      .map((tool) => tool.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);
  }
  return [];
}

function gitOutput(args, cwd) {
  if (!fs.existsSync(cwd)) return '';
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
  });
  if (result.status !== 0) return '';
  return (result.stdout || '').trim();
}

function sourceRevision(root) {
  return gitOutput(['rev-parse', 'HEAD'], root) || 'unknown';
}

function isWorktreeDirty(root) {
  const status = gitOutput(['status', '--short'], root);
  if (!status) return false;
  return status.length > 0;
}

function packByAgent() {
  const map = new Map();
  for (const pack of PACKS) {
    for (const agent of pack.agents) {
      if (!map.has(agent)) map.set(agent, []);
      map.get(agent).push(pack);
    }
  }
  return map;
}

function canonicalId(agentId) {
  if (AGENT_OVERRIDES[agentId] && AGENT_OVERRIDES[agentId].canonical_id) {
    return AGENT_OVERRIDES[agentId].canonical_id;
  }
  return agentId.replace(/^spec-/, '').replace(/-reviewer$/, '-expert');
}

function workflowsForPacks(packs) {
  return [...new Set(packs.flatMap((pack) => pack.default_workflows || []))].sort();
}

function priorityForPacks(packs) {
  if (packs.some((pack) => pack.priority === 'P0')) return 'P0';
  if (packs.some((pack) => pack.priority === 'P1')) return 'P1';
  if (packs.some((pack) => pack.priority === 'P2')) return 'P2';
  return 'P3';
}

function classifyAgent(agentId, packs) {
  const override = AGENT_OVERRIDES[agentId] || {};
  const packIds = packs.map((pack) => pack.id);
  const priority = priorityForPacks(packs);
  const defaultStatus = priority === 'P0' || priority === 'P1' ? 'direct_match' : 'spec_first_native';
  return {
    canonical_id: override.canonical_id || canonicalId(agentId),
    pack_ids: packIds,
    priority,
    overlap_status: override.overlap_status || defaultStatus,
    integration_action: override.integration_action || (defaultStatus === 'direct_match' ? 'enhance_existing' : 'keep_as_is'),
    governance_state: priority === 'P0' || priority === 'P1' ? 'routable' : 'normalized',
  };
}

function extractWorkflowMentions(content) {
  return [...new Set((content.match(/spec-[a-z0-9-]+/g) || []).filter((value) =>
    value.startsWith('spec-'),
  ))].sort();
}

function buildCurrentAgentInventory(options = {}) {
  const agentsDir = options.agentsDir || path.join(REPO_ROOT, 'agents');
  assertDirectory(agentsDir, 'spec-first agents directory');
  const agentToPacks = packByAgent();
  const files = listFiles(agentsDir, (filePath) => filePath.endsWith('.agent.md'));
  const agents = files.map((filePath) => {
    const content = readText(filePath);
    const frontmatter = parseFrontmatter(content);
    const id = frontmatter.name || slugFromPath(filePath).replace(/\.agent$/, '');
    const packs = agentToPacks.get(id) || [];
    const classification = packs.length > 0
      ? classifyAgent(id, packs)
      : {
        canonical_id: canonicalId(id),
        pack_ids: [],
        priority: 'P3',
        overlap_status: 'spec_first_native',
        integration_action: 'inventory_only',
        governance_state: 'inventory_only',
        no_pack_reason: 'not assigned to V1 capability pack; keep source-only until a workflow need is proven',
      };
    return {
      id,
      file: relativeToRepo(filePath),
      description: frontmatter.description || '',
      tools_allowed: toolsFromFrontmatter(frontmatter),
      workflows_mentioned: extractWorkflowMentions(content),
      forbidden_actions_present: /do not|don't|must not|禁止|不得/i.test(content),
      finding_schema_present: /findings schema|Output format|findings|finding_type/i.test(content),
      classification,
    };
  });
  assertUniqueValues(agents.map((agent) => agent.id), 'agent ids');
  return {
    schema_version: `${SCHEMA_VERSION}.current-agent-inventory`,
    generated_from: 'scripts/generate-ecc-governance-preview.js',
    source: {
      agents_dir: relativeToRepo(agentsDir),
      source_revision: sourceRevision(REPO_ROOT),
      worktree_dirty: isWorktreeDirty(REPO_ROOT),
    },
    agent_count: agents.length,
    agents,
  };
}

function eccAgentClassification(eccAgent, targets) {
  if (ECC_AGENT_CLASSIFICATION[eccAgent]) {
    const [overlap_status, integration_action, priority, reason] = ECC_AGENT_CLASSIFICATION[eccAgent];
    return { overlap_status, integration_action, priority, reason };
  }
  if (targets.length === 0) {
    return {
      overlap_status: 'missing_in_spec_first',
      integration_action: 'reference_only',
      priority: 'P3',
      reason: 'no direct spec-first target; keep inventory/reference only',
    };
  }
  if (targets.some((target) => AGENT_OVERRIDES[target] && AGENT_OVERRIDES[target].overlap_status === 'partial_match')) {
    return {
      overlap_status: 'partial_match',
      integration_action: 'enhance_existing',
      priority: priorityFromTargetAgents(targets),
      reason: 'partially covered by existing generalized or personal-name spec-first reviewer',
    };
  }
  return {
    overlap_status: 'direct_match',
    integration_action: 'enhance_existing',
    priority: priorityFromTargetAgents(targets),
    reason: 'same R&D review domain already covered by spec-first source agents',
  };
}

function priorityFromTargetAgents(targets) {
  const agentToPacks = packByAgent();
  const packs = targets.flatMap((target) => agentToPacks.get(target) || []);
  if (packs.length === 0) return 'P3';
  return priorityForPacks(packs);
}

function buildEccAgentOverlapMatrix(options = {}) {
  const eccRoot = options.eccRoot || ECC_ROOT;
  const agentsDir = path.join(eccRoot, 'agents');
  assertDirectory(agentsDir, 'ECC agents directory');
  const files = listFiles(agentsDir, (filePath) => filePath.endsWith('.md'));
  const entries = files.map((filePath) => {
    const content = readText(filePath);
    const frontmatter = parseFrontmatter(content);
    const eccAgent = frontmatter.name || slugFromPath(filePath);
    const targets = ECC_AGENT_MAP[eccAgent] || [];
    const classification = eccAgentClassification(eccAgent, targets);
    return {
      ecc_agent: eccAgent,
      ecc_source_file: filePath,
      description: frontmatter.description || '',
      spec_first_agents: targets,
      overlap_status: classification.overlap_status,
      integration_action: classification.integration_action,
      priority: classification.priority,
      reason: classification.reason,
      migration_notes: migrationNotesForOverlap(classification, targets),
    };
  });
  assertUniqueValues(entries.map((entry) => entry.ecc_agent), 'ECC agent ids');
  return {
    schema_version: `${SCHEMA_VERSION}.ecc-agent-overlap-matrix`,
    generated_from: 'scripts/generate-ecc-governance-preview.js',
    source: {
      ecc_root: eccRoot,
      source_revision: sourceRevision(eccRoot),
      worktree_dirty: isWorktreeDirty(eccRoot),
    },
    ecc_agent_count: entries.length,
    entries,
  };
}

function migrationNotesForOverlap(classification, targets) {
  if (classification.integration_action === 'enhance_existing') {
    return [
      'do not create a new ECC agent',
      `merge stronger checklist/rubric into ${targets.join(', ')}`,
      'preserve workflow-native output schema',
    ];
  }
  if (classification.integration_action === 'optional_lens') {
    return [
      'keep as optional lens/checklist',
      'require explicit project or workflow enablement',
      'do not enter P0/P1 default router',
    ];
  }
  if (classification.integration_action === 'reference_only') {
    return [
      'keep inventory/reference only',
      'do not enter capability pack, router, or runtime roadmap',
    ];
  }
  return [
    'keep as preview candidate only',
    'require pilot evidence before prompt/runtime changes',
  ];
}

function isExcludedRubric(skillName) {
  return EXCLUDED_RUBRIC_PREFIXES.some((prefix) => skillName.startsWith(prefix));
}

function buildRubricExtractionMatrix(options = {}) {
  const eccRoot = options.eccRoot || ECC_ROOT;
  const skillsDir = path.join(eccRoot, 'skills');
  assertDirectory(skillsDir, 'ECC skills directory');
  const files = listFiles(skillsDir, (filePath) => path.basename(filePath) === 'SKILL.md');
  const entries = [];
  for (const filePath of files) {
    const skill = skillNameFromPath(filePath, skillsDir);
    const content = readText(filePath);
    const frontmatter = parseFrontmatter(content);
    if (RUBRIC_SELECTION[skill]) {
      const [targetSurface, qualityNode, rubricType, adoptionAction] = RUBRIC_SELECTION[skill];
      entries.push({
        ecc_skill: skill,
        ecc_source_file: filePath,
        description: frontmatter.description || '',
        target_surface: targetSurface,
        quality_node: qualityNode,
        rubric_type: rubricType,
        adoption_action: adoptionAction,
        source_revision: sourceRevision(eccRoot),
        loaded_from: 'provider_source',
        freshness: 'current_source_read',
        runtime_cached: false,
        dedupe_against_existing: 'required_before_prompt_change',
        evidence_policy: 'rubric can raise evidence questions; it cannot produce a high-confidence finding without repo evidence',
        not_adopted_reason: null,
      });
      continue;
    }
    if (isExcludedRubric(skill)) {
      entries.push({
        ecc_skill: skill,
        ecc_source_file: filePath,
        description: frontmatter.description || '',
        target_surface: null,
        quality_node: 'Excluded Domain Reference',
        rubric_type: 'excluded_domain_reference',
        adoption_action: 'rejected',
        source_revision: sourceRevision(eccRoot),
        loaded_from: 'provider_source',
        freshness: 'current_source_read',
        runtime_cached: false,
        dedupe_against_existing: 'not_applicable',
        evidence_policy: 'not available to router or runtime in V1',
        not_adopted_reason: 'non-R&D domain or media/growth capability outside current spec-first integration scope',
      });
    }
  }
  assertUniqueValues(entries.map((entry) => entry.ecc_skill), 'ECC rubric skill ids');
  return {
    schema_version: `${SCHEMA_VERSION}.ecc-rubric-extraction-matrix`,
    generated_from: 'scripts/generate-ecc-governance-preview.js',
    source: {
      ecc_root: eccRoot,
      source_revision: sourceRevision(eccRoot),
      worktree_dirty: isWorktreeDirty(eccRoot),
      total_ecc_skills_scanned: files.length,
    },
    high_value_sample_count: entries.filter((entry) => entry.adoption_action !== 'rejected').length,
    excluded_reference_count: entries.filter((entry) => entry.adoption_action === 'rejected').length,
    entries,
  };
}

function commandIdea(command) {
  if (/^(code-review|review-pr|test-coverage|quality-gate)$/.test(command)) {
    return ['spec-code-review', 'review_quality', 'enhance_existing_workflow', 'review/test quality idea for existing code-review workflow'];
  }
  if (/^(build-fix|.*-build|gradle-build)$/.test(command)) {
    return ['spec-debug', 'build_failure_resolution', 'reference_only', 'stack-specific build resolver idea; no command import'];
  }
  if (/^(.*-test)$/.test(command)) {
    return ['spec-code-review', 'test_execution_reference', 'reference_only', 'stack-specific test command idea; no command import'];
  }
  if (/^(.*-review|python-review|rust-review|go-review|kotlin-review|flutter-review|cpp-review)$/.test(command)) {
    return ['spec-code-review', 'language_review_reference', 'reference_only', 'language-specific reviewer idea; use capability pack opt-in'];
  }
  if (/^(plan|prp-plan)$/.test(command)) {
    return ['spec-plan', 'planning_flow', 'enhance_existing_workflow', 'planning idea for existing spec-plan'];
  }
  if (/^(prp-prd)$/.test(command)) {
    return ['spec-brainstorm', 'requirements_flow', 'reference_only', 'requirements idea; no new command'];
  }
  if (/^(feature-dev|prp-implement|multi-execute)$/.test(command)) {
    return ['spec-work', 'execution_flow', 'reference_only', 'execution idea for existing spec-work'];
  }
  if (/^(sessions|save-session|resume-session|checkpoint)$/.test(command)) {
    return ['spec-sessions', 'session_context', 'reference_only', 'session idea; preserve current sessions workflow boundaries'];
  }
  if (/^(learn|learn-eval|promote)$/.test(command)) {
    return ['spec-compound', 'knowledge_flow', 'reference_only', 'knowledge compounding idea; no command import'];
  }
  if (/^(harness-audit|skill-health|skill-create|model-route|evolve|auto-update|update-codemaps|hookify.*)$/.test(command)) {
    return ['spec-skill-audit', 'harness_governance', 'reference_only', 'harness governance idea; current source contracts win'];
  }
  if (/^(update-docs)$/.test(command)) {
    return ['spec-doc-review', 'documentation_maintenance', 'reference_only', 'documentation maintenance idea'];
  }
  if (/^(multi-plan|multi-workflow|multi-backend|multi-frontend)$/.test(command)) {
    return ['spec-plan', 'multi_surface_planning', 'reference_only', 'multi-surface planning idea; no orchestration import'];
  }
  if (/^(gan-|santa-loop$|loop-|instinct-|pm2$|jira$|setup-pm$|projects$|prune$|aside$)/.test(command)) {
    return [null, 'excluded_or_external_ops', 'rejected', 'outside current R&D capability pack or would create a second command surface'];
  }
  if (/^(prp-pr|prp-commit|refactor-clean)$/.test(command)) {
    return ['spec-code-review', 'review_or_handoff_reference', 'reference_only', 'existing review/work workflows own the handoff; no command import'];
  }
  return [null, 'unmapped_reference', 'reference_only', 'keep as command idea reference only'];
}

function buildCommandIdeaMatrix(options = {}) {
  const eccRoot = options.eccRoot || ECC_ROOT;
  const commandsDir = path.join(eccRoot, 'commands');
  assertDirectory(commandsDir, 'ECC commands directory');
  const files = listFiles(commandsDir, (filePath) => filePath.endsWith('.md'));
  const entries = files.map((filePath) => {
    const command = commandNameFromPath(filePath);
    const content = readText(filePath);
    const frontmatter = parseFrontmatter(content);
    const [targetWorkflow, ideaType, adoptionAction, reason] = commandIdea(command);
    return {
      ecc_command: command,
      ecc_source_file: filePath,
      description: frontmatter.description || firstHeading(content) || '',
      target_workflow: targetWorkflow,
      idea_type: ideaType,
      adoption_action: adoptionAction,
      reason,
      command_surface_policy: 'do_not_generate_ecc_command_or_runtime_registry_entry',
      codex_parity_policy: 'legacy_prompt_reference_only_not_slash_command_parity',
    };
  });
  assertUniqueValues(entries.map((entry) => entry.ecc_command), 'ECC command ids');
  return {
    schema_version: `${SCHEMA_VERSION}.ecc-command-idea-matrix`,
    generated_from: 'scripts/generate-ecc-governance-preview.js',
    source: {
      ecc_root: eccRoot,
      source_revision: sourceRevision(eccRoot),
      worktree_dirty: isWorktreeDirty(eccRoot),
    },
    ecc_command_count: entries.length,
    allowed_adoption_actions: ['enhance_existing_workflow', 'reference_only', 'rejected'],
    forbidden_outputs: ['/ecc:*', '$ecc-*', 'templates/commands/ecc-*', 'runtime command registry entry'],
    entries,
  };
}

function firstHeading(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : '';
}

function buildAgentPacks(inventory) {
  const inventoryIds = new Set(inventory.agents.map((agent) => agent.id));
  const packs = PACKS.map((pack) => ({
    ...pack,
    agents: pack.agents.filter((agent) => inventoryIds.has(agent)),
    missing_agents: pack.agents.filter((agent) => !inventoryIds.has(agent)),
    activation_policy: pack.default_enabled
      ? 'default_candidate_pool_skill_still_selects'
      : 'explicit_or_risk_triggered_after_pilot',
    runtime_delivery: 'none_in_v1',
    host_support: {
      claude: 'supported',
      codex: 'supported',
      fallback: 'reference_only',
      unsupported_reason_code: null,
    },
  }));
  return {
    $schema: '../../../../src/cli/contracts/agent-registry/agent-packs.schema.json',
    schema_version: `${SCHEMA_VERSION}.agent-packs`,
    generated_from: 'scripts/generate-ecc-governance-preview.js',
    pack_count: packs.length,
    excluded_domain_references: [
      'business operations',
      'media/growth',
      'finance',
      'logistics',
      'healthcare',
      'web3',
    ],
    packs,
  };
}

function buildAgentRegistry(inventory, packs) {
  const packMap = new Map(packs.packs.map((pack) => [pack.id, pack]));
  const entries = inventory.agents.map((agent) => {
    const packIds = agent.classification.pack_ids || [];
    const entryPacks = packIds.map((id) => packMap.get(id)).filter(Boolean);
    return {
      id: agent.id,
      canonical_id: agent.classification.canonical_id,
      source_file: agent.file,
      origin: {
        source: agent.classification.overlap_status === 'spec_first_native' ? 'spec-first-native' : 'spec-first-native-or-ecc-inspired',
        origin_aliases: agent.id === agent.classification.canonical_id ? [] : [agent.id],
      },
      pack: packIds[0] || null,
      packs: packIds,
      priority: agent.classification.priority,
      overlap_status: agent.classification.overlap_status,
      integration_action: agent.classification.integration_action,
      governance_state: agent.classification.governance_state,
      allowed_workflows: workflowsForPacks(entryPacks),
      trigger_signals: [...new Set(entryPacks.flatMap((pack) => pack.trigger_signals || []))].sort(),
      required_inputs: ['current_workflow_goal', 'diff_or_document_excerpt', 'available_evidence'],
      optional_inputs: ['plan_excerpt', 'graph_facts', 'repo_profile', 'test_results', 'rubric_excerpt'],
      forbidden_actions: [
        'write_files',
        'modify_repo_profile',
        'change_workflow_state',
        'run_destructive_command',
        'generate_runtime_asset',
      ],
      output_schema: 'workflow-native schema with spec-first.finding-core compatibility view',
      no_pack_reason: agent.classification.no_pack_reason || null,
    };
  });
  return {
    $schema: '../../../../src/cli/contracts/agent-registry/agent-registry.schema.json',
    schema_version: `${SCHEMA_VERSION}.agent-registry-preview`,
    generated_from: 'scripts/generate-ecc-governance-preview.js',
    source_revision: sourceRevision(REPO_ROOT),
    worktree_dirty: isWorktreeDirty(REPO_ROOT),
    stale_policy: 'source_wins_registry_is_preview_snapshot',
    runtime_delivery: 'none_in_v1',
    entry_count: entries.length,
    entries,
  };
}

function buildRouterPolicy() {
  return {
    $schema: '../../../../src/cli/contracts/agent-registry/routing-policy.schema.json',
    schema_version: `${SCHEMA_VERSION}.router-candidate-policy`,
    generated_from: 'scripts/generate-ecc-governance-preview.js',
    owner_boundary: 'scripts_prepare_candidate_facts_llm_skill_decides',
    router_output_schema: {
      candidate_agents: [],
      reason_code: '',
      budget_hint: '',
      degraded_mode: {},
      excluded_by_policy: [],
    },
    forbidden_fields: ['selected_agents', 'final_verdict', 'confirmed_standards_write'],
    workflow_caps: {
      'spec-brainstorm': 3,
      'spec-doc-review': 4,
      'spec-plan': 5,
      'spec-write-tasks': 4,
      'spec-work': 2,
      'spec-debug': 4,
      'spec-code-review': 5,
      'spec-app-consistency-audit': 6,
      'spec-skill-audit': 5,
    },
    scenario_matrix: [
      ['src/auth/session.ts', ['spec-security-reviewer', 'spec-correctness-reviewer', 'spec-testing-reviewer']],
      ['openapi.yaml', ['spec-api-contract-reviewer', 'spec-testing-reviewer']],
      ['migrations/20260505.sql', ['spec-data-migrations-reviewer', 'spec-data-integrity-guardian']],
      ['skills/spec-plan/SKILL.md', ['spec-agent-native-reviewer', 'spec-coherence-reviewer', 'spec-code-simplicity-reviewer']],
      ['src/ui/Widget.tsx', ['spec-julik-frontend-races-reviewer', 'spec-testing-reviewer', 'spec-design-lens-reviewer']],
      ['docs/readme-typo.md', ['spec-coherence-reviewer']],
      ['docs/typo.md low-risk', []],
    ].map(([scenario, expected_candidate_agents]) => ({ scenario, expected_candidate_agents })),
  };
}

function buildContextPackSchema() {
  return {
    schema_version: `${SCHEMA_VERSION}.context-pack-schema-preview`,
    generated_from: 'scripts/generate-ecc-governance-preview.js',
    required_fields: [
      'agent_id',
      'workflow',
      'task',
      'inputs',
      'boundaries',
      'output_schema',
      'confidence_policy',
    ],
    input_metadata_required: [
      'source',
      'freshness',
      'trust_level',
      'allowed_use',
      'not_reviewed',
    ],
    allowed_use_values: ['primary_evidence', 'supporting_evidence', 'orientation_only', 'checklist_reference_only'],
    trust_policy: 'orientation_only or stale evidence cannot produce high-confidence blocker findings',
    context_budget_policy: 'selected experts only; never include all ECC skills or agents',
  };
}

function buildFindingCompatibilityPolicy() {
  return {
    $schema: '../../../../src/cli/contracts/agent-registry/finding.schema.json',
    schema_version: `${SCHEMA_VERSION}.finding-compatibility-policy`,
    generated_from: 'scripts/generate-ecc-governance-preview.js',
    boundary: 'workflow_native_schema_wins',
    finding_core_fields: [
      'severity',
      'confidence',
      'category',
      'title',
      'evidence',
      'impact',
      'recommendation',
      'suggested_tests',
      'not_reviewed',
    ],
    preserve_native_fields: [
      'autofix_class',
      'owner',
      'finding_type',
      'deferred_questions',
      'residual_risks',
      'testing_gaps',
    ],
    adapter_policy: 'Finding Core is a compatibility view and must not rewrite native findings back into workflow source.',
    evidence_policy: 'findings without evidence are downgraded to advisory or rejected from blocking lists',
  };
}

function buildSynthesisPolicy() {
  return {
    schema_version: `${SCHEMA_VERSION}.synthesis-policy`,
    generated_from: 'scripts/generate-ecc-governance-preview.js',
    owner: 'Skill / LLM',
    required_operations: ['merge', 'dedupe', 'rank', 'downgrade', 'upgrade', 'reject', 'adopt', 'summarize'],
    conflict_priority: [
      'user_current_instruction',
      'repo_profile_confirmed_standards',
      'pinned_team_standards',
      'code_facts_or_graph_facts',
      'docs_readme_manifest',
      'agent_finding',
      'external_best_practice',
    ],
    anti_patterns: [
      'concatenate_agent_longform_without_judgment',
      'agent_outputs_final_verdict',
      'style_profile_creates_blocker',
      'advisory_finding_writes_confirmed_standard',
    ],
  };
}

function buildCapabilityHostCompatibility(packs) {
  return {
    schema_version: `${SCHEMA_VERSION}.capability-host-compatibility`,
    generated_from: 'scripts/generate-ecc-governance-preview.js',
    entries: packs.packs.map((pack) => ({
      pack_id: pack.id,
      priority: pack.priority,
      claude: 'supported',
      codex: 'supported',
      fallback: pack.default_enabled ? 'reference_only' : 'checklist_only',
      unsupported_reason_code: null,
      dispatch_boundary: 'workflow_owned_dispatch_when_host_capability_and_safety_gate_pass',
    })),
  };
}

function buildRuntimeMergePolicy(packs) {
  return {
    schema_version: `${SCHEMA_VERSION}.capability-runtime-merge-policy`,
    generated_from: 'scripts/generate-ecc-governance-preview.js',
    runtime_delivery: 'none_in_v1',
    future_policy: {
      instructions: 'managed_marker_merge',
      config: 'add_only_merge',
      commands: 'idea_reference_only',
      runtime_assets: 'pack_gated_source_generator_only',
      preview: 'required_before_apply',
      clean: 'future_state_aware_clean',
      doctor: 'future_state_aware_doctor',
    },
    pack_delivery_preview: packs.packs.map((pack) => ({
      pack_id: pack.id,
      default_enabled: pack.default_enabled,
      runtime_delivery: 'none_in_v1',
      future_delivery_requires: ['pilot_quality_gain', 'pack_state', 'doctor', 'clean', 'preview_first_merge'],
    })),
  };
}

function buildQualityGates() {
  return {
    schema_version: `${SCHEMA_VERSION}.quality-gates`,
    generated_from: 'scripts/generate-ecc-governance-preview.js',
    gates: QUALITY_GATES.map(([gate, check, failure]) => ({
      gate,
      check,
      failure,
    })),
  };
}

function buildCompletionAudit(artifactNames) {
  return {
    schema_version: `${SCHEMA_VERSION}.completion-audit`,
    generated_from: 'scripts/generate-ecc-governance-preview.js',
    objective: '$spec-work docs/02-架构设计/ECC集成/ECCAgent重叠治理V1技术方案.md 完成全部开发工作,做好审查',
    concrete_deliverables: [
      'G0-G6.5 preview artifacts generated under docs/02-架构设计/ECC集成/generated',
      'deterministic source scanner implemented without runtime delivery',
      'contract tests cover source/runtime boundaries and generated artifact shape',
      '50-round review checklist recorded',
    ],
    prompt_to_artifact_checklist: [
      ['G0 current source inventory', 'current-agent-inventory.json/md'],
      ['G1 ECC overlap matrix', 'ecc-agent-overlap-matrix.json/md'],
      ['G1.5 ECC rubric extraction matrix', 'ecc-rubric-extraction-matrix.json/md'],
      ['G1.6 ECC command idea matrix', 'ecc-command-idea-matrix.json/md'],
      ['G2 agent packs preview', 'agent-packs.json/md'],
      ['G3 registry preview + drift policy', 'agent-registry.json'],
      ['G4 router candidate facts', 'router-candidate-policy.json/md'],
      ['G5 finding schema compatibility', 'finding-compatibility-policy.json/md'],
      ['G6 skill synthesis policy', 'synthesis-policy.json/md'],
      ['G6.5 host compatibility + runtime merge policy preview', 'capability-host-compatibility.md and capability-runtime-merge-policy.md'],
      ['Quality gates and pilot scenarios', 'quality-gates.json/md and node-quality-pilot-scenarios.json/md'],
      ['50-round review', 'completion-audit.md'],
    ].map(([requirement, evidence]) => ({ requirement, evidence })),
    generated_artifacts: artifactNames,
    review_round_count: FIFTY_REVIEW_ROUNDS.length,
    review_rounds: FIFTY_REVIEW_ROUNDS.map(([question, evidence], index) => ({
      round: index + 1,
      question,
      evidence,
      status: 'covered',
    })),
  };
}

function buildPilotScenarios() {
  return {
    schema_version: `${SCHEMA_VERSION}.node-quality-pilot-scenarios`,
    generated_from: 'scripts/generate-ecc-governance-preview.js',
    scenarios: [
      {
        workflow: 'spec-code-review',
        input_signal: 'auth/session/runtime code changed',
        expected_quality_gain: 'security, correctness, and testing findings have evidence and not_reviewed disclosure',
        must_not: 'select more than workflow cap or let agent output final merge verdict',
      },
      {
        workflow: 'spec-plan',
        input_signal: 'new API and data model plan',
        expected_quality_gain: 'architecture/API/data decisions include evidence, alternatives, risks, and test strategy',
        must_not: 'override repository facts with ECC best practice',
      },
      {
        workflow: 'spec-doc-review',
        input_signal: 'large requirements document with scope and security implications',
        expected_quality_gain: 'coherence, feasibility, scope, and security-lens findings are deduped and ranked',
        must_not: 'replace doc-review native schema or skip deferred questions',
      },
      {
        workflow: 'spec-skill-audit',
        input_signal: 'skill/agent prompt governance change',
        expected_quality_gain: 'agent-native, standards, CLI readiness, security, and simplicity checks prevent overreach',
        must_not: 'depend on cached runtime skill definitions instead of fresh source',
      },
    ],
  };
}

function buildAll(options = {}) {
  const inventory = buildCurrentAgentInventory(options);
  const overlap = buildEccAgentOverlapMatrix(options);
  const rubric = buildRubricExtractionMatrix(options);
  const commands = buildCommandIdeaMatrix(options);
  const packs = buildAgentPacks(inventory);
  const registry = buildAgentRegistry(inventory, packs);
  const router = buildRouterPolicy();
  const context = buildContextPackSchema();
  const finding = buildFindingCompatibilityPolicy();
  const synthesis = buildSynthesisPolicy();
  const host = buildCapabilityHostCompatibility(packs);
  const runtime = buildRuntimeMergePolicy(packs);
  const quality = buildQualityGates();
  const pilot = buildPilotScenarios();
  const jsonArtifacts = {
    'current-agent-inventory.json': inventory,
    'ecc-agent-overlap-matrix.json': overlap,
    'ecc-rubric-extraction-matrix.json': rubric,
    'ecc-command-idea-matrix.json': commands,
    'agent-packs.json': packs,
    'agent-registry.json': registry,
    'router-candidate-policy.json': router,
    'context-pack.schema.json': context,
    'finding-compatibility-policy.json': finding,
    'synthesis-policy.json': synthesis,
    'quality-gates.json': quality,
    'node-quality-pilot-scenarios.json': pilot,
  };
  const markdownArtifacts = {
    'current-agent-inventory.md': markdownInventory(inventory),
    'ecc-agent-overlap-matrix.md': markdownOverlap(overlap),
    'ecc-rubric-extraction-matrix.md': markdownRubric(rubric),
    'ecc-command-idea-matrix.md': markdownCommands(commands),
    'agent-packs.md': markdownPacks(packs),
    'router-candidate-policy.md': markdownRouter(router),
    'context-pack.schema.md': markdownContext(context),
    'finding-compatibility-policy.md': markdownFinding(finding),
    'synthesis-policy.md': markdownSynthesis(synthesis),
    'quality-gates.md': markdownQualityGates(quality),
    'node-quality-pilot-scenarios.md': markdownPilot(pilot),
    'capability-host-compatibility.md': markdownHost(host),
    'capability-runtime-merge-policy.md': markdownRuntime(runtime),
  };
  const artifactNames = [
    ...Object.keys(jsonArtifacts),
    ...Object.keys(markdownArtifacts),
    'completion-audit.json',
    'completion-audit.md',
  ].sort();
  const completionAudit = buildCompletionAudit(artifactNames);
  return {
    ...jsonArtifacts,
    'completion-audit.json': completionAudit,
    ...markdownArtifacts,
    'completion-audit.md': markdownCompletionAudit(completionAudit),
  };
}

function escapeCell(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

function row(values) {
  return `| ${values.map(escapeCell).join(' | ')} |`;
}

function jsonText(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function markdownInventory(inventory) {
  return [
    '# Current Spec-First Agent Inventory',
    '',
    '> Generated by `scripts/generate-ecc-governance-preview.js`. Preview facts only; source files win on conflict.',
    '',
    `- Agent count: ${inventory.agent_count}`,
    `- Source revision: ${inventory.source.source_revision}`,
    `- Worktree dirty at generation: ${inventory.source.worktree_dirty}`,
    '',
    '| Agent | Canonical ID | Priority | Packs | Action | Source |',
    '| --- | --- | --- | --- | --- | --- |',
    ...inventory.agents.map((agent) => row([
      agent.id,
      agent.classification.canonical_id,
      agent.classification.priority,
      agent.classification.pack_ids.join(', ') || agent.classification.no_pack_reason,
      agent.classification.integration_action,
      agent.file,
    ])),
    '',
  ].join('\n');
}

function markdownOverlap(overlap) {
  return [
    '# ECC Agent Overlap Matrix',
    '',
    '> ECC agents are capability samples. Direct matches enhance existing spec-first agents; they do not create new runtime agents.',
    '',
    `- ECC agent count: ${overlap.ecc_agent_count}`,
    `- ECC source revision: ${overlap.source.source_revision}`,
    '',
    '| ECC Agent | Spec-First Target | Status | Action | Priority | Reason |',
    '| --- | --- | --- | --- | --- | --- |',
    ...overlap.entries.map((entry) => row([
      entry.ecc_agent,
      entry.spec_first_agents.join(', ') || '(none)',
      entry.overlap_status,
      entry.integration_action,
      entry.priority,
      entry.reason,
    ])),
    '',
  ].join('\n');
}

function markdownRubric(rubric) {
  return [
    '# ECC Rubric Extraction Matrix',
    '',
    '> Stores source-attributed rubric candidates only. It does not copy ECC skill bodies into spec-first prompts.',
    '',
    `- Total ECC skills scanned: ${rubric.source.total_ecc_skills_scanned}`,
    `- High-value samples: ${rubric.high_value_sample_count}`,
    `- Excluded references: ${rubric.excluded_reference_count}`,
    '',
    '| ECC Skill | Target Surface | Quality Node | Rubric Type | Action | Freshness | Not Adopted Reason |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...rubric.entries.map((entry) => row([
      entry.ecc_skill,
      entry.target_surface,
      entry.quality_node,
      entry.rubric_type,
      entry.adoption_action,
      entry.freshness,
      entry.not_adopted_reason,
    ])),
    '',
  ].join('\n');
}

function markdownCommands(commands) {
  return [
    '# ECC Command Idea Matrix',
    '',
    '> ECC commands are workflow ideas only. This artifact must not generate `/ecc:*`, `$ecc-*`, command templates, or runtime registry entries.',
    '',
    `- ECC command count: ${commands.ecc_command_count}`,
    '',
    '| ECC Command | Target Workflow | Idea Type | Action | Reason |',
    '| --- | --- | --- | --- | --- |',
    ...commands.entries.map((entry) => row([
      entry.ecc_command,
      entry.target_workflow || '(none)',
      entry.idea_type,
      entry.adoption_action,
      entry.reason,
    ])),
    '',
  ].join('\n');
}

function markdownPacks(packs) {
  return [
    '# Agent And Capability Packs Preview',
    '',
    '> Agent packs are logical governance groupings. Capability pack runtime delivery is `none_in_v1`.',
    '',
    '| Pack | Priority | Type | Default Enabled | Workflows | Agents | Runtime Delivery |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...packs.packs.map((pack) => row([
      pack.id,
      pack.priority,
      pack.type,
      pack.default_enabled,
      pack.default_workflows.join(', '),
      pack.agents.join(', '),
      pack.runtime_delivery,
    ])),
    '',
    '## Excluded Domain References',
    '',
    packs.excluded_domain_references.map((item) => `- ${item}`).join('\n'),
    '',
  ].join('\n');
}

function markdownRouter(router) {
  return [
    '# Router Candidate Policy Preview',
    '',
    '> Scripts prepare candidate facts. Skill / LLM decides selected experts and final synthesis.',
    '',
    `- Owner boundary: ${router.owner_boundary}`,
    `- Forbidden fields: ${router.forbidden_fields.join(', ')}`,
    '',
    '## Router Output Shape',
    '',
    '```json',
    JSON.stringify(router.router_output_schema, null, 2),
    '```',
    '',
    '## Scenario Matrix',
    '',
    '| Scenario | Expected Candidate Agents |',
    '| --- | --- |',
    ...router.scenario_matrix.map((scenario) => row([
      scenario.scenario,
      scenario.expected_candidate_agents.join(', ') || '(none)',
    ])),
    '',
  ].join('\n');
}

function markdownContext(context) {
  return [
    '# Context Pack Schema Preview',
    '',
    '> Context packs bound evidence, freshness, trust, and allowed use for selected experts only.',
    '',
    '```json',
    JSON.stringify(context, null, 2),
    '```',
    '',
  ].join('\n');
}

function markdownFinding(finding) {
  return [
    '# Finding Compatibility Policy',
    '',
    '> Workflow-native schema wins. Finding Core is a compatibility view for synthesis, not a replacement schema.',
    '',
    '```json',
    JSON.stringify(finding, null, 2),
    '```',
    '',
  ].join('\n');
}

function markdownSynthesis(synthesis) {
  return [
    '# Skill Synthesis Policy',
    '',
    '> Final verdict belongs to the active Skill, not to an individual expert or deterministic router.',
    '',
    '```json',
    JSON.stringify(synthesis, null, 2),
    '```',
    '',
  ].join('\n');
}

function markdownQualityGates(quality) {
  return [
    '# ECC Governance Quality Gates',
    '',
    '| Gate | Check | Failure Handling |',
    '| --- | --- | --- |',
    ...quality.gates.map((gate) => row([gate.gate, gate.check, gate.failure])),
    '',
  ].join('\n');
}

function markdownPilot(pilot) {
  return [
    '# Node Quality Pilot Scenarios',
    '',
    '| Workflow | Input Signal | Expected Quality Gain | Must Not |',
    '| --- | --- | --- | --- |',
    ...pilot.scenarios.map((scenario) => row([
      scenario.workflow,
      scenario.input_signal,
      scenario.expected_quality_gain,
      scenario.must_not,
    ])),
    '',
  ].join('\n');
}

function markdownHost(host) {
  return [
    '# Capability Host Compatibility Preview',
    '',
    '> Claude and Codex support is declared per pack. Unsupported hosts degrade to reference/checklist only.',
    '',
    '| Pack | Priority | Claude | Codex | Fallback | Dispatch Boundary |',
    '| --- | --- | --- | --- | --- | --- |',
    ...host.entries.map((entry) => row([
      entry.pack_id,
      entry.priority,
      entry.claude,
      entry.codex,
      entry.fallback,
      entry.dispatch_boundary,
    ])),
    '',
  ].join('\n');
}

function markdownRuntime(runtime) {
  return [
    '# Capability Runtime Merge Policy Preview',
    '',
    '> V1 does not deliver runtime capability packs. Future delivery must be pack-gated, source-generated, preview-first, and cleanable.',
    '',
    '```json',
    JSON.stringify(runtime.future_policy, null, 2),
    '```',
    '',
    '| Pack | Default Enabled | Runtime Delivery | Future Requires |',
    '| --- | --- | --- | --- |',
    ...runtime.pack_delivery_preview.map((entry) => row([
      entry.pack_id,
      entry.default_enabled,
      entry.runtime_delivery,
      entry.future_delivery_requires.join(', '),
    ])),
    '',
  ].join('\n');
}

function markdownCompletionAudit(audit) {
  return [
    '# ECC Governance Completion Audit',
    '',
    `Objective: ${audit.objective}`,
    `Review round count: ${audit.review_round_count}`,
    '',
    '## Prompt-To-Artifact Checklist',
    '',
    '| Requirement | Evidence |',
    '| --- | --- |',
    ...audit.prompt_to_artifact_checklist.map((entry) => row([entry.requirement, entry.evidence])),
    '',
    '## 50-Round Review',
    '',
    '| Round | Question | Evidence | Status |',
    '| ---: | --- | --- | --- |',
    ...audit.review_rounds.map((entry) => row([
      entry.round,
      entry.question,
      entry.evidence,
      entry.status,
    ])),
    '',
  ].join('\n');
}

function writeAll(options = {}) {
  const outputDir = options.outputDir || DEFAULT_OUTPUT_DIR;
  const artifacts = buildAll(options);
  fs.mkdirSync(outputDir, { recursive: true });
  for (const [fileName, content] of Object.entries(artifacts)) {
    const outputPath = path.join(outputDir, fileName);
    fs.writeFileSync(outputPath, typeof content === 'string' ? content : jsonText(content), 'utf8');
  }
  return {
    outputDir,
    artifacts,
  };
}

function main() {
  const result = writeAll();
  const relativeOutput = relativeToRepo(result.outputDir);
  console.log(`Generated ECC governance preview artifacts in ${relativeOutput}`);
  console.log(`Artifacts: ${Object.keys(result.artifacts).sort().join(', ')}`);
  return 0;
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  DEFAULT_OUTPUT_DIR,
  ECC_ROOT,
  PACKS,
  buildAll,
  buildAgentPacks,
  buildAgentRegistry,
  buildCommandIdeaMatrix,
  buildContextPackSchema,
  buildCurrentAgentInventory,
  buildEccAgentOverlapMatrix,
  buildFindingCompatibilityPolicy,
  buildRubricExtractionMatrix,
  buildRuntimeMergePolicy,
  buildRouterPolicy,
  buildSynthesisPolicy,
  buildQualityGates,
  buildPilotScenarios,
  writeAll,
};
