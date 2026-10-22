# 最小的 stdio MCP 服务端：一个 add 工具（JSON-RPC，每行一条消息）
import json, os, sys
READONLY = "--readonly" in sys.argv  # 是否声明 readOnlyHint
def send(o): sys.stdout.write(json.dumps(o) + "\n"); sys.stdout.flush()
for line in sys.stdin:
    m = json.loads(line); mid = m.get("id"); meth = m.get("method")
    if meth == "initialize":
        send({"jsonrpc": "2.0", "id": mid, "result": {"protocolVersion": m["params"]["protocolVersion"],
              "capabilities": {"tools": {}}, "serverInfo": {"name": "mini", "version": "0.1"}}})
    elif meth == "tools/list":
        send({"jsonrpc": "2.0", "id": mid, "result": {"tools": [{"name": "add", "description": "两数相加",
              "inputSchema": {"type": "object", "properties": {"a": {"type": "number"}, "b": {"type": "number"}}, "required": ["a", "b"]},
              **({"annotations": {"readOnlyHint": True}} if READONLY else {})}]}})
    elif meth == "tools/call":
        a = m["params"]["arguments"]; print(f"[mini] add{a}", file=sys.stderr)
        send({"jsonrpc": "2.0", "id": mid, "result": {"content": [{"type": "text", "text": str(a["a"] + a["b"])}]}})
    elif mid is not None:
        send({"jsonrpc": "2.0", "id": mid, "result": {}})
