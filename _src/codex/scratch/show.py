#!/usr/bin/env python3
"""show.py <requests 目录>：概览每次请求的 input 条目（类型/角色/摘要）与工具列表"""
import json, sys, glob
for f in sorted(glob.glob(sys.argv[1] + "/req*.json")):
    b = json.load(open(f))["body"]
    print(f"== {f.split('/')[-1]}  工具 {len(b.get('tools', []))} 个，input {len(b['input'])} 条")
    for it in b["input"]:
        t = it.get("type"); role = it.get("role", "")
        if t == "message":
            text = " ".join(c.get("text", "") for c in it["content"])
        elif t == "function_call":
            text = f"{it['name']}({it['arguments']})"
        elif t in ("function_call_output", "custom_tool_call_output"):
            o = it["output"]; text = o if isinstance(o, str) else json.dumps(o, ensure_ascii=False)
        elif t == "custom_tool_call":
            text = f"{it['name']}: {it['input']}"
        else:
            text = json.dumps(it, ensure_ascii=False)
        print(f"  {t:22} {role:9} {text.replace(chr(10), ' ⏎ ')[:int(sys.argv[2]) if len(sys.argv) > 2 else 70]}")
