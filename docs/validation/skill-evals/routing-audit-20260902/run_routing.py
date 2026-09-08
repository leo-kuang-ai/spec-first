#!/usr/bin/env python3
"""Dual-engine entry-routing accuracy eval for spec-first (22 cases x 3 reps).

Engines run with cwd=spec-first repo so each host auto-loads its governance
file (claude -> CLAUDE.md, codex -> AGENTS.md) — faithful to a real session.
Ground truth derives from skills/using-spec-first/references/public-route-map.md
and the using-spec-first Fast Paths (Direct Lane cases).
"""
import argparse
import concurrent.futures
import json
import math
import os
import re
import subprocess
import tempfile
import time

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
OUT = os.path.join(REPO, "docs/validation/skill-evals/routing-audit-20260902")
SCHEMA_VERSION = "spec-first-routing-eval/v2"

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

ANSWER_RE = re.compile(r"ENTRY:[ \t]*(spec-[a-z0-9-]+|direct)[ \t]*\r?\nREASON:[ \t]*([^\r\n]+)")

ENV_ERROR_MARKERS = ("429 too many requests", "exceeded retry limit")


def is_env_error_output(out):
    low = (out or "").lower()
    return any(marker in low for marker in ENV_ERROR_MARKERS)


def call_engine(engine, prompt, timeout=240, claude_model=None):
    t0 = time.monotonic()
    with tempfile.TemporaryDirectory(prefix="routing-final-") as scratch:
        final_path = os.path.join(scratch, "final.txt")
        if engine == "claude":
            cmd = ["claude", "-p", prompt, "--output-format", "text"]
            if claude_model:
                cmd += ["--model", claude_model]
        elif engine == "codex":
            cmd = ["codex", "exec", "--sandbox", "read-only", "--skip-git-repo-check",
                   "--output-last-message", final_path, prompt]
        else:
            raise ValueError("unsupported engine")
        try:
            p = subprocess.run(cmd, cwd=REPO, capture_output=True, text=True, timeout=timeout)
            if engine == "codex" and p.returncode == 0:
                # 最终消息缺失时不回退到可能包含提示回显的执行日志。
                out = ""
                if os.path.isfile(final_path):
                    with open(final_path, encoding="utf-8") as source:
                        out = source.read()
            else:
                out = (p.stdout or "") + ("\n[stderr]" + p.stderr if p.returncode != 0 and p.stderr else "")
            return out, time.monotonic() - t0, p.returncode
        except subprocess.TimeoutExpired as exc:
            def text(value):
                return value.decode("utf-8", errors="replace") if isinstance(value, bytes) else (value or "")
            return "[TIMEOUT]\n" + text(exc.stdout) + "\n" + text(exc.stderr), time.monotonic() - t0, -1


def classify_output(out, rc, expected):
    if rc == -1 and out.startswith("[TIMEOUT]"):
        return "timeout", "[unparsed]"
    if rc != 0:
        return ("api-error" if is_env_error_output(out) else "engine-error"), "[unparsed]"
    match = ANSWER_RE.fullmatch(out.strip())
    if match and match.group(2).strip():
        got = match.group(1)
        return ("correct" if got == expected else "wrong-answer"), got
    if is_env_error_output(out):
        return "api-error", "[unparsed]"
    return ("parse-error" if out.strip() else "empty-output"), "[unparsed]"


