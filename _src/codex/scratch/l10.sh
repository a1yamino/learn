#!/bin/bash
S=$(pwd); export CODEX_HOME=$(mktemp -d); W=$(mktemp -d); cd $W
bash $S/run.sh $S/s_patch.py --sandbox workspace-write "修改代码" >/dev/null 2>&1
echo "== 三次 apply_patch 的结果（发回模型的 custom_tool_call_output）"
python3 - $CODEX_HOME/requests/req04.json <<'PY'
import json, sys
for it in json.load(open(sys.argv[1]))["body"]["input"]:
    if it["type"] == "custom_tool_call_output":
        o = it["output"]; o = o if isinstance(o, str) else json.dumps(o, ensure_ascii=False)
        print(" ", it["call_id"], "→", o.replace("\n", " ⏎ ")[:160])
PY
echo "== 工作目录最终状态"; ls $W; cat $W/greet.py
