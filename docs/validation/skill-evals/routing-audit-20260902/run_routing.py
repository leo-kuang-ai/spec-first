#!/usr/bin/env python3
"""Dual-engine entry-routing accuracy eval for spec-first (22 cases x 3 reps).

Engines run with cwd=spec-first repo so each host auto-loads its governance
file (claude -> CLAUDE.md, codex -> AGENTS.md) — faithful to a real session.
Ground truth derives from skills/using-spec-first/references/public-route-map.md
and the using-spec-first Fast Paths (Direct Lane cases).
"""
import concurrent.futures
import json
import os
import re
import subprocess
import sys
import time

REPO = "/Users/kuang/xiaobu/spec-first"
OUT = os.path.join(REPO, "docs/validation/skill-evals/routing-audit-20260902")

CASES = [
    # --- P: direct-intent positives ---
    {"id": "p-debug-stack", "group": "P", "expected": "spec-debug",
     "prompt": "测试 pytest -k test_transfer 挂了,报 AttributeError: 'NoneType' object has no attribute 'debit',帮我看看怎么回事。"},
    {"id": "p-debug-regression", "group": "P", "expected": "spec-debug",
     "prompt": "上个版本导出功能还是好的,这版点导出按钮没反应,帮我查一下原因。"},
    {"id": "p-code-review", "group": "P", "expected": "spec-code-review",
     "prompt": "我当前分支改了 12 个文件,帮我评审一下这次改动有没有质量风险。"},
    {"id": "p-doc-review", "group": "P", "expected": "spec-doc-review",
     "prompt": "帮我评审一下 docs/plans/export-csv-plan.md 这份方案文档写得行不行,给点意见。"},
    {"id": "p-plan", "group": "P", "expected": "spec-plan",
     "prompt": "需求已经定了:给导出功能加 CSV 格式。但怎么实现、拆几步还没想好,帮我出个技术方案。"},
    {"id": "p-work", "group": "P", "expected": "spec-work",
     "prompt": "按 docs/plans/2026-09-01-export-csv-plan.md 把这个计划执行落地。"},
    {"id": "p-compound", "group": "P", "expected": "spec-compound",
     "prompt": "这次排查出来的根因和防回归做法已经验证有效了,把这个经验沉淀下来,以后遇到类似问题能复用。"},
    {"id": "p-runtime-setup", "group": "P", "expected": "spec-runtime-setup",
     "prompt": "这台新机器上 spec-first 工作流的运行环境还没就绪,MCP 和宿主配置帮我检查配置一下。"},
    {"id": "p-brainstorm", "group": "P", "expected": "spec-brainstorm",
     "prompt": "我们想做一个面向小团队的周报工具,但目标用户和成功标准都还没想清楚,帮我捋一捋。"},
    {"id": "p-pr-feedback", "group": "P", "expected": "spec-resolve-pr-feedback",
     "prompt": "处理一下 GitHub 上 PR #142 的 review comments:本地改完、commit、push 并回复评论。"},
    {"id": "p-pov", "group": "P", "expected": "spec-pov",
     "prompt": "给我一个明确结论:我们这个项目到底该不该从 REST 迁到 GraphQL?要结合我们当前系统现状来判断。"},
    {"id": "p-fixintent", "group": "P", "expected": "spec-debug",
     "prompt": "utils/date.py 里 parseDate 函数实现得不对,时区处理是错的,帮我修一下。"},
    # --- N: confusable near-miss (expected is the non-obvious-but-correct entry) ---
    {"id": "n-review-fix", "group": "N", "expected": "spec-doc-review",
     "prompt": "评审一下 docs/plans/export-csv-plan.md 这份 PRD,发现的问题直接帮我改掉。"},
    {"id": "n-simplify", "group": "N", "expected": "spec-simplify-code",
     "prompt": "把最近这次改动里重复的样板代码清理一下,不要改变任何行为。"},
    {"id": "n-optimize", "group": "N", "expected": "spec-optimize",
     "prompt": "想通过加缓存把列表接口从 800ms 压到 200ms 以内,帮我设计并跑一个可度量的优化实验。"},
    {"id": "n-handoff", "group": "N", "expected": "spec-handoff",
     "prompt": "我今天要换电脑办公,把当前的工作进度打包成交接文档,明天在另一台机器上无缝接着干。"},
    {"id": "n-lfg", "group": "N", "expected": "spec-lfg",
     "prompt": "这个需求从规划到绿 PR 全部交给你一条龙搞定,过程中别再来问我,直接干到能合并。"},
    {"id": "n-ideate", "group": "N", "expected": "spec-ideate",
     "prompt": "给我们产品想 3 个截然不同的新功能方向,越意外越好,先发散别收敛。"},
    # --- D: Direct Lane negatives (no workflow) ---
    {"id": "d-fact", "group": "D", "expected": "direct",
     "prompt": "spec-first 这个项目 CHANGELOG 里最新的版本号是多少?"},
    {"id": "d-lookup", "group": "D", "expected": "direct",
     "prompt": "parseDate 这个函数在哪些地方被调用了?列一下位置就行。"},
    {"id": "d-context", "group": "D", "expected": "direct",
     "prompt": "我刚才在这个会话里让你做的第一件事是什么?"},
    {"id": "d-typo", "group": "D", "expected": "direct",
     "prompt": "README.md 第一段有个错别字,\"测式\"应该改成\"测试\",顺手帮我改一下。"},
]

