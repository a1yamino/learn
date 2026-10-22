from common import *
TITLE='MCP：接入外部工具服务器';MIN=40;NEXT='斜杠命令'
DESC='pi 刻意不内置 MCP，而是让扩展自己注册工具（第 15 课）。Codex 内置 MCP 客户端：在 <code>config.toml</code> 的 <code>[mcp_servers.名字]</code> 中配置一个 stdio 或 HTTP 服务器，Codex 启动它、执行 <code>tools/list</code>，把工具以 <code>mcp__名字</code> 命名空间暴露给模型，并在调用前按<b>工具注解</b>与配置决定是否需要审批。本课写一个 30 行的 MCP 服务器，亲手触发这三条分支。（注：在固定的这个提交中，<code>codex</code> 没有 <code>mcp-server</code> 子命令；把 Codex 嵌入其他程序走 app-server，见第 23 课。）'
SUM=['<b>配置</b>：<code>[mcp_servers.mini] command/args/env</code>（stdio）或 <code>url</code>（streamable HTTP）。<code>codex mcp list/get/add/remove/login</code> 管理它们。',
'<b>环境变量白名单</b>：stdio 服务器只继承 <code>HOME/LOGNAME/PATH/SHELL/USER…</code> 等默认变量（<code>rmcp-client/src/utils.rs</code> 的 <code>DEFAULT_ENV_VARS</code>），其余要在 <code>env</code> 或 <code>env_vars</code> 中显式给出——作者第一次用环境变量传参时就因此失败。',
'<b>暴露方式</b>（<code>mcp_tool_exposure.rs</code>）：模型的 <code>supports_search_tool</code> 为真（如 gpt-5.5）时，MCP 工具是 <b>Deferred</b>：请求里只有一个 <code>tool_search</code>，模型先搜索再加载；否则 <b>Direct</b>：作为 <code>{"type":"namespace","name":"mcp__mini","tools":[…]}</code> 直接给出。模型调用时带上 <code>namespace</code> 字段。',
'<b>审批判定</b>（<code>mcp_tool_call.rs</code>）：<code>approval_mode</code> 为 approve → 不问；prompt → 总是问；writes → 非只读就问；auto（默认）→ <code>destructiveHint=true</code> 要问，<code>readOnlyHint=true</code> 不问，否则看 destructive/openWorld（缺省都视为 true）——即<b>未注解的工具默认需要审批</b>。',
'<b>never 策略</b>：需要审批而 <code>approval_policy=never</code> 时直接拒绝（“MCP tool call requires approval, but approval policy is never”），结果作为工具输出返回给模型。',
'<b>事件</b>：exec 的 JSONL 中是 <code>mcp_tool_call</code> 条目，带 server/tool/arguments/result/error/status。']
S1=('一次 MCP 调用','')
A1=[('启动','Codex 启动服务器：initialize → tools/list。',[('c','Codex','sig',0,90,90),('s','mini_mcp.py','',180,90,120)]),('暴露','工具成为 namespace mcp__mini。',[('c','tools: mcp__mini.add','sig',0,90,190)]),('审批','按注解/配置判定是否要问用户。',[('c','approval?','sig',0,90,110),('s','tools/call add','ok',180,90,120)])]
S2=('动手：这次调用要不要审批？','approval_mode 为默认 auto。')
CHI=[('无任何注解','需要：缺省视为可能有破坏性、开放世界','bad','never 策略下直接失败。'),('readOnlyHint: true','不需要','ok',''),('destructiveHint: true, readOnlyHint: true','需要：destructive 优先','bad',''),('destructiveHint: false, openWorldHint: false','不需要','ok','')]
CHH='选择一种注解。'
S3=('读代码','',X('codex-rs/core/src/mcp_tool_call.rs',[(2535,2566)])+X('codex-rs/core/src/mcp_tool_exposure.rs',[(158,162)])+X('codex-rs/core/src/tools/spec_plan.rs',[(151,158)])+X('codex-rs/rmcp-client/src/utils.rs',[(163,168)])+NOTE('<b>与 pi 对照</b>：'+pi(15,'扩展系统：工具、命令与事件钩子')+'。'))
S4=('真实输出','')
TERM=[['bash l17.sh','== 1. 服务器没有声明注解（approval_policy=never）\n  [mock] namespace mcp__mini → [\'add\']\n  mcp_tool_call failed MCP tool call requires approval, but approval policy is never\n== 2. 工具声明 readOnlyHint=true\n  mcp_tool_call completed 42\n== 3. 无注解，但配置 approval_mode="approve"\n  mcp_tool_call completed 42','']]
S5=('在你的电脑上练习',RUNNOTE)
PRAC=[('一个最小的 MCP 服务器。',heredoc('mini_mcp.py'),''),('剧本：调用 mcp__mini 中的 add。',heredoc('s_mcp.py'),''),('三种审批情形。',heredoc('l17.sh')+'\ncd codex/scratch && bash l17.sh',None)]
CHAL=('看 Deferred 模式','把 <code>MODEL</code> 改回 gpt-5.5 运行情形 3，查看 req01 的工具列表：<code>mcp__mini</code> 还在吗？模型要如何拿到 add？',
'<p>不在了。gpt-5.5 的 <code>supports_search_tool</code> 为真，MCP 工具变为 Deferred：工具列表中多了 <code>{"type":"tool_search","execution":"client",…}</code>，其描述写着可搜索的来源（“- mini”）。模型需要先发出 <code>tool_search_call</code>（参数 query），Codex 在本地用 BM25 搜索延迟加载的工具元数据，把匹配的工具放进 <code>tool_search_output</code>，下一次请求中模型才能调用 add。工具很多时，这能显著缩短每次请求的工具列表。</p>')
QUIZ=[['未注解的 MCP 工具默认？',['需要审批','不需要审批','被禁用'],0,''],['readOnlyHint=true 且 destructiveHint=true？',['需要审批','不需要','报错'],0,''],['MCP 工具在请求中的命名空间？',['mcp__服务器名','mcp.服务器名','服务器名'],0,''],['为什么 stdio 服务器读不到自定义环境变量？',['只继承白名单变量','Codex 清空了 PATH','MCP 协议禁止'],0,''],['支持 tool_search 的模型如何看到 MCP 工具？',['先搜索再加载','全部直接列出','看不到'],0,'']]
