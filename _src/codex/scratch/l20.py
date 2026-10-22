# /goal：设置目标后，线程空闲时 Codex 自己开启“继续”回合，直到模型调用 update_goal(complete)
import os, sys, time; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from apc import AppServer
a = AppServer(cwd=os.getcwd()); tid = a.start(os.getcwd())
g = a.request("thread/goal/set", {"threadId": tid, "objective": "把 step1..step3 写进 log.txt", "origin": "user"})["goal"]
print("thread/goal/set →", {k: g[k] for k in ("status", "tokensUsed", "tokenBudget")})
turns = 0
def show(m):
    global turns
    p = m.get("params", {})
    if m["method"] == "turn/started": turns += 1; print(f"  turn/started #{turns}（没有任何用户输入）")
    if m["method"] == "thread/goal/updated": print("  thread/goal/updated → status =", p["goal"]["status"])
    if m["method"] == "item/completed" and p["item"]["type"] == "agentMessage": print("   ", p["item"]["text"])
while True:
    p = a.wait("thread/goal/updated", show=show, timeout=60)
    if p["goal"]["status"] != "active": break
time.sleep(1)
print("thread/goal/get →", a.request("thread/goal/get", {"threadId": tid})["goal"]["status"])
print("log.txt:", open("log.txt").read().split())
a.close()
