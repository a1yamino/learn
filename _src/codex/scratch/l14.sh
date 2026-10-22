#!/bin/bash
# 系统提示与 AGENTS.md：codex 实际发送的前几条消息
S=$(pwd); export CODEX_HOME=$(mktemp -d); R=$(mktemp -d); cd $R; git init -q --template= .
echo "全局规则：回答用中文。" > $CODEX_HOME/AGENTS.md
echo "项目规则：测试用 pytest。" > AGENTS.md
mkdir -p svc && echo "子目录规则：svc 下禁止使用 print。" > svc/AGENTS.md
cd svc
EXTRA_CONFIG='developer_instructions = "额外的开发者指令：保持简洁。"' bash $S/run.sh $S/s_once.py "你好" >/dev/null 2>&1
python3 - $CODEX_HOME/requests/req01.json <<'PY'
import json, sys, re
inp = json.load(open(sys.argv[1]))["body"]["input"]
for k, it in enumerate(inp):
    texts = [c.get("text", "") for c in it.get("content", [])]
    print(f"== 第 {k+1} 条 {it.get('role')}：{len(texts)} 段，共 {sum(map(len, texts))} 字符")
    for t in texts:
        first = t.strip().splitlines()[0][:70] if t.strip() else ""
        print(f"   · {first}")
        for line in t.splitlines():
            if "规则" in line or "额外的开发者指令" in line: print(f"       ↳ {line.strip()[:70]}")
PY
