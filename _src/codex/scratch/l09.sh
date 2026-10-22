#!/bin/bash
S=$(pwd); export CODEX_HOME=$(mktemp -d); cd $(mktemp -d)
bash $S/run.sh $S/s_exec.py "演示 unified exec" >/dev/null 2>&1
python3 - $CODEX_HOME/requests <<'PY'
import json, sys
inp = json.load(open(sys.argv[1] + "/req04.json"))["body"]["input"]
for it in inp:
    if it["type"] == "function_call":
        print(">>", it["name"], it["arguments"])
    if it["type"] == "function_call_output":
        out = it["output"].splitlines()
        print("\n".join("   " + l for l in (out if len(out) < 14 else out[:9] + ["   …"] + out[-3:])))
PY
