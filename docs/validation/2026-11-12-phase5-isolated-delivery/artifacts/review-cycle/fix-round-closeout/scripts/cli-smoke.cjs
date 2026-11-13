// CLI 冒烟（计划 Verification Contract）：证明 `node src/server.js` 入口在接缝改动后
// 仍在 3000 端口正常服务。
// 降级契约：
//   exit 76 —— 3000 端口已被既有进程占用（此前尝试遗留的孤儿实例）。此时无法证明
//               「本次启动的 CLI」，显式降级，不把残留实例的响应当作本次证据。
//   exit 77 —— 请求期间 spawn 的子进程提前退出（占用的迟发检测，兜底）。
const { spawn } = require("child_process");

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function portResponds() {
  try { await fetch("http://localhost:3000/entries"); return true; } catch { return false; }
}

async function main() {
  if (await portResponds()) {
    console.error("DEGRADED (exit 76): port 3000 already has a listener — a leftover `node src/server.js` from an earlier attempt is serving. This run cannot freshly prove the spawned CLI entry; clean up the leftover process first.");
    return 76;
  }

  const child = spawn(process.execPath, ["src/server.js"], { stdio: ["ignore", "pipe", "pipe"] });
  let stderr = "";
  let childExited = false;
  child.stderr.on("data", (d) => { stderr += d; });
  child.on("exit", () => { childExited = true; });
  try {
    let up = false;
    for (let i = 0; i < 100 && !up; i++) {
      up = await portResponds();
      if (!up) await wait(50);
    }
    if (!up) throw new Error(`server did not come up on 3000; child stderr: ${stderr.trim()}`);

    const results = [];
    const post = await fetch("http://localhost:3000/entries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 10, note: "smoke" }),
    });
    const postBody = await post.text();
    results.push(["POST /entries", post.status === 200 && postBody === "ok", `status=${post.status} body=${JSON.stringify(postBody)}`]);

    const one = await fetch("http://localhost:3000/entries/1");
    const oneBody = await one.text();
    let oneOk = false;
    try { oneOk = one.status === 200 && one.headers.get("content-type") === "application/json" && JSON.parse(oneBody).id === 1; } catch {}
    results.push(["GET /entries/1", oneOk, `status=${one.status} content-type=${one.headers.get("content-type")} body=${JSON.stringify(oneBody)}`]);

    const none = await fetch("http://localhost:3000/entries/999");
    const noneBody = await none.text();
    results.push(["GET /entries/999", none.status === 404 && noneBody === "not found", `status=${none.status} body=${JSON.stringify(noneBody)}`]);

    for (const [name, ok, detail] of results) console.log(`${ok ? "PASS" : "FAIL"} ${name} — ${detail}`);

    // 迟发兜底：等待子进程可能的 EADDRINUSE 退出落地，避免竞态误判
    await wait(300);
    if (childExited) {
      console.error("DEGRADED (exit 77): spawned CLI child exited early — port 3000 was served by a pre-existing process, not this run's `node src/server.js`. Child stderr: " + stderr.trim());
      return 77;
    }
    return results.every(([, ok]) => ok) ? 0 : 1;
  } finally {
    child.kill("SIGTERM");
  }
}

main().then((code) => { process.exit(code); }).catch((err) => { console.error("FAIL:", err.message); process.exit(1); });
