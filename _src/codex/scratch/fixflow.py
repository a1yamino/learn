# fixflow.py：一个可审计的修复流程（app-server 客户端）
#  - 沙箱 workspace-write + 审批 on-request：越权操作必须经过我们
#  - 审批策略：只放行白名单前缀的命令，其余一律拒绝
#  - 审计：每个完成的条目、每次审批决定都追加到 audit.jsonl
import json, os, re, shlex, sys, subprocess; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from apc import AppServer, text
ALLOW = ("python3 -m unittest",)
audit = open("audit.jsonl", "a")
def log(kind, **kw): audit.write(json.dumps({"kind": kind, **kw}, ensure_ascii=False) + "\n"); audit.flush()

a = AppServer(cwd=os.getcwd())
def on_request(method, params):
    cmd = params.get("command") or ""
    m = re.match(r"^\S*bash -lc (.*)$", cmd)          # 审批里的命令带着 shell 包装：/bin/bash -lc '…'
    inner = shlex.split(m.group(1))[0] if m else cmd
    ok = inner.startswith(ALLOW)
    decision = "accept" if ok else "decline"
    log("approval", method=method, command=inner, reason=params.get("reason"), decision=decision)
    print(f"  审批 {inner!r} 理由={params.get('reason')!r} → {decision}")
    return {"decision": decision}
a.on_request = on_request
a.request("initialize", {"clientInfo": {"name": "fixflow", "title": None, "version": "0"}}); a.notify("initialized")
tid = a.request("thread/start", {"cwd": os.getcwd(), "approvalPolicy": "on-request", "sandbox": "workspace-write"})["thread"]["id"]
a.request("turn/start", {"threadId": tid, "input": text("修复失败的测试")})
def show(m):
    if m["method"] != "item/completed": return
    it = m["params"]["item"]; t = it["type"]
    if t == "commandExecution":
        log("command", command=it["command"], exit=it.get("exitCode"), status=it["status"])
        print(f"  命令 {it['command'][:48]!r} status={it['status']} exit={it.get('exitCode')}")
    elif t == "fileChange":
        log("patch", files=[c["path"] for c in it["changes"]], status=it["status"])
        print(f"  补丁 {[os.path.basename(c['path']) for c in it['changes']]} status={it['status']}")
    elif t == "agentMessage":
        log("message", text=it["text"]); print(f"  消息 {it['text']}")
a.wait("turn/completed", show=show); a.close()
print("== 审计摘要", dict(__import__("collections").Counter(json.loads(l)["kind"] for l in open("audit.jsonl"))))
print(subprocess.run(["git", "diff", "--stat"], capture_output=True, text=True).stdout.rstrip())
