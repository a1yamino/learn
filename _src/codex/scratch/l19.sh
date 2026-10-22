#!/bin/bash
# update_plan 默认关闭：用 [tools.update_plan] enabled=true 打开
S=$(pwd); export CODEX_HOME=$(mktemp -d); cd $(mktemp -d)
EXTRA_CONFIG='[tools.update_plan]
enabled = true' RUN="python3 $S/l19.py" bash $S/run.sh $S/s_plan.py 2>&1
