# 剧本：在 namespace 工具里找到 MCP 服务器 mini 的 add 并调用
def reply(n, body):
    if n == 1:
        ns = [t for t in body.get("tools", []) if t.get("type") == "namespace" and t["name"].startswith("mcp__")]
        for t in ns: print("[mock] namespace", t["name"], "→", [x["name"] for x in t["tools"]], flush=True)
        c = call("add", {"a": 2, "b": 40}, "c1"); c["namespace"] = "mcp__mini"
        return [c]
    out = [i["output"] for i in body["input"] if i.get("type") == "function_call_output"]
    return [msg(f"MCP 返回：{out[-1]}")]
