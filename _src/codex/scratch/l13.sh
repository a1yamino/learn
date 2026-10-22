#!/bin/bash
S=$(pwd); export CODEX_HOME=$(mktemp -d); W=$(mktemp -d); cd $W
mkdir -p $CODEX_HOME/rules; cp $S/rules.example $CODEX_HOME/rules/default.rules
echo "== 1. 单独检查规则：codex execpolicy check"
for c in "git reset --hard" "cp a b" "ls -la" "rm -rf /"; do
  printf "  %-18s → " "$c"; codex execpolicy check -r $CODEX_HOME/rules/default.rules $c | python3 -c "import json,sys;d=json.load(sys.stdin);print(d.get('decision','（无匹配规则）'))"
done
echo "== 2. 一个 turn 中的四条命令（approval=on-request，sandbox=workspace-write）"
RUN="python3 $S/l13.py" bash $S/run.sh $S/s_approve.py
echo "== 模型看到的工具结果"
python3 $S/show.py $CODEX_HOME/requests 90 | grep function_call_output | tail -4
echo "== 文件：$(ls $W | tr '\n' ' ')；家目录中的 outside.txt：$(ls $HOME/outside.txt 2>/dev/null || echo 不存在)"
