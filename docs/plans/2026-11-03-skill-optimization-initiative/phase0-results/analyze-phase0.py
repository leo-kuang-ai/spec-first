#!/usr/bin/env python3
"""Phase 0 确定性统计：从 task-flow-traces/*.yaml 聚合阻力点与指标。

脚本只做机械聚合（事实层）；语义归因判断在各 trace 中由执行者给出，
本脚本不产生新判断。输出 JSON 到 stdout。
"""
import glob
import json
import sys
from collections import defaultdict

import yaml

TRACE_DIR = sys.argv[1] if len(sys.argv) > 1 else "phase0-results/task-flow-traces"
# 可选：--compare <baseline.json> 输出与基线统计的增量对比（行为验证阶段用）
BASELINE = None
if "--compare" in sys.argv:
    i = sys.argv.index("--compare")
    with open(sys.argv[i + 1]) as f:
        BASELINE = json.load(f)
    sys.argv.pop(i + 1)
    sys.argv.pop(i)
    TRACE_DIR = sys.argv[1] if len(sys.argv) > 1 else TRACE_DIR
# 只统计正式任务追踪（试点 pilot-task-01.yaml 与 task-01.yaml 同内容，排除避免双计）
FILES = sorted(
    f for f in glob.glob(f"{TRACE_DIR}/task-*.yaml")
)

def _parse_rate(s):
    a, b = s.split("/")
    return int(a)

def main():
    tasks = []
    for path in FILES:
        with open(path) as f:
            d = yaml.safe_load(f)
        d["_file"] = path.split("/")[-1]
        tasks.append(d)

    by_type = defaultdict(float)
    by_attr = defaultdict(float)
    by_sev = defaultdict(float)
    type_task_incidence = defaultdict(set)
    layer3 = {"correct": 0, "rework": 0, "intervention_known": 0, "intervention_sum": 0}
    layer2_any = defaultdict(int)
    total_fp = 0
    per_task = []

    for t in tasks:
        fps = []
        for stage in t.get("workflow", []):
            fps.extend(stage.get("friction_points", []))
        n = len(fps)
        total_fp += n
        for fp in fps:
            by_type[fp["type"]] += 1
            by_sev[fp.get("severity", "?")] += 1
            type_task_incidence[fp["type"]].add(t["task_id"])
            for k, v in fp.get("attribution", {}).items() if isinstance(fp.get("attribution"), dict) else []:
                pass  # attribution 是文本，不在此拆
        fs = t.get("friction_summary", {})
        # 计数一致性校验
        declared = fs.get("total")
        if declared != n:
            print(f"ERROR: {t['_file']} friction total {declared} != 实际 {n}", file=sys.stderr)
            sys.exit(1)
        for k, v in fs.get("by_type", {}).items():
            by_type[k] += 0  # 已在上面按条目计
        for k, v in fs.get("by_attribution", {}).items():
            by_attr[k] += float(v)
        l3 = t.get("layer_3_metrics", {})
        if l3.get("端到端正确"):
            layer3["correct"] += 1
        if l3.get("端到端返工"):
            layer3["rework"] += 1
        iv = l3.get("用户介入次数")
        if isinstance(iv, (int, float)):
            layer3["intervention_known"] += 1
            layer3["intervention_sum"] += int(iv)
        for k, v in t.get("layer_2_metrics", {}).items():
            if v:
                layer2_any[k] += 1
        per_task.append({
            "task": t["task_id"],
            "type": t["task_type"],
            "friction": n,
            "rework": t.get("summary", {}).get("rework_count"),
            "correct": l3.get("端到端正确"),
        })

    N = len(tasks)
    result = {
        "n_tasks": N,
        "total_friction_points": total_fp,
        "friction_by_type": dict(by_type),
        "friction_by_severity": dict(by_sev),
        "friction_by_attribution": dict(by_attr),
        "task_incidence_by_type": {k: f"{len(v)}/{N}" for k, v in type_task_incidence.items()},
        "layer3": {
            "correct_rate": f"{layer3['correct']}/{N}",
            "rework_task_rate": f"{layer3['rework']}/{N}",
            "rework_events_total": sum(t["rework"] or 0 for t in per_task),
            "user_intervention_measurable": f"{layer3['intervention_known']}/{N}",
            "user_intervention_sum": layer3["intervention_sum"],
        },
        "layer2_affected_tasks": dict(layer2_any),
        "per_task": per_task,
    }
    if BASELINE is not None:
        def rate(x, n):
            return (x / n) if n else 0.0
        n0, n1 = BASELINE["n_tasks"], result["n_tasks"]
        cmp_result = {
            "baseline_n": n0,
            "current_n": n1,
            "rework_task_rate": {
                "baseline": rate(BASELINE["layer3"]["rework_task_rate_parsed"] if "rework_task_rate_parsed" in BASELINE["layer3"] else _parse_rate(BASELINE["layer3"]["rework_task_rate"]), n0),
                "current": rate(_parse_rate(result["layer3"]["rework_task_rate"]), n1),
            },
            "rework_events": {"baseline": BASELINE["layer3"]["rework_events_total"], "current": result["layer3"]["rework_events_total"]},
            "mechanism_activation": result.get("mechanism_activation", {}),
        }
        print("--- compare ---")
        print(json.dumps(cmp_result, ensure_ascii=False, indent=2))
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
