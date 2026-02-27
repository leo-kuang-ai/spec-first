const state = {
    features: [],
    selectedFeatureId: null,
    selectedFlowStage: null,
    gateStatus: {}, // 存储 Gate 状态
    selectedHistoryKey: null,
    projectRoot: '',
  };

  const featureListEl = document.getElementById('featureList');
  const searchEl = document.getElementById('search');
  const projectRootEl = document.getElementById('projectRoot');
  const detailEl = document.getElementById('detail');
  const emptyEl = document.getElementById('empty');
  const FLOW_STAGES = [
    { id: '00_init', label: '初始化', desc: '创建 Feature 目录与基础上下文文件。' },
    { id: '01_specify', label: '需求分析', desc: '明确需求范围、FR/NFR 与验收标准。' },
    { id: '02_design', label: '技术方案', desc: '输出技术方案、接口契约与关键设计。' },
    { id: '03_plan', label: '开发任务', desc: '拆分任务并确定执行顺序与优先级。' },
    { id: '04_implement', label: '编码', desc: '完成编码并通过实现阶段质量门禁。' },
    { id: '05_verify', label: '测试', desc: '执行测试与回归，确认需求达成。' },
    { id: '06_wrap_up', label: '收尾', desc: '沉淀追踪矩阵、归档交付物与结论。' },
  ];
  const STAGE_ORDER = [
    '00_init',
    '01_specify',
    '02_design',
    '03_plan',
    '04_implement',
    '05_verify',
    '06_wrap_up',
    '07_release',
    '08_done',
    '09_cancelled',
  ];
  const STAGE_LABEL_MAP = {
    ...Object.fromEntries(FLOW_STAGES.map((item) => [item.id, item.label])),
    '07_release': '发布',
    '08_done': '完成',
    '09_cancelled': '取消',
  };
  const MODE_LABEL_MAP = {
    N: '新建',
    I: '迭代',
  };
  const SIZE_LABEL_MAP = {
    S: '小型',
    M: '中型',
    L: '大型',
  };

  function escapeHtml(input) {
    return String(input)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function normalizeStageId(stageId) {
    if (stageId === null || stageId === undefined) return '';
    return String(stageId).trim();
  }

  function stageLabel(stageId) {
    const normalized = normalizeStageId(stageId);
    return STAGE_LABEL_MAP[normalized] || normalized;
  }

  function formatStageIdWithLabel(stageId) {
    const normalized = normalizeStageId(stageId);
    if (!normalized || normalized === '-') return '-';
    const label = STAGE_LABEL_MAP[normalized];
    if (!label) return normalized;
    const labelWithoutPrefix = label.replace(/^\d{2}\s*/, '').trim() || label;
    return `${normalized}（${labelWithoutPrefix}）`;
  }

  function formatFlowStageLabel(stage) {
    const id = typeof stage === 'string' ? stage : stage?.id;
    const rawLabel = typeof stage === 'string' ? stageLabel(stage) : stage?.label;
    const label = String(rawLabel || '').replace(/^\d{2}\s*/, '').trim();
    const number = normalizeStageId(id).match(/^(\d{2})_/)?.[1];
    if (number && label) return `${number} ${label}`;
    return label || normalizeStageId(id) || '-';
  }

  function formatCodeWithLabel(value, labelMap) {
    const normalized = normalizeStageId(value).toUpperCase();
    if (!normalized || normalized === '-') return '-';
    const label = labelMap[normalized];
    return label ? `${normalized}（${label}）` : normalized;
  }

  function formatModeSize(mode, size) {
    return `${formatCodeWithLabel(mode, MODE_LABEL_MAP)} / ${formatCodeWithLabel(size, SIZE_LABEL_MAP)}`;
  }

  function isFlowStage(stageId) {
    const normalized = normalizeStageId(stageId);
    return FLOW_STAGES.some((item) => item.id === normalized);
  }

  function toFlowStage(stageId) {
    const normalized = normalizeStageId(stageId);
    if (!normalized) return null;
    if (isFlowStage(normalized)) return normalized;
    const rank = STAGE_ORDER.indexOf(normalized);
    if (rank < 0) return null;
    const maxFlowRank = STAGE_ORDER.indexOf(FLOW_STAGES[FLOW_STAGES.length - 1].id);
    return STAGE_ORDER[Math.min(rank, maxFlowRank)] || null;
  }

  function resolveHistoryFlowStage(historyItem) {
    if (!historyItem) return null;
    return toFlowStage(historyItem.to) || toFlowStage(historyItem.from);
  }

  function getHistoryKey(item, index) {
    const from = normalizeStageId(item?.from || '-');
    const to = normalizeStageId(item?.to || '-');
    const at = item?.at || item?.timestamp || String(index);
    return `${from}->${to}@${at}`;
  }

  function resolveActiveStage(currentStage) {
    const selectedFlowStage = toFlowStage(state.selectedFlowStage);
    if (selectedFlowStage) {
      return selectedFlowStage;
    }
    const currentFlowStage = toFlowStage(currentStage);
    if (currentFlowStage) {
      return currentFlowStage;
    }
    return FLOW_STAGES[FLOW_STAGES.length - 1].id;
  }

  function selectStage(stageState, stageId, options = {}) {
    const { historyKey = undefined } = options;
    const mappedStage = toFlowStage(stageId);
    if (mappedStage) {
      state.selectedFlowStage = mappedStage;
    }
    if (historyKey !== undefined) {
      state.selectedHistoryKey = historyKey;
    }

    const activeStage = resolveActiveStage(stageState.currentStage || '00_init');
    renderStageFlow(stageState, activeStage);
    renderStageTables(stageState, activeStage);

    const flowEl = document.getElementById('stageFlow');
    const selectedNode = Array.from(flowEl.querySelectorAll('.flow-step'))
      .find((node) => node.getAttribute('data-stage') === activeStage);
    if (selectedNode) {
      selectedNode.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    const historyEl = document.getElementById('historyTable');
    const candidateRows = Array.from(historyEl.querySelectorAll('tr[data-flow-stage]'));
    for (const row of candidateRows) {
      const byHistoryKey = state.selectedHistoryKey && row.getAttribute('data-history-key') === state.selectedHistoryKey;
      const byFlowStage = !state.selectedHistoryKey && row.getAttribute('data-flow-stage') === activeStage;
      row.classList.toggle('selected', Boolean(byHistoryKey || byFlowStage));
    }

    if (state.selectedHistoryKey && !candidateRows.some((row) => row.classList.contains('selected'))) {
      state.selectedHistoryKey = null;
      for (const row of candidateRows) {
        row.classList.toggle('selected', row.getAttribute('data-flow-stage') === activeStage);
      }
    }
  }

  function calcStageProgress(currentStage) {
    // 计算阶段进度百分比 (00_init=0% -> 06_wrap_up=100%)
    const stageIndex = FLOW_STAGES.findIndex(fs => fs.id === currentStage);
    if (stageIndex < 0) return 0;
    return Math.round((stageIndex / (FLOW_STAGES.length - 1)) * 100);
  }

  function renderFeatureList() {
    const q = searchEl.value.trim().toLowerCase();
    const list = state.features.filter((item) => {
      if (!q) return true;
      return String(item.featureId).toLowerCase().includes(q)
        || String(item.title || '').toLowerCase().includes(q);
    });

    featureListEl.innerHTML = list.map((item) => {
      const active = item.featureId === state.selectedFeatureId ? 'active' : '';
      const progress = calcStageProgress(item.currentStage);
      const progressColor = progress >= 100 ? 'var(--ok)' : (progress >= 50 ? 'var(--accent)' : 'var(--warn)');
      return `
      <div class="feature ${active}" data-id="${escapeHtml(item.featureId)}">
        <div class="feature-header">
          <div class="title mono">${escapeHtml(item.featureId)}</div>
          <div class="feature-progress-badge">${progress}%</div>
        </div>
        <div>${escapeHtml(item.title || '(untitled)')}</div>
        <div class="feature-progress-bar">
          <div class="feature-progress-fill" style="width:${progress}%; background:${progressColor}"></div>
        </div>
        <div class="chips" style="margin-top:6px;">
          <span class="chip">${escapeHtml(item.currentStage)}</span>
          <span class="chip">${escapeHtml(formatModeSize(item.mode, item.size))}</span>
          <span class="chip">${item.terminal ? 'terminal' : 'active'}</span>
        </div>
      </div>`;
    }).join('');

    for (const node of featureListEl.querySelectorAll('.feature')) {
      node.addEventListener('click', () => {
        state.selectedFeatureId = node.getAttribute('data-id');
        state.selectedFlowStage = null;
        state.selectedHistoryKey = null;
        renderFeatureList();
        loadDetail();
      });
    }
  }

  function kvCard(key, value, cls = '') {
    return `<div class="card"><div class="muted">${escapeHtml(key)}</div><div class="value ${cls}">${escapeHtml(value)}</div></div>`;
  }

  function renderTable(id, headers, rows) {
    const el = document.getElementById(id);
    const thead = `<tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`;
    const tbody = rows.length
      ? rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')
      : `<tr><td colspan="${headers.length}" class="muted">暂无数据</td></tr>`;
    el.innerHTML = thead + tbody;
  }

  function renderStageDesc() {
    const descEl = document.getElementById('stageDesc');
    descEl.innerHTML = FLOW_STAGES.map((item) => {
      return `<div class="flow-stage-desc-item"><span class="mono">${escapeHtml(formatFlowStageLabel(item))}</span>：${escapeHtml(item.desc)}</div>`;
    }).join('');
  }

  function parseTimestamp(value) {
    if (value === null || value === undefined || value === '') return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

    if (typeof value === 'number' && Number.isFinite(value)) {
      const ms = value < 1e12 ? value * 1000 : value;
      const date = new Date(ms);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    if (typeof value === 'string') {
      const text = value.trim();
      if (!text) return null;
      if (/^\d+$/.test(text)) {
        const raw = Number(text);
        if (Number.isFinite(raw)) {
          const ms = raw < 1e12 ? raw * 1000 : raw;
          const date = new Date(ms);
          if (!Number.isNaN(date.getTime())) return date;
        }
      }
      const date = new Date(text);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    return null;
  }

  function formatTimestamp(value, compact = false) {
    const date = parseTimestamp(value);
    if (!date) return value ? String(value) : '-';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');

    if (compact) return `${month}-${day} ${hour}:${minute}`;
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  }

  function toShortTime(value) {
    return formatTimestamp(value, true);
  }

  function renderStageFlow(stageState, activeStage) {
    const flowEl = document.getElementById('stageFlow');
    const history = Array.isArray(stageState.history) ? stageState.history : [];
    const currentStage = stageState.currentStage || '00_init';
    const stageRank = new Map(STAGE_ORDER.map((value, index) => [value, index]));
    const currentRank = stageRank.has(currentStage) ? stageRank.get(currentStage) : 0;
    const transitionMap = new Map();

    for (const item of history) {
      const key = `${item.from || ''}->${item.to || ''}`;
      transitionMap.set(key, item);
    }

    const chunks = [];
    for (let index = 0; index < FLOW_STAGES.length; index += 1) {
      const step = FLOW_STAGES[index];
      const stepRank = stageRank.get(step.id);
      const status = stepRank < currentRank ? 'done' : (step.id === currentStage ? 'current' : 'todo');
      const selectedClass = step.id === activeStage ? 'selected' : '';
      const atCurrent = step.id === currentStage ? toShortTime(stageState.updatedAt) : '';
      const marker = status === 'done' ? '已完成' : (status === 'current' ? '当前阶段' : '待开始');

      // 获取该阶段的 Gate 状态
      const gateInfo = renderGateStatusBadge(step.id);

      chunks.push(`
        <div class="flow-step ${status} ${selectedClass}" data-stage="${escapeHtml(step.id)}" title="点击查看 ${escapeHtml(step.label)} 的 Gate 与产物">
          <div class="flow-step-title mono">${escapeHtml(formatFlowStageLabel(step))}</div>
          <div class="flow-step-meta">${escapeHtml(marker)}</div>
          <div class="flow-step-meta">${escapeHtml(atCurrent)}</div>
          ${gateInfo}
        </div>
      `);

      if (index < FLOW_STAGES.length - 1) {
        const from = step.id;
        const to = FLOW_STAGES[index + 1].id;
        const link = transitionMap.get(`${from}->${to}`);
        const linkText = link ? `${toShortTime(link.at || link.timestamp)} · ${link.by || '-'}` : '未流转';
        chunks.push(`<div class="flow-link">→ ${escapeHtml(linkText)}</div>`);
      }
    }

    flowEl.innerHTML = `<div class="flow-track">${chunks.join('')}</div>`;

    for (const node of flowEl.querySelectorAll('.flow-step')) {
      node.addEventListener('click', () => {
        selectStage(stageState, node.getAttribute('data-stage'), { historyKey: null });
      });
    }
  }

  // 渲染 Gate 状态徽章
  function renderGateStatusBadge(stageId) {
    const stageGate = state.gateStatus.stages ? state.gateStatus.stages[stageId] : null;
    if (!stageGate) {
      return ''; // 没有 Gate 记录则不显示
    }

    let iconClass = 'pending';
    let iconText = '?';
    let textClass = 'pending';
    let text = '待检';

    if (stageGate.status === 'PASS') {
      iconClass = 'pass';
      iconText = '✓';
      textClass = 'pass';
      text = `${stageGate.passCount}/${stageGate.totalCount}`;
    } else if (stageGate.status === 'PASS_WITH_WAIVER') {
      iconClass = 'waiver';
      iconText = '~';
      textClass = 'waiver';
      text = `${stageGate.passCount}/${stageGate.totalCount} 豁免`;
    } else if (stageGate.status === 'FAIL') {
      iconClass = 'fail';
      iconText = '✗';
      textClass = 'fail';
      text = `${stageGate.passCount}/${stageGate.totalCount}`;
    }

    return `
      <div class="flow-step-gate">
        <span class="gate-icon ${iconClass}">${iconText}</span>
        <span class="gate-text ${textClass}">${escapeHtml(text)}</span>
      </div>
    `;
  }

  function renderStageTables(stageState, activeStage) {
    const gates = (((stageState.mergedRules || {}).gateConditions || {})[activeStage]) || [];
    const deliverables = (((stageState.mergedRules || {}).deliverables || {})[activeStage]) || [];

    document.getElementById('gateTitle').textContent = `${stageLabel(activeStage)} Gate`;
    document.getElementById('deliverableTitle').textContent = `${stageLabel(activeStage)} 产物`;

    renderTable('gateTable', ['id', 'description', 'command'], gates.map((item) => [
      `<span class="mono">${escapeHtml(item.id || '-')}</span>`,
      escapeHtml(item.description || '-'),
      item.command ? `<span class="mono">${escapeHtml(item.command)}</span>` : '<span class="muted">manual</span>',
    ]));

    renderTable('deliverableTable', ['name', 'required', 'description'], deliverables.map((item) => [
      `<span class="mono">${escapeHtml(item.name || '-')}</span>`,
      item.required ? '<span class="ok">yes</span>' : '<span class="muted">no</span>',
      escapeHtml(item.description || ''),
    ]));
  }

  async function loadFeatures() {
    const res = await fetch('/api/features', { cache: 'no-store' });
    const data = await res.json();
    state.features = data.features || [];
    state.projectRoot = data.projectRoot || '';
    projectRootEl.textContent = state.projectRoot;

    if (!state.selectedFeatureId && state.features.length > 0) {
      state.selectedFeatureId = state.features[0].featureId;
    }

    if (state.selectedFeatureId && !state.features.find((item) => item.featureId === state.selectedFeatureId)) {
      state.selectedFeatureId = state.features[0]?.featureId || null;
      state.selectedFlowStage = null;
      state.selectedHistoryKey = null;
    }

    renderFeatureList();
  }

  async function loadDetail() {
    if (!state.selectedFeatureId) {
      detailEl.style.display = 'none';
      emptyEl.style.display = 'block';
      return;
    }

    const res = await fetch(`/api/feature/${encodeURIComponent(state.selectedFeatureId)}`, { cache: 'no-store' });
    if (!res.ok) {
      detailEl.style.display = 'none';
      emptyEl.style.display = 'block';
      emptyEl.textContent = '无法读取该 Feature 的 stage-state.json';
      return;
    }

    const data = await res.json();
    const s = data.state || {};
    const currentStage = s.currentStage || 'unknown';

    document.getElementById('detailTitle').textContent = `${s.featureId || state.selectedFeatureId} · ${s.title || '(untitled)'}`;

    document.getElementById('summary').innerHTML = [
      kvCard('当前阶段', currentStage, s.terminal ? 'warn' : 'ok'),
      kvCard('模式 / 规模', formatModeSize(s.mode, s.size)),
      kvCard('平台', Array.isArray(s.platforms) ? s.platforms.join(', ') : '-'),
      kvCard('更新时间', formatTimestamp(s.updatedAt)),
    ].join('');

    renderStageDesc();
    const activeStage = resolveActiveStage(currentStage);

    const history = Array.isArray(s.history) ? s.history : [];
    renderTable('historyTable', ['from', 'to', 'at', 'by'], history.map((item) => {
      const toStage = item.to || '';
      return [
        `<span class="mono">${escapeHtml(formatStageIdWithLabel(item.from || '-'))}</span>`,
        `<span class="mono">${escapeHtml(formatStageIdWithLabel(toStage || '-'))}</span>`,
        escapeHtml(formatTimestamp(item.at || item.timestamp)),
        escapeHtml(item.by || '-'),
      ];
    }));

    const historyTableEl = document.getElementById('historyTable');
    const rows = Array.from(historyTableEl.querySelectorAll('tr')).slice(1);
    rows.forEach((row, index) => {
      const historyItem = history[index];
      const flowStage = resolveHistoryFlowStage(historyItem);
      if (!flowStage) return;
      const historyKey = getHistoryKey(historyItem, index);
      row.setAttribute('data-flow-stage', flowStage);
      row.setAttribute('data-history-key', historyKey);
      row.addEventListener('click', () => {
        selectStage(s, flowStage, { historyKey });
      });
    });

    selectStage(s, activeStage);

    const thresholds = (s.mergedRules || {}).thresholds || {};
    renderTable('thresholdTable', ['metric', 'value', 'direction'], Object.entries(thresholds).map(([key, item]) => [
      `<span class="mono">${escapeHtml(key)}</span>`,
      escapeHtml(item?.value ?? '-'),
      escapeHtml(item?.direction ?? '-'),
    ]));

    // Load Health Dashboard, Task Progress and Gate Status
    loadHealthDashboard();
    loadTaskProgress();
    loadGateStatus();
    loadTimeline();

    emptyEl.style.display = 'none';
    detailEl.style.display = 'block';
  }

  // ─── Gate Status API ─────────────────────────────────────────────────

  async function loadGateStatus() {
    if (!state.selectedFeatureId) {
      state.gateStatus = {};
      return;
    }

    try {
      const res = await fetch(`/api/feature/${encodeURIComponent(state.selectedFeatureId)}/gate-status`, { cache: 'no-store' });
      if (!res.ok) {
        state.gateStatus = {};
        return;
      }
      const data = await res.json();
      state.gateStatus = data;

      // 重新渲染阶段流转图以显示 Gate 状态
      const stageState = await loadStageState(state.selectedFeatureId);
      if (stageState) {
        renderStageFlow(stageState, state.selectedFlowStage || stageState.currentStage);
      }
    } catch (e) {
      console.error('Failed to load gate status:', e);
      state.gateStatus = {};
    }
  }

  async function loadStageState(featureId) {
    try {
      const res = await fetch(`/api/feature/${encodeURIComponent(featureId)}`, { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      return data.state;
    } catch {
      return null;
    }
  }

  // ─── Health Dashboard API ─────────────────────────────────────────────

  async function loadHealthDashboard() {
    const dashboardEl = document.getElementById('healthDashboard');
    if (!state.selectedFeatureId) {
      dashboardEl.style.display = 'none';
      return;
    }

    try {
      const res = await fetch(`/api/feature/${encodeURIComponent(state.selectedFeatureId)}/metrics`, { cache: 'no-store' });
      if (!res.ok) {
        dashboardEl.style.display = 'none';
        return;
      }
      const data = await res.json();
      renderHealthDashboard(data);
      dashboardEl.style.display = 'grid';
    } catch (e) {
      console.error('Failed to load health dashboard:', e);
      dashboardEl.style.display = 'none';
    }
  }

  function renderHealthDashboard(data) {
    const { health, coverage } = data;

    // Health Score
    const score = health?.H1 ?? 0;
    const grade = health?.grade ?? '-';

    document.getElementById('healthScoreValue').textContent = Math.round(score);
    document.getElementById('healthGrade').textContent = `等级 ${grade}`;

    // Progress Ring
    const progressEl = document.getElementById('healthRingProgress');
    const circumference = 2 * Math.PI * 38;
    const offset = circumference * (1 - score / 100);
    progressEl.style.strokeDashoffset = offset;

    const gradeColors = {
      'A': '#2ec27e',
      'B': '#4ea1ff',
      'C': '#f5c451',
      'D': '#f97316',
      'F': '#ef5c6b',
    };
    progressEl.style.stroke = gradeColors[grade] || '#4ea1ff';
    document.getElementById('healthScoreValue').style.color = gradeColors[grade] || 'var(--text)';

    // Coverage Bars
    const metricDefs = data.metricDefs || [];
    const coverageBarsEl = document.getElementById('coverageBars');
    if (metricDefs.length > 0 && coverage) {
      coverageBarsEl.innerHTML = metricDefs.map((def) => {
        const value = (coverage[def.key] ?? 0) * 100;
        const target = def.target * 100;
        const statusClass = value >= target ? 'pass' : (value >= target * 0.7 ? 'warn' : 'fail');
        const color = statusClass === 'pass' ? 'var(--ok)' : (statusClass === 'warn' ? 'var(--warn)' : 'var(--danger)');

        return `
          <div class="coverage-item">
            <div class="coverage-item-header">
              <span class="name">${escapeHtml(def.key)} ${escapeHtml(def.name)}</span>
              <span class="value" style="color:${color}">${value.toFixed(0)}%</span>
            </div>
            <div class="coverage-bar">
              <div class="coverage-bar-fill ${statusClass}" style="width:${Math.min(value, 100)}%"></div>
            </div>
          </div>
        `;
      }).join('');
    } else {
      coverageBarsEl.innerHTML = '<div class="muted">暂无覆盖率数据</div>';
    }

    // Load defect details
    loadDefectDetails();
  }

  // ─── Defect Details API ─────────────────────────────────────────────

  let defectData = { stats: { total: 0, S1: 0, S2: 0, S3: 0, S4: 0, open: 0, fixing: 0, fixed: 0 }, defects: [] };

  async function loadDefectDetails() {
    if (!state.selectedFeatureId) {
      defectData = { stats: { total: 0, S1: 0, S2: 0, S3: 0, S4: 0, open: 0, fixing: 0, fixed: 0 }, defects: [] };
      renderDefectStats();
      return;
    }

    try {
      const res = await fetch(`/api/feature/${encodeURIComponent(state.selectedFeatureId)}/defects`, { cache: 'no-store' });
      if (!res.ok) {
        defectData = { stats: { total: 0, S1: 0, S2: 0, S3: 0, S4: 0, open: 0, fixing: 0, fixed: 0 }, defects: [] };
        renderDefectStats();
        return;
      }
      const data = await res.json();
      defectData = { stats: data.stats || {}, defects: data.defects || [] };
      renderDefectStats();
    } catch (e) {
      console.error('Failed to load defect details:', e);
      defectData = { stats: { total: 0, S1: 0, S2: 0, S3: 0, S4: 0, open: 0, fixing: 0, fixed: 0 }, defects: [] };
      renderDefectStats();
    }
  }

  function renderDefectStats() {
    const { stats } = defectData;
    const gridEl = document.getElementById('defectSeverityGrid');
    const summaryEl = document.getElementById('defectSummary');

    // Severity grid
    const severities = [
      { key: 'S1', label: '致命', color: 'var(--danger)' },
      { key: 'S2', label: '严重', color: '#f97316' },
      { key: 'S3', label: '一般', color: 'var(--warn)' },
      { key: 'S4', label: '轻微', color: 'var(--muted)' },
    ];

    gridEl.innerHTML = severities.map(s => `
      <div class="defect-severity-item">
        <span class="defect-dot ${s.key}" style="background:${s.color}"></span>
        <span>${s.label}: ${stats[s.key] || 0}</span>
      </div>
    `).join('');

    // Summary
    const pending = (stats.open || 0) + (stats.fixing || 0);
    summaryEl.innerHTML = `<span class="count">${pending}</span> 个缺陷待处理`;

    // Bind event listeners
    summaryEl.onclick = toggleDefectList;
    const closeBtn = document.getElementById('defectListClose');
    if (closeBtn) {
      closeBtn.onclick = hideDefectList;
    }

    // Update defect list content
    renderDefectList();
  }

  function renderDefectList() {
    const listContent = document.getElementById('defectListContent');
    const { defects } = defectData;

    if (!defects || defects.length === 0) {
      listContent.innerHTML = '<div class="muted" style="padding: 12px; text-align: center;">暂无缺陷</div>';
      return;
    }

    listContent.innerHTML = defects.map(d => `
      <div class="defect-item">
        <div class="defect-item-header">
          <span class="defect-item-id">#${d.seq || '-'}</span>
          <span class="defect-item-status ${d.status || 'open'}">${getStatusText(d.status)}</span>
        </div>
        <div class="defect-item-title">${escapeHtml(d.title || '-')}</div>
        <div class="defect-item-meta">
          <span class="defect-dot ${d.severity || 'S4'}" style="width:6px;height:6px;display:inline-block;border-radius:50%;margin-right:4px;"></span>
          ${d.severity || 'S4'} · ${formatTimestamp(d.updatedAt || d.createdAt)}
        </div>
      </div>
    `).join('');
  }

  function getStatusText(status) {
    const statusMap = {
      'open': '待处理',
      'fixing': '修复中',
      'fixed': '已修复',
      'verified': '已验证',
    };
    return statusMap[status] || status || '待处理';
  }

  function toggleDefectList() {
    const listEl = document.getElementById('defectList');
    const summaryEl = document.getElementById('defectSummary');
    const isVisible = listEl.classList.contains('visible');

    if (isVisible) {
      listEl.classList.remove('visible');
      summaryEl.classList.remove('expanded');
    } else {
      listEl.classList.add('visible');
      summaryEl.classList.add('expanded');
    }
  }

  function hideDefectList(event) {
    event.stopPropagation();
    const listEl = document.getElementById('defectList');
    const summaryEl = document.getElementById('defectSummary');
    listEl.classList.remove('visible');
    summaryEl.classList.remove('expanded');
  }

  // ─── Task Progress API ─────────────────────────────────────────────

  async function loadTaskProgress() {
    const sectionEl = document.getElementById('taskProgressSection');
    if (!state.selectedFeatureId) {
      sectionEl.style.display = 'none';
      return;
    }

    try {
      const res = await fetch(`/api/feature/${encodeURIComponent(state.selectedFeatureId)}/tasks`, { cache: 'no-store' });
      if (!res.ok) {
        sectionEl.style.display = 'none';
        return;
      }
      const data = await res.json();
      renderTaskProgress(data);
      sectionEl.style.display = 'block';
    } catch (e) {
      console.error('Failed to load task progress:', e);
      sectionEl.style.display = 'none';
    }
  }

  function renderTaskProgress(data) {
    const { stats, phases, currentTasks } = data;

    // Task Stats
    document.getElementById('completedCount').textContent = stats.completed || 0;
    document.getElementById('inProgressCount').textContent = stats.inProgress || 0;
    document.getElementById('pendingCount').textContent = stats.pending || 0;

    // Progress Bar
    const progressFill = document.getElementById('taskProgressFill');
    const progress = stats.progress || 0;
    progressFill.style.width = `${progress}%`;
    const progressColor = progress >= 100 ? 'var(--ok)' : (progress >= 50 ? 'var(--accent)' : 'var(--warn)');
    progressFill.style.background = progressColor;

    progressFill.style.background = `linear-gradient(90deg, var(--ok), var(--accent))`;

    // Current Tasks Panel
    const currentPanel = document.getElementById('currentTasksPanel');
    const currentList = document.getElementById('currentTasksList');

    if (currentTasks && currentTasks.length > 0) {
      currentList.innerHTML = currentTasks.map((task) => `
        <div class="current-task-item">
          <span class="task-id">${escapeHtml(task.id)}</span>
          <span class="task-title">${escapeHtml(task.title)}</span>
        </div>
      `).join('');
      currentPanel.style.display = 'block';
    } else {
      currentPanel.style.display = 'none';
    }

    // Phase Grid
    const phaseGridEl = document.getElementById('phaseGrid');
    if (!phases || phases.length === 0) {
      phaseGridEl.style.display = 'none';
      return;
    }

    phaseGridEl.innerHTML = phases.map((phase) => {
      const completedTasks = phase.tasks.filter(t => t.status === 'complete').length;
      const totalTasks = phase.tasks.length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const statusClass = phase.status || 'pending';
      const progressColor = phase.status === 'complete' ? 'var(--ok)' : (phase.status === 'in_progress' ? 'var(--accent)' : 'var(--muted)');

      const statusText = phase.status === 'complete' ? '已完成' : (phase.status === 'in_progress' ? '进行中' : '待处理');

      return `
        <div class="phase-card">
          <div class="phase-card-header">
            <span class="phase-card-title">${escapeHtml(phase.title)}</span>
            <span class="phase-card-status ${statusClass}">${statusText}</span>
          </div>
          <div class="phase-card-progress">
            <div class="phase-card-progress-fill" style="width:${progress}%; background:${progressColor}"></div>
          </div>
          <div class="phase-card-tasks">${completedTasks}/${totalTasks} 个任务</div>
        </div>
      `;
    }).join('');
    phaseGridEl.style.display = 'grid';
  }

  async function refreshAll() {
    try {
      await loadFeatures();
      await loadDetail();
    } catch (e) {
      emptyEl.style.display = 'block';
      detailEl.style.display = 'none';
      emptyEl.textContent = `加载失败：${e?.message || e}`;
    }
  }

  // ─── Timeline API ─────────────────────────────────────────────────

  async function loadTimeline() {
    if (!state.selectedFeatureId) return;

    const section = document.getElementById('timelineSection');
    try {
      const res = await fetch(`/api/feature/${encodeURIComponent(state.selectedFeatureId)}/timeline`, { cache: 'no-store' });
      if (!res.ok) {
        section.style.display = 'none';
        return;
      }
      const data = await res.json();
      renderTimeline(data);
      section.style.display = 'block';
    } catch (e) {
      console.error('Failed to load timeline:', e);
      section.style.display = 'none';
    }
  }

  function renderTimeline(data) {
    const { stages, totalHours, totalDays, startTime, endTime } = data;

    // Render summary
    const summaryEl = document.getElementById('timelineSummary');
    if (summaryEl) {
      summaryEl.innerHTML = `
        <span class="timeline-summary-item">
          总时长: <span class="timeline-summary-value">${totalDays > 0 ? totalDays + ' 天' : totalHours + ' 小时'}</span>
        </span>
        <span class="timeline-summary-item">
          已完成阶段: <span class="timeline-summary-value">${stages.length}</span>
        </span>
        <span class="timeline-summary-item">
          开始: <span class="timeline-summary-value">${startTime ? formatTimestamp(startTime) : '-'}</span>
        </span>
      `;
    }

    // Render timeline stages
    const stagesEl = document.getElementById('timelineStages');
    if (!stagesEl) return;

    if (!stages || stages.length === 0) {
      stagesEl.innerHTML = '<div class="muted" style="text-align:center;width:100%;">暂无阶段历史数据</div>';
      return;
    }

    // Get all FLOW_STAGES for complete timeline
    const allStages = FLOW_STAGES.map(fs => {
      const found = stages.find(s => s.stage === fs.id);
      return {
        ...fs,
        ...found,
        status: found ? 'complete' : 'pending'
      };
    });

    // Find current stage index based on actual currentStage
    const stageState = state.features.find(f => f.featureId === state.selectedFeatureId);
    const currentStageIndex = stageState ? FLOW_STAGES.findIndex(fs => fs.id === stageState.currentStage) : -1;

    // Update status for stages after current
    for (let i = 0; i < allStages.length; i++) {
      if (i === currentStageIndex && allStages[i].status === 'pending') {
        allStages[i].status = 'in-progress';
      } else if (i > currentStageIndex && currentStageIndex >= 0) {
        allStages[i].status = 'pending';
      }
    }

    stagesEl.innerHTML = allStages.map((stage, index) => {
      const statusClass = stage.status || 'pending';
      const stageNum = stage.id.split('_')[0];
      const duration = stage.durationHours ? (stage.durationDays >= 1 ? stage.durationDays + '天' : stage.durationHours + 'h') : '';
      const timeStr = stage.startTime ? formatTimestamp(stage.startTime).split(' ')[0] : '';

      return `
        <div class="timeline-stage">
          <div class="timeline-node ${statusClass}">${stageNum}</div>
          <div class="timeline-info">
            <div class="timeline-stage-name">${stage.label}</div>
            <div class="timeline-duration">${duration}</div>
            <div class="timeline-time">${timeStr}</div>
          </div>
        </div>
      `;
    }).join('');

    // Add progress bars between nodes
    const stageElements = stagesEl.querySelectorAll('.timeline-stage');
    for (let i = 0; i < stageElements.length - 1; i++) {
      const currentStage = allStages[i];
      const nextStage = allStages[i + 1];
      const bar = document.createElement('div');
      bar.className = 'timeline-bar';

      if (currentStage.status === 'complete' && nextStage.status === 'complete') {
        bar.classList.add('complete');
      } else if (currentStage.status === 'complete' && nextStage.status === 'in-progress') {
        bar.classList.add('in-progress');
      } else {
        bar.classList.add('pending');
      }

      // Position bar
      const currentRect = stageElements[i].querySelector('.timeline-node').getBoundingClientRect();
      const nextRect = stageElements[i + 1].querySelector('.timeline-node').getBoundingClientRect();
      bar.style.left = '50%';
      bar.style.width = '100%';

      stageElements[i].appendChild(bar);
    }

    // Render Gantt chart for detailed duration view
    renderTimelineGantt(stages, totalHours);
  }

  function renderTimelineGantt(stages, totalHours) {
    const container = document.querySelector('.timeline-section');
    if (!container || !stages || stages.length === 0) return;

    // Check if gantt section already exists
    let ganttSection = container.querySelector('.timeline-gantt');
    if (!ganttSection) {
      ganttSection = document.createElement('div');
      ganttSection.className = 'timeline-gantt';
      ganttSection.innerHTML = `
        <div class="timeline-gantt-title">阶段耗时分布</div>
        <div class="timeline-gantt-chart" id="timelineGanttChart"></div>
      `;
      container.appendChild(ganttSection);
    }

    const chartEl = document.getElementById('timelineGanttChart');
    if (!chartEl) return;

    const maxDuration = Math.max(...stages.map(s => s.durationHours || 0), 1);

    chartEl.innerHTML = stages.map((stage) => {
      const width = totalHours > 0 ? ((stage.durationHours || 0) / totalHours * 100) : 0;
      const statusClass = 'complete';
      const stageLabel = FLOW_STAGES.find(fs => fs.id === stage.stage)?.label || stage.stageName;
      const durationText = stage.durationDays >= 1 ? stage.durationDays + '天' : stage.durationHours + '小时';

      return `
        <div class="timeline-gantt-row">
          <div class="timeline-gantt-label">${stageLabel}</div>
          <div class="timeline-gantt-bar-container">
            <div class="timeline-gantt-bar ${statusClass}" style="left:0; width:${Math.max(width, 2)}%;">
              ${durationText}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  searchEl.addEventListener('input', () => renderFeatureList());
  refreshAll();
  setInterval(refreshAll, 5000);