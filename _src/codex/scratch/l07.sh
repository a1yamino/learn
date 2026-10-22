#!/bin/bash
# 工具规格与路由：模型看到的工具，以及错误调用得到的回应
S=$(pwd); export CODEX_HOME=$(mktemp -d); cd $(mktemp -d)
bash $S/run.sh $S/s_tools.py "试试工具" >/dev/null 2>&1
python3 - $CODEX_HOME/requests <<'PY'
import json, sys
b = json.load(open(sys.argv[1] + "/req01.json"))["body"]
print("parallel_tool_calls =", b["parallel_tool_calls"], " tool_choice =", b["tool_choice"])
print("== 模型看到的工具")
for t in b["tools"]:
    name = t.get("name", t["type"]); kind = t["type"]
    params = list((t.get("parameters") or {}).get("properties", {}).keys())
    fmt = t.get("format", {}).get("syntax", "") if kind == "custom" else ""
    print(f"  {kind:9} {name:18} {fmt or params}")
print("== 三个调用得到的输出")
for it in json.load(open(sys.argv[1] + "/req02.json"))["body"]["input"]:
    if it["type"] == "function_call_output":
        print(" ", it["call_id"], "→", it["output"].replace("\n", " ⏎ ")[:110])
PY
