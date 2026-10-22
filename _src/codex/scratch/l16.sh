#!/bin/bash
# 自动压缩：把阈值调到 1500 token（模拟服务端每次报告 1000×n 个输入 token）
S=$(pwd); export CODEX_HOME=$(mktemp -d); cd $(mktemp -d)
EXTRA_CONFIG='model_auto_compact_token_limit = 1500' bash $S/run.sh $S/s_compact.py --json "数文件" 2>/dev/null \
 | python3 -c "
import json,sys
for l in sys.stdin:
    e=json.loads(l); it=e.get('item',{})
    if e['type']=='item.completed': print('  事件', it.get('type'), (it.get('command') or it.get('text') or '')[:40])"
python3 $S/show.py $CODEX_HOME/requests 60
echo "== rollout 中的 compacted 行：$(grep -c '"type":"compacted"' $CODEX_HOME/sessions/*/*/*/*.jsonl)"
