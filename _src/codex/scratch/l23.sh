#!/bin/bash
S=$(pwd); export CODEX_HOME=$(mktemp -d); cd $(mktemp -d)
X() { bash $S/run.sh $S/s_json.py "$@" 2>/dev/null; }
echo "== 1. exec --json：JSONL 事件类型"
X --json "看看目录" | python3 -c "
import json,sys
for l in sys.stdin:
    if l.startswith('{'): e=json.loads(l); print('  ', e['type'], e.get('item',{}).get('type',''))"
echo "== 2. --output-schema + -o：结构化最终答案"
echo '{"type":"object","properties":{"files":{"type":"integer"},"ok":{"type":"boolean"}},"required":["files","ok"],"additionalProperties":false}' > schema.json
X --output-schema schema.json -o last.txt "统计文件数" | grep '^\[mock\]'; echo "   last.txt = $(cat last.txt)"
echo "== 3. --ephemeral：不写 rollout"
n0=$(find $CODEX_HOME/sessions -name '*.jsonl' | wc -l); X --ephemeral "hi" >/dev/null
echo "   rollout 文件数：之前 $n0，之后 $(find $CODEX_HOME/sessions -name '*.jsonl' | wc -l)"
echo "== 4. app-server：一次回合的通知"
RUN="python3 $S/l23.py" bash $S/run.sh $S/s_json.py 2>/dev/null
echo "== 5. 协议规模：generate-json-schema"
codex app-server generate-json-schema --out schema_out >/dev/null 2>&1
python3 - <<'PY'
import json, glob
for name in ("ClientRequest", "ServerNotification", "ServerRequest"):
    f = glob.glob(f"schema_out/**/{name}.json", recursive=True)
    if f: print(f"   {name}: {len(json.load(open(f[0])).get('oneOf', []))} 种")
PY
