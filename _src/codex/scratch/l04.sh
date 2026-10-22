#!/bin/bash
# 提供方与凭据：env_key、请求头、codex login
S=$(pwd); W=$(mktemp -d); cd $W
export CODEX_HOME=$(mktemp -d)
echo "== 1. provider 声明 env_key = \"MOCK_KEY\"，但环境变量未设置"
EXTRA_PROVIDER='env_key = "MOCK_KEY"' bash $S/run.sh $S/s_hello.py "hi" 2>&1 | grep -iE "error|MOCK_KEY" | head -3
echo "== 2. 设置 MOCK_KEY 后，假服务器看到的请求"
MOCK_KEY=sk-test-123 EXTRA_PROVIDER='env_key = "MOCK_KEY"' bash $S/run.sh $S/s_hello.py "hi" >/dev/null 2>&1
python3 - $CODEX_HOME/requests/req01.json <<'PY'
import json, sys
r = json.load(open(sys.argv[1]))
print("POST", r["path"])
for k, v in sorted(r["headers"].items()):
    if k.lower() in ("authorization", "originator", "user-agent", "session_id", "session-id", "accept", "version"):
        print(f"  {k}: {v[:60]}")
PY
echo "== 3. codex login：把 API key 存进 CODEX_HOME"
export CODEX_HOME=$(mktemp -d)
codex login status 2>&1 | head -1
echo sk-demo-456 | codex login --with-api-key 2>&1 | tail -1
codex login status 2>&1 | head -1
ls $CODEX_HOME | grep auth; python3 -c "import json,sys;print(sorted(json.load(open(sys.argv[1])).keys()))" $CODEX_HOME/auth.json
