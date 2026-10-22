#!/bin/bash
# rollout：会话写成 JSONL；resume 继续同一线程，fork 复制出新线程
S=$(pwd); export CODEX_HOME=$(mktemp -d); cd $(mktemp -d)
ask() { bash $S/run.sh $S/s_mem.py "$@" 2>/dev/null | tail -1; }
echo "== 1. 新会话"; ask "第一句"
F=$(ls $CODEX_HOME/sessions/*/*/*/*.jsonl); ID=$(basename $F .jsonl | grep -oE '[0-9a-f]{8}-[0-9a-f-]{27}$')
echo "   rollout 文件：sessions/…/$(basename $F)"
echo "   各行类型：$(python3 -c "import json,sys,collections;print(dict(collections.Counter(json.loads(l)['type'] for l in open(sys.argv[1]))))" $F)"
echo "== 2. exec resume --last：在同一线程继续"; ask resume --last "第二句"
echo "== 3. exec fork <id>：从第一个会话分叉出新线程"; ask fork $ID "分叉的一句"
echo "== 4. 再 resume --last：继续的是哪条线？"; ask resume --last "第三句"
echo "== rollout 文件数：$(ls $CODEX_HOME/sessions/*/*/*/*.jsonl | wc -l)"
