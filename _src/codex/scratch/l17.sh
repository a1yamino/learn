#!/bin/bash
# Codex 作为 MCP 客户端：配置一个 stdio 服务器，看工具如何暴露、何时需要审批
S=$(pwd); export CODEX_HOME=$(mktemp -d); cd $(mktemp -d)
export MODEL=my-model   # 未知模型：supports_search_tool=false，MCP 工具直接暴露
run() { RO=$2; CFG='[mcp_servers.mini]
command = "python3"
args = ["'$S'/mini_mcp.py"'$RO']'; EXTRA_CONFIG="$CFG$1" bash $S/run.sh $S/s_mcp.py --json "算 2+40" 2>/dev/null | python3 -c "
import json,sys
for l in sys.stdin:
    if not l.startswith('{'): print(' ',l.strip()); continue
    it=json.loads(l).get('item',{})
    if it.get('type')=='mcp_tool_call' and it.get('status')!='in_progress':
        print('  mcp_tool_call', it['status'], it.get('result') and it['result']['content'][0]['text'] or it['error']['message'])"; }
echo "== 1. 服务器没有声明注解（approval_policy=never）"; run ""
echo "== 2. 工具声明 readOnlyHint=true"; run "" ', "--readonly"'
echo "== 3. 无注解，但配置 approval_mode=\"approve\""; run '
[mcp_servers.mini.tools.add]
approval_mode = "approve"'
echo "== codex mcp list"; codex mcp list
