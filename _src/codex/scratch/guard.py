# PreToolUse 钩子：stdin 收到事件 JSON；命令中含 rm 就以退出码 2 阻止（原因写到 stderr）
import json, sys
e = json.load(sys.stdin)
cmd = json.dumps(e.get("tool_input"), ensure_ascii=False)
print(f"[hook] {e['hook_event_name']} tool_name={e['tool_name']} input={cmd}", file=open("/tmp/hook.log", "a"))
if "rm " in cmd:
    print("禁止删除文件：请改用 git rm 并说明理由", file=sys.stderr); sys.exit(2)