def run_one(engine, case, rep, claude_model=None, raw_dir="raw"):
    text = USER_TMPL.format(prompt=case["prompt"])
    attempts = []
    evidence_errors = []

    def write_raw(filename, output):
        raw_path = os.path.join(OUT, raw_dir, filename)
        relative_path = os.path.relpath(raw_path, OUT)
        try:
            with open(raw_path, "x", encoding="utf-8") as raw:
                raw.write(output)
            return relative_path
        except OSError as exc:
            evidence_errors.append({"path": relative_path, "error": type(exc).__name__})
            return None

    os.makedirs(os.path.join(OUT, raw_dir), exist_ok=True)
    for number in (1, 2):
        started = time.monotonic()
        try:
            out, dur, rc = call_engine(engine, text, claude_model=claude_model)
            status, got = classify_output(out, rc, case["expected"])
        except Exception as exc:
            out = f"[{type(exc).__name__}] {exc}"
            dur, rc = time.monotonic() - started, None
            status, got = "engine-error", "[unparsed]"
        raw_path = write_raw(f"{engine}-{case['id']}-r{rep}-a{number}.txt", out)
        attempts.append({"attempt": number, "exit_code": rc, "status": status,
                         "got": got, "dur_s": dur, "cost_usd": None,
                         "raw_path": raw_path})
        if raw_path is None:
            # 独立 raw 无法持久化时，仍在结果中保留已发生的尝试与输出。
            attempts[-1]["raw_output"] = out
        if evidence_errors or status not in ("parse-error", "empty-output"):
            break
    raw_path = write_raw(f"{engine}-{case['id']}-r{rep}.txt", out)
    if evidence_errors:
        status, got = "harness-error", "[unparsed]"
    return {"schema_version": SCHEMA_VERSION,
            "engine": engine + (f":{claude_model}" if engine == "claude" and claude_model else ""),
            "case": case["id"], "group": case["group"], "rep": rep,
            "expected": case["expected"], "got": got, "status": status,
            "ok": status == "correct", "env_error": status in ("engine-error", "api-error", "timeout", "harness-error"),
            "dur_s": round(sum(a["dur_s"] for a in attempts), 3), "cost_usd": None,
            "attempts": attempts, "raw_path": raw_path, "evidence_errors": evidence_errors}


