'use strict';

// Only connect cases with two clear planner-return boundary conditions; do not evaluate general handover or planning semantics.
function checkPlanningReturn(mode) {
  // The host trajectory may use /var, while the child process's cwd uses /private/var; for non-existent write targets, the most recent existing parent directory is resolved.
  const actualPath = (file) => {
    let parent = path.resolve(file);
    const suffix = [];
    while (!fs.existsSync(parent)) {
      const next = path.dirname(parent);
      assert.notEqual(next, parent, '路径没有可解析的父目录');
      suffix.unshift(path.basename(parent));
      parent = next;
    }
    return path.join(fs.realpathSync(parent), ...suffix);
  };
  const packet = finalObject();
  const text = (value) => typeof value === 'string' && value.trim().length > 0;
  const items = (value) => Array.isArray(value) && value.length > 0 && value.every(text);
  assert.ok(packet.plan && text(packet.plan.summary), '缺少规划摘要');
  assert.ok(items(packet.plan.changes), '缺少规划改动项');
  assert.ok(items(packet.plan.verification_scenarios), '缺少待执行的验证场景');
  assert.ok(items(packet.plan.source_refs) && packet.plan.source_refs.includes('src/server.js'), '缺少用例要求的源码引用');
  assert.equal(packet.implementation_started, false, '本轮必须停在规划返回边界');
  assert.equal(packet.handoff?.status, mode === 'caller' ? 'returned-to-caller' : 'blocked');
  assert.equal(packet.handoff.owner, mode === 'caller' ? 'caller' : 'spec-work');
  assert.ok(text(packet.handoff.reason) && text(packet.handoff.next_action), '缺少交接原因或下一步');

  const planPath = packet.plan.artifact_path;
  if (mode === 'caller') assert.ok(text(planPath), 'pipeline 返回必须引用 Durable 计划');
  if (planPath !== null) {
    assert.ok(text(planPath) && /^docs\/plans\/[^\n]+\.md$/.test(planPath), '计划引用必须为仓库内 Markdown 路径');
    const plan = regular(planPath).toString();
    assert.match(plan, /^artifact_contract: spec-unified-plan\/v1$/m);
    assert.match(plan, /^artifact_readiness: implementation-ready$/m);
    assert.match(plan, /^execution: code$/m);
    for (const heading of ['Goal Capsule', 'Product Contract', 'Planning Contract', 'Implementation Units', 'Verification Contract', 'Definition of Done']) {
      assert.ok(plan.includes('## ' + heading), '缺少计划结构：' + heading);
    }
  }

  assert.ok(process.env.EVAL_TRANSCRIPT_PATH, '缺少 runner 轨迹');
  const messages = JSON.parse(fs.readFileSync(process.env.EVAL_TRANSCRIPT_PATH, 'utf8'));
  assert.ok(Array.isArray(messages) && messages.length > 0, '轨迹为空或格式不支持');
  const argsOf = (call) => typeof call.arguments === 'string' ? JSON.parse(call.arguments) : call.arguments || {};
  const nameOf = (call) => call.name.split(/__|\./).pop().toLowerCase();
  const isPreparation = (call) => {
    const segments = topLevelSegments(commandOf({ arguments: argsOf(call) }));
    if (segments.length !== 1) return false;
    const tokens = segments[0].map((token) => token.replace(/^(['"])(.*)\1$/, '$2'));
    return tokens.length === 2 && path.basename(tokens[0]) === 'node'
      && path.resolve(tokens[1]) === path.resolve('prepare-eval.cjs');
  };
  // Verify all attempts, not only successful and paired calls; failed or revoked executions must also not be overlooked.
  const attempts = [];
  for (const message of messages) {
    assert.ok(!message.tool_calls && !message.function_call, '不支持嵌套调用，需人工核验');
    if (message.role !== 'tool_call') {
      assert.ok(!message.tool_call, '调用事件未按 runner 协议标记');
      continue;
    }
    const call = message.tool_call;
    assert.ok(call && typeof call.name === 'string', '缺少工具身份');
    attempts.push(call);
    const name = nameOf(call);
    const args = argsOf(call);
    if (mode === 'blocked' && ['read', 'read_file', 'glob', 'grep'].includes(name)) {
      // Only check explicitly named owner paths or search terms; do not infer intent from general research content.
      const targets = [args.file_path, args.path, args.pattern, args.glob].filter(text);
      assert.ok(!targets.some((target) => /(^|[^a-zA-Z0-9_-])spec-work(?=$|[^a-zA-Z0-9_-])/.test(target)),
        '本用例未授权搜索或加载 spec-work 执行 owner');
    }
    if (['bash', 'exec_command', 'run_command', 'shell'].includes(name)) {
      assert.ok(isPreparation(call), '本用例的 shell 仅授权基线准备；其他命令需人工核验');
    } else if (name === 'skill') {
      assert.equal(args.skill, 'spec-plan', '本轮不得进入下游执行 owner 或独立审查');
    } else if (['write', 'edit', 'write_file', 'edit_file'].includes(name)) {
      const file = args.file_path || args.path;
      assert.ok(text(file), '缺少写入路径');
      const relative = path.relative(fs.realpathSync('.'), actualPath(file)).split(path.sep).join('/');
      assert.ok(/^docs\/plans\/[^\n]+\.md$/.test(relative), '写入不属于本轮规划产物');
    } else {
      assert.ok(['read', 'read_file', 'glob', 'grep', 'taskcreate', 'taskupdate', 'tasklist', 'taskget', 'todowrite'].includes(name),
        '未知或未授权工具，机械边界需人工核验：' + call.name);
    }
  }
  const prepared = attempts.filter((call) => ['bash', 'exec_command', 'run_command', 'shell'].includes(nameOf(call)) && isPreparation(call));
  assert.equal(prepared.length, 1, '必须只准备一次基线');
  assert.equal(attempts[0]?.id, prepared[0].id, '基线准备必须是首个工具动作');
  const completed = transcriptCalls();
  const preparation = completed.find((call) => call.id === prepared[0].id && call.result.status === 'success');
  assert.ok(preparation, '准备命令缺少成功返回');
  assert.ok(completed.some((call) => ['read', 'read_file'].includes(nameOf(call))
    && call.result.status === 'success' && call.index > preparation.resultIndex
    && actualPath(argsOf(call).file_path || argsOf(call).path || '') === actualPath('src/server.js')),
  '缺少准备后对目标源码的成功读取');
  console.log('PASS: planner-return 机械边界与交付结构通过；规划语义及后续执行尚未评分。');
}
