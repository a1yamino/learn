#!/bin/bash
# 一次 turn：exec --json 的事件流，以及两次模型请求的 input 对比
export CODEX_HOME=$(mktemp -d); S=$(cd "$(dirname "$0")" && pwd)
cd "$(mktemp -d)"
echo "== codex exec --json 的事件（JSONL）"
bash $S/run.sh $S/s_hello.py --json "打个招呼" 2>/dev/null | python3 -c "import sys;[print(l.rstrip()[:150]) for l in sys.stdin]"
echo; echo "== 假服务器收到的两次请求"
python3 $S/show.py $CODEX_HOME/requests
