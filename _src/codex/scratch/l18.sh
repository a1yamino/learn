#!/bin/bash
# 在伪终端里驱动真实的 codex TUI：看斜杠命令弹窗、过滤与 /init 的效果
S=$(pwd)
tui() { export CODEX_HOME=$(mktemp -d); D=$(mktemp -d); cd $D; git init -q
  EXTRA_CONFIG="[projects.\"$D\"]
trust_level = \"trusted\"" RUN="python3 $S/tui.py" bash $S/run.sh $S/s_once.py "2" "$@" 2>/dev/null | python3 -c "
import sys; print('\n'.join('  '+l[:100] for l in sys.stdin.read().splitlines()[1:]))"; cd $S; }
echo "== 1. 输入 /（弹出全部命令，按呈现顺序）"; tui "/"
echo "== 2. 输入 /co（模糊过滤）"; tui "/co"
echo "== 3. /init 回车：把内置提示作为一条普通用户消息提交"; tui "/init\r"
python3 -c "
import json,glob; b=json.load(open(sorted(glob.glob('$CODEX_HOME/requests/req*.json'))[0]))['body']
print('   模型收到的最后一条用户消息：', b['input'][-1]['content'][0]['text'][:70].replace(chr(10),' ⏎ '))"
