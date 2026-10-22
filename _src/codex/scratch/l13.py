# 审批：app-server 把审批请求发给客户端，由我们（扮演用户）决定
import os, sys, json; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from apc import AppServer, text
a = AppServer(cwd=os.getcwd())
answers = iter(["decline", "accept"])
def on_request(method, params):
    decision = next(answers)
    print(f"  ← 审批请求 {method}: {params.get('command')}  理由={params.get('reason')!r}  → 我们回答 {decision}")
    return {"decision": decision}
a.on_request = on_request
a.request("initialize", {"clientInfo": {"name": "course", "title": None, "version": "0"}}); a.notify("initialized")
tid = a.request("thread/start", {"cwd": os.getcwd(), "approvalPolicy": "on-request", "sandbox": "workspace-write"})["thread"]["id"]
a.request("turn/start", {"threadId": tid, "input": text("干活")})
def show(m):
    it = m.get("params", {}).get("item", {})
    if m["method"] == "item/completed" and it.get("type") == "commandExecution":
        print(f"  命令 {it['command']!r:44} status={it['status']} exit={it.get('exitCode')}")
a.wait("turn/completed", show=show); a.close()
