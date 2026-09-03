#!/usr/bin/env python3
"""Static audit of spec-first skills: frontmatter compliance, trigger signals,
economy, cross-skill description collision, and security pattern scan.

Deterministic; no LLM. Read-only over skills/ except the audit output dir.
"""
import json
import os
import re
import sys
from difflib import SequenceMatcher

REPO = os.environ.get("SPEC_FIRST_REPO", "/Users/kuang/xiaobu/spec-first")
OUT = os.path.join(REPO, "docs/validation/skill-evals/routing-audit-20260902")

STOP = set("""use when for the a an to or and of in on with not is are be do dont
do user users it its if then this that these those you your ask asking asks need
needs needed also only into from at as by want wants into before after
使用 当 需要 用于 不要 不 用户 请求 进行 可以 一个""".split())

SECURITY_PATTERNS = [
    ("pipe-to-shell", r"(curl|wget)\b[^|\n]{0,140}\|\s*(sudo\s+)?(ba|z)?sh\b"),
    ("base64-decode", r"base64\s+(-D|-d|--decode)"),
    ("injection-phrase", r"ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts)"),
    ("credential-assign", r"(API_KEY|TOKEN|SECRET|PASSWORD)[A-Z_]*\s*=\s*['\"][A-Za-z0-9_\-]{16,}['\"]"),
    ("cred-path-access", r"~/\.(ssh|aws|netrc|gnupg|config/gcloud)"),
    ("destructive-rm", r"rm\s+-rf?\s+(/|~)(\s|$)"),
    ("force-push", r"git\s+push\s+[^;\n]*--force(?!\s*--force-with-lease)"),
    ("hook-bypass", r"--no-verify"),
    ("exfil-endpoint", r"(webhook\.site|requestbin|ngrok\.io|paste\.rs|transfer\.sh|ix\.io)"),
    ("env-harvest", r"printenv|env\s*\|\s*(grep|sort|curl)"),
]


def parse_frontmatter(path):
    text = open(path, encoding="utf-8").read()
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not m:
        return None, text
    fm_raw = m.group(1)
    fm = {}
    for line in fm_raw.splitlines():
        km = re.match(r"^([A-Za-z0-9_-]+):\s*(.*)$", line)
        if km:
            fm[km.group(1)] = km.group(2).strip().strip("'\"")
    return fm, text


def tokens(s):
    return {t for t in re.split(r"[^a-z0-9\u4e00-\u9fff]+", s.lower()) if t and t not in STOP and len(t) > 1}


