# 剧本：apply_patch（自由格式工具）新增、修改、删除文件，再故意给一个对不上的补丁
def patch(cid, text):
    return {"type": "custom_tool_call", "name": "apply_patch", "call_id": cid, "input": text}
P1 = """*** Begin Patch
*** Add File: greet.py
+def greet(name):
+    return "hello " + name
*** Add File: old.txt
+obsolete
*** End Patch
"""
P2 = """*** Begin Patch
*** Update File: greet.py
@@ def greet(name):
-    return "hello " + name
+    return f"你好，{name}！"
*** Delete File: old.txt
*** End Patch
"""
P3 = """*** Begin Patch
*** Update File: greet.py
@@
-    return "this line does not exist"
+    return None
*** End Patch
"""
def reply(n, body):
    if n <= 3: return [patch(f"p{n}", [P1, P2, P3][n - 1])]
    return [msg("完成")]
