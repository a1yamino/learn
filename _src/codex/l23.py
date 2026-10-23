from common import *
TITLE='非交互与 app-server';MIN=45;NEXT='毕业项目：在 Codex 上搭一个可审计的修复流程'
DESC='pi 有四种运行模式：交互、print/JSON、RPC 与 SDK（第 18 课）。Codex 的对应物是：<code>codex exec</code>（脚本与 CI）、<code>codex app-server</code>（JSON-RPC，供 IDE 插件与桌面应用使用），而 TUI 与 exec 本身都是 app-server 的<b>进程内客户端</b>——<code>exec/src/lib.rs</code> 直接使用 <code>InProcessAppServerClient</code>，TUI 通过 <code>app_server_session.rs</code> 说同一套协议。所以 app-server 协议就是 Codex 的“SDK”。本课把这几种入口各用一次。'
SUM=['<b>exec 的输出</b>：默认是给人看的文本；<code>--json</code> 输出 JSONL，事件定义在 <code>exec/src/exec_events.rs</code>：thread.started、turn.started/completed/failed、item.started/updated/completed（agent_message、command_execution、mcp_tool_call、file_change、todo_list……）。',
'<b>结构化答案</b>：<code>--output-schema schema.json</code> 让请求带上 <code>text.format = {type: json_schema, name: "codex_output_schema", strict: true}</code>（<code>codex-api/src/common.rs</code>）；<code>-o 文件</code> 把最后一条助手消息写入文件。',
'<b>--ephemeral</b>：不写 rollout（实验中文件数不变）；<code>exec resume/fork</code> 见第 15 课。',
'<b>app-server</b>：stdio（默认）或 <code>--listen</code> 指定的传输上的 JSON-RPC；先 <code>initialize</code>（可声明 <code>experimentalApi</code>）+ <code>initialized</code>，再 <code>thread/start</code>、<code>turn/start</code>。一次带工具调用的回合产生 thread/status、turn/*、item/*、增量、token 用量、限额等通知（实验 4）。',
'<b>双向</b>：服务器也会向客户端发<b>请求</b>（审批、用户输入、动态工具调用等，第 13 课用过）。<code>generate-json-schema</code> 显示此提交中客户端请求 106 种、服务器通知 85 种、服务器请求 10 种；<code>generate-ts</code> 生成 TypeScript 类型。',
'<b>选择</b>：一次性任务与 CI 用 exec（加 <code>--json</code>/<code>--output-schema</code>）；需要多轮、审批交互、在自己的界面中显示进度时用 app-server。']
S1=('同一个内核，三种客户端','')
A1=[('TUI','进程内 app-server 客户端。',[('t','TUI','sig',0,40,80),('k','app-server 内核','',160,90,140)]),('exec','也是进程内客户端，输出文本或 JSONL。',[('e','exec','sig',0,90,80),('k','app-server 内核','',160,90,140)]),('IDE','通过 stdio JSON-RPC 连接 codex app-server。',[('i','IDE 插件','sig',0,140,90),('k','app-server 内核','ok',160,90,140)])]
S2=('动手：用哪个入口？','')
CHI=[('CI 中跑一次检查，要机器可读的结论','exec --output-schema -o','ok',''),('脚本中逐条处理事件','exec --json','ok',''),('自己的界面中显示进度并处理审批','app-server','ok',''),('不想在磁盘上留下会话','exec --ephemeral','ok','')]
CHH='选择一个需求。'
S3=('读代码','',X('codex-rs/exec/src/exec_events.rs',[(11,23)])+X('codex-rs/exec/src/lib.rs',[(19,23)])+X('codex-rs/codex-api/src/common.rs',[(400,409)])+NOTE('<b>与 pi 对照</b>：'+pi(18,'运行模式：交互、print/JSON、RPC 与 SDK')+'。'))
S4=('真实输出','')
TERM=[['bash l23.sh','== 2. --output-schema + -o：结构化最终答案\n[mock] text.format.type=json_schema name=codex_output_schema strict=True\n   last.txt = {"files": 0, "ok": true}\n== 3. --ephemeral：不写 rollout\n   rollout 文件数：之前 2，之后 2\n== 5. 协议规模：generate-json-schema\n   ClientRequest: 106 种\n   ServerNotification: 85 种\n   ServerRequest: 10 种','']]
S5=('在你的电脑上练习',RUNNOTE)
PRAC=[('剧本。',heredoc('s_json.py'),''),('app-server 通知计数。',heredoc('l23.py'),''),('五个实验。',heredoc('l23.sh')+'\ncd codex/scratch && bash l23.sh',None)]
CHAL=('流式显示','修改 <code>l23.py</code>，把 <code>item/agentMessage/delta</code> 的增量实时打印出来（不换行），回合结束时打印换行。增量字段叫什么？',
'<pre style="white-space:pre-wrap">def show(m):\n    if m["method"] == "item/agentMessage/delta":\n        print(m["params"]["delta"], end="", flush=True)\na.wait("turn/completed", show=show); print()</pre><p>字段是 <code>delta</code>（同一通知还带 threadId、turnId、itemId）。mock 一次发出整条消息，所以每条消息只有一个增量；真实模型会逐块到达。</p>')
QUIZ=[['exec 与 app-server 的关系？',['exec 是进程内 app-server 客户端','完全独立的实现','exec 启动子进程 app-server'],0,''],['--output-schema 体现在请求的？',['text.format','instructions','tools'],0,''],['--ephemeral？',['不写 rollout','不联网','不用沙箱'],0,''],['服务器→客户端的请求例子？',['审批','turn/start','thread/start'],0,''],['生成 TS 类型？',['codex app-server generate-ts','codex types','npm'],0,'']]
