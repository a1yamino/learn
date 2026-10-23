# 剧本：跑测试（失败）→ 打补丁 → 再跑（通过）→ 申请越权 git push → 总结
FIX = """*** Begin Patch
*** Update File: calc.py
@@ def mean(xs):
-    return sum(xs) / len(xs)
+    return sum(xs) / len(xs) if xs else 0.0
*** End Patch
"""
def reply(n, body):
    last = body["input"][-1]
    if n > 1: print(f"[mock] req{n:02d} 上一步输出：{str(last.get('output'))[-70:]!r}", flush=True)
    if n == 1: return [msg("先跑测试"), call("exec_command", {"cmd": "python3 -m unittest -q 2>&1 | tail -3"}, "t1")]
    if n == 2: return [{"type": "custom_tool_call", "name": "apply_patch", "call_id": "p1", "input": FIX}]
    if n == 3: return [call("exec_command", {"cmd": "python3 -m unittest -q 2>&1 | tail -1"}, "t2")]
    if n == 4: return [call("exec_command", {"cmd": "git push origin main", "sandbox_permissions": "require_escalated",
                                             "justification": "推送修复"}, "g1")]
    return [msg("已修复 mean([]) 的除零错误，测试通过；推送被拒绝，留给人工处理。")]
