# 剧本：请求带 text.format（--output-schema）时回 JSON，否则先 ls 再回答
import json
def reply(n, body):
    fmt = body.get("text", {}).get("format")
    if fmt:
        print(f"[mock] text.format.type={fmt['type']} name={fmt.get('name')} strict={fmt.get('strict')}", flush=True)
        return [msg(json.dumps({"files": 0, "ok": True}))]
    if n == 1: return [msg("我先看看"), call("exec_command", {"cmd": "ls"}, "c1")]
    return [msg("空目录")]
