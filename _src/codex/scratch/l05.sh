#!/bin/bash
# 重试：HTTP 500 → 请求重试；流中断 → 流重试
S=$(pwd); cd $(mktemp -d); export CODEX_HOME=$(mktemp -d)
REQ_RETRIES=2 STREAM_RETRIES=2 \
  bash $S/run.sh $S/s_flaky.py "hi" 2>&1 | grep -vE "^(--|workdir|model|provider|approval|sandbox|reasoning|session id|OpenAI Codex|user$|hi$|Reading)"
echo "== 共收到 $(ls $CODEX_HOME/requests | wc -l) 次请求"