USER_TMPL = """[路由决策任务] 只做入口选择判断,不要执行任何工具调用、不要读写或修改任何文件。

用户请求:
\"\"\"
{prompt}
\"\"\"

请依据本仓库的治理规则,为该请求选择恰好一个入口(public spec-* workflow / standalone skill / Direct Lane)。
严格按以下格式输出,共两行,不要输出其他任何内容:
ENTRY: <spec-<名称> 或 direct>
REASON: <一句话理由>"""

ENTRY_RE = re.compile(r"^ENTRY:\s*(.+)$", re.M)


def norm_entry(s):
    s = (s or "").strip().strip("`*\"'。.").lower()
    s = re.sub(r"\s*\(.*?\)\s*$", "", s)
    if s.startswith("spec-"):
        return s.split()[0]
    if "direct" in s or s in ("none", "无", "直接回答"):
        return "direct"
    return s


def call_engine(engine, prompt, timeout=240, claude_model=None):
    if engine == "claude":
        cmd = ["claude", "-p", prompt, "--output-format", "text"]
        if claude_model:
            cmd += ["--model", claude_model]
    else:
        cmd = ["codex", "exec", "--sandbox", "read-only", "--skip-git-repo-check", prompt]
    t0 = time.time()
    try:
        p = subprocess.run(cmd, cwd=REPO, capture_output=True, text=True, timeout=timeout)
        out = (p.stdout or "") + ("\n[stderr]" + p.stderr[-400:] if p.returncode != 0 and p.stderr else "")
        return out, time.time() - t0, p.returncode
    except subprocess.TimeoutExpired:
        return "[TIMEOUT]", time.time() - t0, -1


def run_one(engine, case, rep, claude_model=None, raw_dir="raw"):
    text = USER_TMPL.format(prompt=case["prompt"])
    out, dur, rc = call_engine(engine, text, claude_model=claude_model)
    m = ENTRY_RE.search(out)
    got = norm_entry(m.group(1)) if m else "[unparsed]"
    if got == "[unparsed]":  # one retry
        out2, dur2, rc2 = call_engine(engine, text, claude_model=claude_model)
        m2 = ENTRY_RE.search(out2)
        if m2:
            out, dur, rc = out2, dur + dur2, rc2
            got = norm_entry(m2.group(1))
    raw_path = os.path.join(OUT, raw_dir, f"{engine}-{case['id']}-r{rep}.txt")
    with open(raw_path, "w") as f:
        f.write(out)
    return {"engine": engine + (f":{claude_model}" if engine == "claude" and claude_model else ""),
            "case": case["id"], "group": case["group"],
            "expected": case["expected"], "got": got, "ok": got == case["expected"],
            "dur_s": round(dur, 1)}


def main():
    args = sys.argv[1:]
    engines = args[0].split(",") if args else ["claude", "codex"]
    reps = int(args[1]) if len(args) > 1 and args[1].isdigit() else 3
    rest = args[2:] if len(args) > 1 else args[1:]
    only_pilot = "pilot" in rest
    claude_model = None
    tag = ""
    if "--claude-model" in rest:
        claude_model = rest[rest.index("--claude-model") + 1]
    if "--tag" in rest:
        tag = rest[rest.index("--tag") + 1]
    raw_dir = "raw" if not tag else f"raw-{tag.lstrip('-')}"
    os.makedirs(os.path.join(OUT, raw_dir), exist_ok=True)
    cases = CASES[:2] if only_pilot else CASES
    jobs = [(e, c, r) for e in engines for c in cases for r in range(1, reps + 1)]
    records = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex:
        futs = {ex.submit(run_one, e, c, r, claude_model, raw_dir): (e, c["id"], r) for e, c, r in jobs}
        done = 0
        for fut in concurrent.futures.as_completed(futs):
            try:
                records.append(fut.result())
            except Exception as exc:
                e, cid, r = futs[fut]
                records.append({"engine": e, "case": cid, "rep": r, "got": "[error]",
                                "ok": False, "err": str(exc)[:200]})
            done += 1
            print(f"[{done}/{len(jobs)}] {records[-1].get('engine')} {records[-1]['case']} -> {records[-1]['got']}", flush=True)

    summary = {}
    for e in engines:
        ename = e + (f":{claude_model}" if e == "claude" and claude_model else "")
        recs = [r for r in records if r["engine"] == ename]
        by_group = {}
        for g in ("P", "N", "D"):
            sub = [r for r in recs if r["group"] == g]
            by_group[g] = {"n": len(sub), "correct": sum(r["ok"] for r in sub),
                           "acc": round(sum(r["ok"] for r in sub) / len(sub), 3) if sub else None}
        confusions = {}
        for r in recs:
            if not r["ok"]:
                key = f"{r['case']}: {r['expected']} -> {r['got']}"
                confusions[key] = confusions.get(key, 0) + 1
        summary[e] = {"overall_acc": round(sum(r["ok"] for r in recs) / len(recs), 3),
                      "by_group": by_group, "confusions": confusions,
                      "unparsed": sum(1 for r in recs if r["got"] == "[unparsed]"),
                      "avg_dur_s": round(sum(r["dur_s"] for r in recs) / len(recs), 1)}
    with open(os.path.join(OUT, f"results{tag}.json"), "w") as f:
        json.dump({"records": records, "summary": summary}, f, ensure_ascii=False, indent=1)
    print(json.dumps(summary, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
