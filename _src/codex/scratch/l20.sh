#!/bin/bash
S=$(pwd); export CODEX_HOME=$(mktemp -d); cd $(mktemp -d)
EXTRA_CONFIG='approval_policy = "never"
sandbox_mode = "danger-full-access"' RUN="python3 $S/l20.py" bash $S/run.sh $S/s_goal.py 2>&1