def main():
    names = [l.strip() for l in open(os.path.join(OUT, "registry-skill-names.txt")) if l.strip()]
    skills = {}
    for n in names:
        p = os.path.join(REPO, "skills", n, "SKILL.md")
        fm, text = parse_frontmatter(p)
        body = text.split("\n---\n", 2)[-1] if text.startswith("---") else text
        refs = sorted(os.listdir(os.path.join(REPO, "skills", n, "references"))) if os.path.isdir(os.path.join(REPO, "skills", n, "references")) else []
        scripts = sorted(os.listdir(os.path.join(REPO, "skills", n, "scripts"))) if os.path.isdir(os.path.join(REPO, "skills", n, "scripts")) else []
        desc = fm.get("description", "") if fm else ""
        sec_hits = []
        for label, pat in SECURITY_PATTERNS:
            for m in re.finditer(pat, text, re.I):
                line = text[: m.start()].count("\n") + 1
                sec_hits.append({"pattern": label, "line": line, "snippet": text[max(0, m.start() - 40): m.end() + 40].replace("\n", " ")[:100]})
        urls = sorted({mm.group(1) for mm in re.finditer(r"https?://([a-zA-Z0-9.-]+)", text)})
        skills[n] = {
            "name": fm.get("name") if fm else None,
            "name_matches_dir": (fm.get("name") == n) if fm else False,
            "has_frontmatter": fm is not None,
            "desc_len_chars": len(desc),
            "desc_has_use_signal": bool(re.search(r"[Uu]se (when|for|it|this)|收到|当用户|用于", desc)),
            "desc_has_exclude_signal": bool(re.search(r"[Nn]ot for|[Dd]o not use|不要|不用于|[Nn]ever use|route those", desc)),
            "has_argument_hint": "argument-hint" in fm,
            "body_lines": body.count("\n") + 1,
            "chars_total": len(text),
            "est_tokens": int(len(text) / 3.2),
            "has_references": bool(refs),
            "has_scripts": bool(scripts),
            "n_reference_files": len(refs),
            "security_hits": sec_hits,
            "external_domains": urls,
        }

    # Cross-skill description collision detection
    sim = []
    items = [(n, skills[n]["desc_len_chars"] and skills[n]) for n in names]
    descs = {n: re.sub(r"[Uu]se when.*$", "", "", ) for n in []}  # placeholder no-op
    for i in range(len(names)):
        for j in range(i + 1, len(names)):
            a, b = names[i], names[j]
            ta, tb = tokens(skills[a].get("desc", "") or ""), tokens(skills[b].get("desc", "") or "")
            desc_a = load_desc(a)
            desc_b = load_desc(b)
            ta, tb = tokens(desc_a), tokens(desc_b)
            jac = len(ta & tb) / len(ta | tb) if ta and tb else 0.0
            ratio = SequenceMatcher(None, desc_a.lower(), desc_b.lower()).ratio()
            if jac >= 0.35 or ratio >= 0.45:
                sim.append({"a": a, "b": b, "jaccard": round(jac, 3), "seq_ratio": round(ratio, 3),
                            "score": round(jac * 0.6 + ratio * 0.4, 3)})
    sim.sort(key=lambda x: -x["score"])

    all_sec = {n: s["security_hits"] for n, s in skills.items() if s["security_hits"]}
    domain_count = {}
    for n, s in skills.items():
        for d in s["external_domains"]:
            domain_count.setdefault(d, []).append(n)

    result = {"n_skills": len(names), "skills": skills, "collision_pairs": sim[:25],
              "security_flagged": all_sec, "external_domains": {k: v for k, v in sorted(domain_count.items(), key=lambda kv: -len(kv[1]))}}
    with open(os.path.join(OUT, "static_audit.json"), "w") as f:
        json.dump(result, f, ensure_ascii=False, indent=1)

    # Console summary
    no_fm = [n for n in names if not skills[n]["has_frontmatter"]]
    bad_name = [n for n in names if not skills[n]["name_matches_dir"]]
    no_use = [n for n in names if not skills[n]["desc_has_use_signal"]]
    no_excl = [n for n in names if not skills[n]["desc_has_exclude_signal"]]
    big = sorted(names, key=lambda n: -skills[n]["body_lines"])[:8]
    print(f"skills={len(names)} no_frontmatter={no_fm} name_mismatch={bad_name}")
    print(f"desc_missing_use_signal={len(no_use)} {no_use}")
    print(f"desc_missing_exclude_signal={len(no_excl)} {no_excl}")
    print("top_body_lines:", [(n, skills[n]['body_lines']) for n in big])
    print(f"collision_pairs={len(sim)}; top:")
    for p in sim[:12]:
        print(f"  {p['a']} ~ {p['b']}  jac={p['jaccard']} seq={p['seq_ratio']}")
    print(f"security_flagged_skills={len(all_sec)}: {list(all_sec)}")
    print("top_external_domains:", {k: len(v) for k, v in list(sorted(domain_count.items(), key=lambda kv: -len(kv[1])))[:10]})


_DESC_CACHE = {}


def load_desc(n):
    if n not in _DESC_CACHE:
        fm, _ = parse_frontmatter(os.path.join(REPO, "skills", n, "SKILL.md"))
        _DESC_CACHE[n] = (fm or {}).get("description", "")
    return _DESC_CACHE[n]


if __name__ == "__main__":
    sys.exit(main())
