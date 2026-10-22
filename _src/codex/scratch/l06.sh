#!/bin/bash
# run_turn 何时继续、何时结束：看请求次数与最后一次请求的末尾条目
S=$(pwd)
for scen in a b c; do
  export CODEX_HOME=$(mktemp -d); cd $(mktemp -d)
  echo "== 场景 $scen"
  SCEN=$scen bash $S/run.sh $S/s_loop.py "开始" --json 2>/dev/null | python3 -c "
import sys, json
for l in sys.stdin:
    e = json.loads(l); it = e.get('item', {})
    if e['type'] == 'item.completed': print('  item.completed', it['type'], it.get('text') or it.get('command'))
"
  echo "  请求次数：$(ls $CODEX_HOME/requests | wc -l)"
  python3 $S/show.py $CODEX_HOME/requests 50 | tail -n +2 | tail -4 | sed 's/^/  /'
done
