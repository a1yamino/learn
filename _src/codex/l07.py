from common import *
TITLE='工具规格、路由与并行';MIN=40;NEXT='会话线程、中断与转向'
DESC='pi 的工具是一个带 TypeBox 参数模式的对象，循环负责校验与并行执行。Codex 把这件事拆成三层：<b>规格</b>（<code>ToolSpec</code>，发给模型的 JSON 描述，包括 function、custom 自由格式、tool_search 等类型）、<b>注册表与路由</b>（把 <code>ResponseItem</code> 转成 <code>ToolCall</code> 并派发给处理器）、<b>并行闸门</b>（用一把读写锁决定哪些工具能同时运行）。本课故意让模型调用不存在的工具和传错参数，看错误如何回到模型。'
SUM=['<b>工具规格</b>：gpt-5.5 下模型看到 10 个工具；<code>exec_command</code> 有 cmd、workdir、tty、yield_time_ms、sandbox_permissions、justification、prefix_rule 等参数；<code>apply_patch</code> 是 <code>custom</code> 类型，格式由 Lark 语法定义。请求带 <code>parallel_tool_calls: true</code>。',
'<b>build_tool_call</b>（<code>tools/router.rs</code>）：FunctionCall → <code>ToolPayload::Function{arguments}</code>（字符串原样传递），ToolSearchCall、CustomToolCall 等各有载荷类型。',
'<b>错误回给模型而不是终止</b>：未知工具 → <code>unsupported call: no_such_tool</code>；参数反序列化失败 → <code>failed to parse function arguments: missing field `cmd`</code>。这些都是 <code>FunctionCallError::RespondToModel</code>，作为工具输出写回历史。',
'<b>并行闸门</b>（<code>tools/parallel.rs</code>）：<code>supports_parallel_tool_calls()</code> 为真的工具获取读锁，可以同时运行；其余获取写锁，独占执行。默认实现返回 false。',
'<b>谁支持并行</b>：exec_command、write_stdin、view_image、tool_search、MCP 中声明只读的工具等；apply_patch 未覆盖默认值，因此独占执行——修改文件时不会与其他工具交错。',
'<b>对比 pi</b>：pi 默认全部并行，可整体切换为顺序；Codex 按工具粒度决定。']
S1=('一次调用的路线','')
A1=[('解析','ResponseItem::FunctionCall → ToolCall。',[('r','function_call','',0,90,130),('t','ToolCall','sig',170,90,100)]),('路由','注册表按名字找处理器；找不到 → unsupported call。',[('t','ToolCall','sig',0,90,100),('g','registry','',140,90,100),('e','unsupported call','bad',280,90,150)]),('闸门','并行工具拿读锁同时运行；其余拿写锁独占。',[('a','exec A（读锁）','ok',0,40,140),('b','exec B（读锁）','ok',0,140,140),('p','apply_patch（写锁）','sig',180,90,170)])]
S2=('动手：模型会收到什么？','')
CHI=[('调用 no_such_tool','unsupported call: no_such_tool','bad',''),('exec_command 传 command 而不是 cmd','failed to parse function arguments: missing field `cmd`','bad',''),('两个 exec_command','并行执行（读锁）','ok',''),('exec_command 与 apply_patch 同时出现','apply_patch 等其他工具结束后独占执行','sig','')]
CHH='选择一种调用。'
S3=('读代码','',X('codex-rs/core/src/tools/router.rs',[(257,273)])+'<p>读写锁闸门：</p>'+X('codex-rs/core/src/tools/parallel.rs',[(213,217)])+X('codex-rs/core/src/tools/registry.rs',[(606,609)])+'<p>默认不支持并行：</p>'+X('codex-rs/tools/src/tool_executor.rs',[(122,124)])+NOTE('<b>与 pi 对照</b>：'+pi(7,'工具调用：参数校验、并行执行与钩子')+'。'))
S4=('真实输出','')
TERM=[['bash l07.sh','== 三个调用得到的输出\n  c1 → unsupported call: no_such_tool\n  c2 → failed to parse function arguments: missing field `cmd` at line 1 column 17\n  c3 → Chunk ID: … Process exited with code 0 …','']]
S5=('在你的电脑上练习',RUNNOTE)
PRAC=[('错误调用剧本。',heredoc('s_tools.py'),''),('查看工具规格与回应。',heredoc('l07.sh')+'\ncd codex/scratch && bash l07.sh',None)]
CHAL=('看完整的 exec_command 规格','打印 req01 中 exec_command 的完整 description 与 parameters，找出 <code>sandbox_permissions</code> 与 <code>prefix_rule</code> 的说明。它们分别用于什么？',
'<pre style="white-space:pre-wrap">python3 -c "import json,sys;b=json.load(open(sys.argv[1]))[\'body\'];t=[t for t in b[\'tools\'] if t.get(\'name\')==\'exec_command\'][0];print(json.dumps(t,ensure_ascii=False,indent=1))" $CODEX_HOME/requests/req01.json</pre><p>sandbox_permissions 取值 <code>use_default</code> 或 <code>require_escalated</code>（不在沙箱中运行）；后者需要 justification 作为给用户的审批问题。prefix_rule 只能与 require_escalated 一起使用，是一个可复用的审批前缀（例如 ["git","pull"]），批准后同前缀的命令不再询问。第 13 课讲审批与执行策略时会用到。</p>')
QUIZ=[['未知工具的调用会？',['以错误输出回给模型','让 codex 崩溃','被忽略'],0,''],['apply_patch 是什么类型的工具？',['custom（Lark 语法）','function','MCP'],0,''],['并行工具获取？',['读锁','写锁','不加锁'],0,''],['supports_parallel_tool_calls 默认？',['false','true','取决于模型'],0,''],['参数错误属于？',['RespondToModel 错误','致命错误','警告'],0,'']]
