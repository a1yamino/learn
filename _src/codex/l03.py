from common import *
TITLE='协议：Op、Event 与 ResponseItem';MIN=40;NEXT='模型提供方与认证'
DESC='pi 用一套自己的消息类型（user/assistant/toolResult）抽象各家 API。Codex 则直接以 OpenAI <b>Responses API</b> 的条目为历史的基本单位：<code>ResponseItem</code>。在它之上，<code>codex-protocol</code> 还定义了前端与内核之间的 <code>Op</code>（31 种操作）和 <code>EventMsg</code>（85 种事件）。本课逐一认识这三类类型，并在线上请求中看到它们的真实 JSON。'
SUM=['<b>ResponseItem</b>（<code>protocol/src/models.rs</code>）：<code>#[serde(tag="type", rename_all="snake_case")]</code> 的枚举——Message、Reasoning、FunctionCall/FunctionCallOutput、CustomToolCall/CustomToolCallOutput（自由格式工具，如 apply_patch）、WebSearchCall、Compaction 等。会话历史就是 ResponseItem 列表，原样发回模型。',
'<b>arguments 是字符串</b>：Responses API 把函数参数作为“包含 JSON 的字符串”返回，Codex 原样保存，到处理工具时才解析。',
'<b>ContentItem</b>：消息内容——InputText、InputImage、InputAudio、OutputText。',
'<b>Op</b>（<code>protocol.rs</code>）：Interrupt、TurnInput、ExecApproval、PatchApproval、Compact、Review、Shutdown……前端的一切操作。',
'<b>Event / EventMsg</b>：<code>Event{id, msg}</code>，id 关联到提交；EventMsg 涵盖错误、警告、turn 开始/结束、消息增量、命令执行开始/输出/结束、审批请求、计划更新、token 计数等。',
'<b>对比 pi</b>：pi 的统一消息模型要在各家 API 之间转换（第 5 课）；Codex 以 Responses 为“母语”，Chat Completions 等其他协议则通过适配实现。']
S1=('三种类型','')
A1=[('Op','前端 → 内核：做什么。',[('o','Op::TurnInput','sig',0,90,140)]),('Event','内核 → 前端：发生了什么。',[('e','EventMsg::ExecCommandBegin','',0,90,230)]),('ResponseItem','内核 ↔ 模型：历史本身。',[('r','function_call','ok',0,50,140),('r2','function_call_output','ok',0,140,180)])]
S2=('动手：属于哪一类？','')
CHI=[('用户按下 Esc 中断','Op::Interrupt','ok',''),('模型请求执行命令','ResponseItem::FunctionCall','ok',''),('TUI 显示“正在运行 ls”','EventMsg（命令开始事件）','ok',''),('命令输出发回模型','ResponseItem::FunctionCallOutput','ok',''),('用户批准命令','Op::ExecApproval','ok','')]
CHH='选择一件事。'
S3=('读代码','','<p>ResponseItem 的开头与 FunctionCall：</p>'+X('codex-rs/protocol/src/models.rs',[(1050,1062),(1124,1149)])+'<p>Event：</p>'+X('codex-rs/protocol/src/protocol.rs',[(1449,1456),(1464,1473)])+NOTE('<b>与 pi 对照</b>：'+pi(3,'统一的消息模型与流式事件')+'。'))
S4=('真实输出','')
TERM=[['bash l03.sh','== ResponseItem 的变体：\nAdditionalTools Message AgentMessage Reasoning LocalShellCall FunctionCall …','']]
S5=('在你的电脑上练习',RUNNOTE)
PRAC=[('统计协议类型，并查看线上 JSON。',heredoc('l03.sh')+'\ncd codex/scratch && bash l03.sh',None)]
CHAL=('自由格式工具','apply_patch 在 gpt-5.5 上是自由格式（custom）工具。写剧本让模型返回 <code>{"type":"custom_tool_call","name":"apply_patch","call_id":"p1","input":"*** Begin Patch\\n*** Add File: a.txt\\n+hi\\n*** End Patch"}</code>，用 <code>--sandbox workspace-write</code> 运行，看 req02 中回传的条目类型。',
'<pre style="white-space:pre-wrap">def reply(n, body):\n    if n == 1:\n        return [{"type": "custom_tool_call", "name": "apply_patch", "call_id": "p1",\n                 "input": "*** Begin Patch\\n*** Add File: a.txt\\n+hi\\n*** End Patch\\n"}]\n    return [msg("好了")]</pre><p>req02 的最后两条是 <code>custom_tool_call</code>（input 为原始补丁文本，不是 JSON）和 <code>custom_tool_call_output</code>。自由格式工具省去了在 JSON 字符串里转义补丁的麻烦。第 10 课详细讲 apply_patch。</p>')
QUIZ=[['Codex 历史的基本单位？',['ResponseItem','pi Message','字符串'],0,''],['FunctionCall.arguments 的类型？',['JSON 字符串','对象','数组'],0,''],['Event.id 关联到？',['提交的 id','线程 id','模型 id'],0,''],['apply_patch 在 gpt-5.5 上是？',['custom（自由格式）工具','function 工具','MCP 工具'],0,''],['ResponseItem 的 serde 标签字段？',['type','kind','role'],0,'']]
