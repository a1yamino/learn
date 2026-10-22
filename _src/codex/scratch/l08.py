# 转向与中断：用 app-server 在 turn 运行中插话、再中断另一个 turn
import os, sys, time, json; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from apc import AppServer, text
a = AppServer(cwd=os.getcwd()); tid = a.start(os.getcwd())
def show(m):
    p = m.get("params", {}); it = p.get("item", {})
    if m["method"] in ("turn/started", "turn/completed"):
        print(f"  {m['method']:16} status={p['turn']['status']}")
    elif m["method"] == "item/completed" and it.get("type") in ("commandExecution", "agentMessage", "userMessage"):
        desc = it.get("text") or it.get("command") or json.dumps(it.get("content"), ensure_ascii=False)[:60]
        print(f"  item/completed   {it['type']}: {desc}")

print("== 1. 转向：慢命令运行时插入一句话")
turn = a.request("turn/start", {"threadId": tid, "input": text("第一个任务")})["turn"]["id"]
time.sleep(0.8)
r = a.request("turn/steer", {"threadId": tid, "input": text("顺便也看看 README"), "expectedTurnId": turn})
print("  turn/steer 返回同一个 turn：", r["turnId"] == turn)
a.wait("turn/completed", show=show)

print("== 2. 中断：慢命令运行时取消 turn")
turn = a.request("turn/start", {"threadId": tid, "input": text("第二个任务")})["turn"]["id"]
time.sleep(0.8)
a.request("turn/interrupt", {"threadId": tid, "turnId": turn})
a.wait("turn/completed", show=show)
print("== 3. 中断之后再发一条消息")
a.request("turn/start", {"threadId": tid, "input": text("第三个任务")})
a.wait("turn/completed", show=show)
a.close()
