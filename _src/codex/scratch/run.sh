#!/bin/bash
# run.sh <剧本.py> [codex 参数...]：启动假模型，用临时 CODEX_HOME 运行 codex exec
# 环境变量 KEEP=1 时保留工作目录；W 指定工作目录
MODEL=${MODEL:-gpt-5.5}
SCRIPT=$(realpath "$1"); shift
export CODEX_HOME=${CODEX_HOME:-$(mktemp -d)}; mkdir -p $CODEX_HOME; LOG=$CODEX_HOME/requests
PORT=$((20000 + RANDOM % 20000))
python3 "$(dirname "$0")/mock.py" "$SCRIPT" $PORT "$LOG" & MOCK=$!
trap "kill $MOCK 2>/dev/null" EXIT
cat > $CODEX_HOME/config.toml <<TOML
model = "$MODEL"
model_provider = "mock"
$EXTRA_CONFIG
[model_providers.mock]
name = "Mock"
base_url = "http://127.0.0.1:$PORT/v1"
wire_api = "responses"
request_max_retries = 0
stream_max_retries = 0
TOML
sleep 0.5
codex exec --skip-git-repo-check "$@" </dev/null
