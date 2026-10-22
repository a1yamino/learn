#!/bin/bash
# 两种扩展点：PreToolUse 钩子（拦截工具调用）与技能（SKILL.md 进入开发者消息）
S=$(pwd); export CODEX_HOME=$(mktemp -d); R=$(mktemp -d); cd $R; git init -q; mkdir data; rm -f /tmp/hook.log
cat > $CODEX_HOME/hooks.json <<JSON
{"hooks": {"PreToolUse": [{"matcher": ".*", "hooks": [{"type": "command", "command": "python3 $S/guard.py"}]}]}}
JSON
mkdir -p .agents/skills/commit-msg
cat > .agents/skills/commit-msg/SKILL.md <<'MD'
---
name: commit-msg
description: 按团队规范写提交信息（类型: 摘要），在用户要求提交时使用
---
1. 运行 git diff --staged 查看改动
2. 第一行格式：feat|fix|docs: 不超过 50 字的摘要
MD
echo "== 1. 未信任的钩子：不运行"
bash $S/run.sh $S/s_hook.py "清理" 2>/dev/null >/dev/null; echo "   hook.log：$(cat /tmp/hook.log 2>/dev/null || echo 无)"
echo "== 2. --dangerously-bypass-hook-trust：钩子运行"
bash $S/run.sh $S/s_hook.py --dangerously-bypass-hook-trust "清理" 2>/dev/null | grep '^\[mock\]'
cat /tmp/hook.log; echo "   data 目录还在吗：$(ls -d data 2>/dev/null || echo 不在)"
echo "== 3. 技能出现在第 2 条 developer 消息中（根目录表 + 条目）"
python3 - $CODEX_HOME/requests/req01.json <<'PY'
import json, sys; t = json.load(open(sys.argv[1]))["body"]["input"][1]["content"][0]["text"]
print("\n".join("   " + l for l in t.splitlines() if "commit-msg" in l or l.startswith("- `r")))
PY
