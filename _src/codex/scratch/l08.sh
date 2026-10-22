#!/bin/bash
S=$(pwd); export CODEX_HOME=$(mktemp -d); cd $(mktemp -d)
RUN="python3 $S/l08.py" bash $S/run.sh $S/s_steer.py
echo "== 模型收到的请求"
python3 $S/show.py $CODEX_HOME/requests 60 | grep -vE "developer|environment_context" | tail -8
