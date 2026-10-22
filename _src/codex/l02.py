from common import *
TITLE='一次 turn 的生命周期';MIN=40;NEXT='协议：Op、Event 与 ResponseItem'
DESC='在 pi 里，一次对话是 <code>session.prompt()</code> 触发的 agent 循环。Codex 的结构多了一层“队列”：前端把 <b>Op</b>（操作）提交到会话的提交队列，会话的 <code>submission_loop</code> 逐个处理，把一次用户输入变成一个 <b>turn</b> 任务；任务里的 <code>run_turn</code> 反复请求模型、执行工具，期间通过事件队列把 <b>Event</b> 发回前端。本课跟踪一次真实的 turn：从 exec 的 JSONL 事件，到假服务器收到的两次请求。'
SUM=['<b>SQ/EQ 模型</b>：前端（tui、exec、app-server）只和会话交换两种消息——提交 <code>Submission{id, op}</code>，接收 <code>Event{id, msg}</code>。这让同一个内核可以服务多个前端。',
'<b>submission_loop</b>（<code>session/handlers.rs</code>）：<code>tokio::select!</code> 等待关闭信号、新的提交或邮箱更新；<code>Op::TurnInput</code> 交给 <code>turn_input::handle</code>，它要么启动新 turn，要么把输入排进正在运行的 turn（转向，第 8 课）。',
'<b>任务</b>：turn 以 <code>SessionTask</code> 形式运行（<code>tasks/regular.rs</code> 调用 <code>run_turn</code>）；压缩、评审、用户 shell 命令也是任务。',
'<b>一个 turn 内多次请求</b>：第一次请求模型返回 <code>exec_command</code> 调用；codex 执行后，把 <code>function_call</code> 与 <code>function_call_output</code> 追加进历史，再发第二次请求，直到模型不再调用工具。',
'<b>exec 的 JSONL 事件</b>：<code>thread.started</code> → <code>turn.started</code> → <code>item.started/completed</code>（命令执行、助手消息、文件修改……）→ <code>turn.completed</code>（附 token 用量）。这是内核事件的简化投影，定义在 <code>exec/src/exec_events.rs</code>。',
'<b>请求里没有 instructions 字段</b>：系统提示作为第一条 <code>developer</code> 消息发送，后面是技能说明、环境上下文（cwd、shell……）和用户消息。']
S1=('Op 进，Event 出','')
A1=[('提交','exec 提交 Op::TurnInput。',[('f','exec 前端','',0,90,100),('q','提交队列','sig',140,90,110)]),
('turn','submission_loop 启动 turn 任务，run_turn 请求模型。',[('q','submission_loop','sig',0,90,150),('t','run_turn','',190,90,100),('m','模型','',330,90,80)]),
('工具','模型要求 exec_command；执行，结果写回历史，再请求。',[('t','run_turn','',0,90,100),('x','exec_command','ok',140,40,130),('m','第 2 次请求','',140,150,130)]),
('事件','item.started / item.completed / turn.completed 流回前端。',[('e','事件队列','sig',0,90,110),('f','exec 输出 JSONL','',150,90,150)])]
S2=('动手：事件顺序','排列一次 turn 中的事件。')
CHI=[('第一个事件','thread.started','ok',''),('命令开始执行','item.started（command_execution，status=in_progress）','ok',''),('命令结束','item.completed（aggregated_output、exit_code）','ok',''),('模型最终回答','item.completed（agent_message）','ok',''),('最后','turn.completed，附 usage','ok','')]
CHH='选择一个阶段。'
S3=('读代码','','<p>提交循环：</p>'+X('codex-rs/core/src/session/handlers.rs',[(443,460),(566,577)])+'<p>exec 的事件类型：</p>'+X('codex-rs/exec/src/exec_events.rs',[(10,37)])+NOTE('<b>与 pi 对照</b>：'+pi(2,'一次对话的生命周期')+'。pi 的 <code>prompt()</code> 直接运行循环并通过订阅回调发事件；Codex 用异步通道把前端与内核彻底隔开。'))
S4=('真实输出','')
TERM=[['bash l02.sh','== req02.json  工具 10 个，input 6 条\n  …\n  function_call          exec_command({"cmd": "echo 你好，codex"})\n  function_call_output   Chunk ID: … Process exited with code 0 …','']]
S5=('在你的电脑上练习',RUNNOTE+' 本课新增 <code>show.py</code>，概览请求内容。')
PRAC=[('请求概览工具。',heredoc('show.py'),''),('跟踪一次 turn。',heredoc('l02.sh')+'\ncd codex/scratch && bash l02.sh',None)]
CHAL=('两轮工具调用','修改剧本：第 1 次请求调用 <code>exec_command</code> 执行 <code>ls</code>，第 2 次再执行 <code>pwd</code>，第 3 次回答。预测 exec --json 会输出几个 item.completed，req03 的 input 有几条。',
'<pre style="white-space:pre-wrap">def reply(n, body):\n    if n == 1: return [call("exec_command", {"cmd": "ls"}, "c1")]\n    if n == 2: return [call("exec_command", {"cmd": "pwd"}, "c2")]\n    return [msg("完成")]</pre><p>三个 item.completed（两个 command_execution、一个 agent_message），仍然只有一个 turn。req03 的 input 是 4 条初始消息 + 2 对（function_call, function_call_output）= 8 条。注意 call_id 要不同，否则两次输出会对应到同一个调用。</p>')
QUIZ=[['前端与内核交换什么？',['Submission(Op) 与 Event','直接函数调用','共享内存'],0,''],['一个 turn 中可以有几次模型请求？',['任意多次，直到不再调用工具','1 次','2 次'],0,''],['系统提示在请求的哪里？',['第一条 developer 消息','instructions 字段','HTTP 头'],0,''],['exec --json 最后一个事件？',['turn.completed','thread.started','item.started'],0,''],['处理 Op 的函数？',['submission_loop','run_tool','main'],0,'']]
