# app-server：一次回合中客户端收到哪些通知（按方法名计数，保持首次出现的顺序）
import os, sys, collections; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from apc import AppServer, text
a = AppServer(cwd=os.getcwd()); tid = a.start(os.getcwd())
a.request("turn/start", {"threadId": tid, "input": text("看看目录")})
seen = collections.Counter()
a.wait("turn/completed", show=lambda m: seen.update([m["method"]]))
for k, v in seen.items(): print(f"  {v:3d}  {k}")
a.close()