def summarize_records(records, cases, reps):
    if any(r.get("schema_version") not in (None, SCHEMA_VERSION) for r in records):
        raise ValueError("unsupported-result-schema")
    case_index = {case["id"]: case for case in cases}
    planned = len(cases) * reps
    modern = [r for r in records if r.get("schema_version") == SCHEMA_VERSION]
    identities = set()
    engines = set()
    for record in modern:
        case_id, rep, engine = record.get("case"), record.get("rep"), record.get("engine")
        if (not isinstance(case_id, str) or case_id not in case_index
                or type(rep) is not int or not 1 <= rep <= reps
                or not isinstance(engine, str) or not engine):
            raise ValueError("invalid-result-identity: unplanned task")
        identity = (case_id, rep)
        engines.add(engine)
        if identity in identities or len(engines) != 1:
            raise ValueError("invalid-result-identity: duplicate task or mixed engines")
        identities.add(identity)
    legacy_n = len(records) - len(modern)
    attempts_known = not legacy_n and all(isinstance(r.get("attempts"), list) for r in modern)
    valid = [r for r in records if not r.get("env_error") and r.get("status") != "not-run"]
    answers = [r for r in modern if r.get("status") in ("correct", "wrong-answer")]
    correct = sum(r.get("ok") is True for r in answers)
    durations = [r["dur_s"] for r in records if isinstance(r.get("dur_s"), (int, float))
                 and not isinstance(r["dur_s"], bool) and math.isfinite(r["dur_s"]) and r["dur_s"] >= 0]

    def ratio(numerator, denominator):
        return round(numerator / denominator, 3) if denominator else None

    by_group = {}
    for group in ("P", "N", "D"):
        sub = [r for r in valid if case_index.get(r.get("case"), {}).get("group", r.get("group")) == group]
        group_planned = sum(c["group"] == group for c in cases) * reps
        by_group[group] = {"n": len(sub), "correct": sum(r.get("ok") is True for r in sub),
                           "acc": ratio(sum(r.get("ok") is True for r in sub), len(sub)),
                           "planned_n": group_planned}
    confusions = {}
    for record in valid:
        if record.get("ok") is not True:
            expected = case_index.get(record.get("case"), {}).get("expected", record.get("expected", "[unknown]"))
            key = f"{record.get('case', '[unknown]')}: {expected} -> {record.get('got', '[unparsed]')}"
            confusions[key] = confusions.get(key, 0) + 1
    statuses = {}
    for record in records:
        status = record.get("status", "legacy-unverified")
        statuses[status] = statuses.get(status, 0) + 1
    return {"overall_acc": ratio(sum(r.get("ok") is True for r in valid), len(valid)),
            "valid_n": len(valid), "env_errors": sum(bool(r.get("env_error")) for r in records),
            "by_group": by_group, "confusions": confusions,
            "unparsed": sum(r.get("got", "[unparsed]") == "[unparsed]" for r in valid),
            "avg_dur_s": ratio(sum(durations), len(records)) if len(durations) == len(records) else None,
            "planned_n": planned, "recorded_n": len(records),
            "attempted_n": sum(bool(r["attempts"]) for r in modern) if attempts_known else None,
            "attempt_n": sum(len(r["attempts"]) for r in modern) if attempts_known else None,
            "correct_n": correct if not legacy_n else None, "answer_n": len(answers) if not legacy_n else None,
            "task_success_rate": ratio(correct, planned) if not legacy_n else None,
            "answer_accuracy": ratio(correct, len(answers)) if not legacy_n else None,
            "missing_n": max(0, planned - len(records)), "status_counts": statuses,
            "not_run_n": statuses.get("not-run", 0) + max(0, planned - len(records)),
            "legacy_n": legacy_n, "compatibility_status": "legacy-unverified" if legacy_n else "current",
            "total_cost_usd": None}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("engines", nargs="?", default="claude,codex")
    parser.add_argument("reps", nargs="?", default="3")
    parser.add_argument("mode", nargs="?", choices=["pilot"])
    parser.add_argument("--claude-model")
    parser.add_argument("--tag", default="")
    args = parser.parse_args()
    if args.reps == "pilot" and args.mode is None:
        args.reps, args.mode = "3", "pilot"
    try:
        reps = int(args.reps)
    except ValueError:
        parser.error("reps must be a positive integer")
    engines, claude_model, tag = args.engines.split(","), args.claude_model, args.tag
    if reps < 1 or len(set(engines)) != len(engines) or any(e not in ("claude", "codex") for e in engines):
        parser.error("engines must be distinct claude/codex values and reps must be positive")
    if tag and not re.fullmatch(r"[a-zA-Z0-9_-]+", tag):
        parser.error("tag must contain only letters, digits, underscores or hyphens")
    runs_dir = os.path.join(OUT, "runs")
    os.makedirs(runs_dir, exist_ok=True)
    run_dir = tempfile.mkdtemp(prefix=time.strftime("%Y%m%dT%H%M%SZ-", time.gmtime()), dir=runs_dir)
    raw_dir = "raw" if not tag else f"raw-{tag.lstrip('-')}"
    raw_dir = os.path.relpath(os.path.join(run_dir, raw_dir), OUT)
    cases = CASES[:2] if args.mode == "pilot" else CASES
    jobs = [(e, c, r) for e in engines for c in cases for r in range(1, reps + 1)]
    records = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex:
        futs = {ex.submit(run_one, e, c, r, claude_model, raw_dir): (e, c, r) for e, c, r in jobs}
        done = 0
        for fut in concurrent.futures.as_completed(futs):
            try:
                records.append(fut.result())
            except Exception as exc:
                e, case, r = futs[fut]
                records.append({"schema_version": SCHEMA_VERSION,
                                "engine": e + (f":{claude_model}" if e == "claude" and claude_model else ""),
                                "case": case["id"], "group": case["group"], "expected": case["expected"],
                                "rep": r, "got": "[unparsed]", "status": "harness-error", "attempts": None,
                                "ok": False, "env_error": True, "dur_s": None, "err": type(exc).__name__})
            done += 1
            print(f"[{done}/{len(jobs)}] {records[-1].get('engine')} {records[-1]['case']} -> {records[-1]['got']}", flush=True)

    records.sort(key=lambda r: (r["engine"], r["case"], r["rep"]))
    summary = {}
    for e in engines:
        ename = e + (f":{claude_model}" if e == "claude" and claude_model else "")
        recs = [r for r in records if r["engine"] == ename]
        summary[e] = summarize_records(recs, cases, reps)
    result_path = os.path.join(run_dir, f"results{tag}.json")
    with open(result_path, "x", encoding="utf-8") as f:
        json.dump({"schema_version": SCHEMA_VERSION, "records": records, "summary": summary,
                   "raw_path_base": OUT, "run_status": "degraded" if any(r["env_error"] for r in records) else "completed"},
                  f, ensure_ascii=False, indent=1)
    print(f"Results: {result_path}")
    print(json.dumps(summary, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
