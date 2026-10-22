# /plan 与 update_plan：同一个线程，先默认模式、再 Plan 模式各跑一个回合
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from apc import AppServer, text
a = AppServer(cwd=os.getcwd())
a.request("initialize", {"clientInfo": {"name": "course", "title": None, "version": "0"},
                         "capabilities": {"experimentalApi": True}}); a.notify("initialized")
modes = a.request("collaborationMode/list", {})["data"]
print("collaborationMode/list：", [(m["name"], m["mode"]) for m in modes])
tid = a.request("thread/start", {"cwd": os.getcwd()})["thread"]["id"]
def show(m):
    p = m.get("params", {})
    if m["method"] == "turn/plan/updated": print("  turn/plan/updated：", [(s["step"], s["status"]) for s in p["plan"]])
    if m["method"] == "item/completed" and p["item"]["type"] in ("plan", "agentMessage"):
        print(f"  item {p['item']['type']}：{p['item']['text']!r}")
for mode in ("default", "plan"):
    print(f"== 回合：mode={mode}")
    a.request("turn/start", {"threadId": tid, "input": text("修一下 parse()"), "collaborationMode":
              {"mode": mode, "settings": {"model": "gpt-5.5", "reasoning_effort": None, "developer_instructions": None}}})
    a.wait("turn/completed", show=show)
a.close()
