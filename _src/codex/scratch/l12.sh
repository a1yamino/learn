#!/bin/bash
# Linux 沙箱实验：codex sandbox 在本机沙箱中运行命令（不经过模型）
export CODEX_HOME=$(mktemp -d); W=$(mktemp -d); cd $W; git init -q --template= .
try() { local mode=$1; shift; printf "  %-16s %-34s → " "$mode" "$*"
  if codex sandbox -c sandbox_mode="\"$mode\"" -- bash -c "$*" >/tmp/sbx.out 2>&1; then echo "成功"; else echo "失败：$(tail -1 /tmp/sbx.out | cut -d: -f2- | head -c 60)"; fi; }
echo "== 只读（默认）"
try read-only "cat /etc/hostname > /dev/null"
try read-only "touch a.txt"
echo "== workspace-write"
try workspace-write "touch a.txt"
try workspace-write "touch \$HOME/escape.txt"
try workspace-write "touch /tmp/t.txt"
try workspace-write "echo x >> .git/config"
try workspace-write "curl -sS -m 3 https://example.com -o /dev/null"
echo "== 沙箱内看到的进程（PID 命名空间）"
codex sandbox -- bash -c 'ps -e --no-headers | wc -l | xargs echo "  进程数:"'
echo "  宿主进程数: $(ps -e --no-headers | wc -l)"
