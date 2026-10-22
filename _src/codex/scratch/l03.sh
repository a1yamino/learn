#!/bin/bash
# 协议类型一览 + 线上真实的 ResponseItem
P=../codex-rs/protocol/src
echo "== Op 变体数：$(awk '/^pub enum Op \{/,/^\}/' $P/protocol.rs | grep -cE '^    [A-Z][A-Za-z]+( \{|\(|,)')"
echo "== EventMsg 变体数：$(awk '/^pub enum EventMsg \{/,/^\}/' $P/protocol.rs | grep -cE '^    [A-Z][A-Za-z]+( \{|\(|,)')"
echo "== ResponseItem 的变体："
awk '/^pub enum ResponseItem \{/,/^\}/' $P/models.rs | grep -oE '^    [A-Z][A-Za-z]+' | tr -d ' ' | tr '\n' ' '; echo
export CODEX_HOME=$(mktemp -d); S=$(pwd); cd "$(mktemp -d)"
bash $S/run.sh $S/s_hello.py "打个招呼" >/dev/null 2>&1
echo "== req02 中 codex 回传的两个条目（原样 JSON）"
python3 - $CODEX_HOME/requests/req02.json <<'PY'
import json, sys
for it in json.load(open(sys.argv[1]))["body"]["input"][-2:]:
    print(json.dumps(it, ensure_ascii=False)[:300])
PY
