from common import *
TITLE='会话线程、中断与转向';MIN=45;NEXT='shell 与 unified exec'
DESC='pi 的 Agent 类有两个队列：steer（在当前工具调用后插入）与 follow-up（等 agent 空闲后再处理）。Codex 的对应物是<b>线程（thread）</b>与它的<b>输入队列</b>：当一个 turn 正在运行时提交新输入，会话不会开新 turn，而是把它“转向”进当前 turn；中断则取消正在执行的工具，并在历史里留下明确的痕迹，告诉模型“用户是故意打断的”。本课用一个约 60 行的 app-server 客户端，在真实 codex 中演示转向与中断。'
SUM=['<b>线程</b>：一个线程 = 一段可恢复的对话（有 id、历史、设置）；<code>ThreadManager</code> 管理多个线程，app-server 的 <code>thread/start</code>、<code>thread/resume</code>、<code>thread/fork</code> 操作它们。',
'<b>开始还是转向</b>（<code>session/turn_input.rs</code>）：这是内核里“唯一决定”输入去向的地方——有活动 turn 就调用 <code>steer_input</code> 排进去（返回 Steered，带同一个 turn id），否则启动新 turn（Started）。只有用户输入或独立的函数输出才能开始或转向。',
'<b>转向何时生效</b>：run_turn 每一圈开头取出排队输入（第 6 课）。实验中“顺便也看看 README”出现在 req02 的 function_call_output 之后——慢命令执行完、下一次请求之前。',
'<b>expectedTurnId</b>：<code>turn/steer</code> 必须带上期望的活动 turn id，不匹配就失败，避免把话插进错误的 turn。',
'<b>中断</b>：<code>Op::Interrupt</code>（app-server 的 <code>turn/interrupt</code>）取消 turn；正在运行的工具得到输出 “Wall time: 0.7 seconds⏎aborted by user”，turn 状态为 interrupted。下一次请求还会附上一条 <code>&lt;turn_aborted&gt;</code> 用户消息：“用户是故意中断的……被中止的命令可能已部分执行”。',
'<b>对比 pi</b>：pi 的 abort 只是停止；Codex 把中断写进历史，让模型下一轮知道发生了什么。']
S1=('转向与中断','')
A1=[('运行中','turn 正在执行 sleep 2。',[('t','turn（运行中）','sig',0,90,140),('c','sleep 2','',180,90,90)]),('转向','turn/steer → 排入输入队列 → 下一圈开头取出。',[('s','turn/steer','ok',0,90,110),('q','输入队列','',150,90,100),('n','req02 末尾','ok',290,90,110)]),('中断','turn/interrupt → 工具输出 aborted by user → 下一请求附 <turn_aborted>。',[('i','turn/interrupt','bad',0,90,130),('o','aborted by user','bad',170,90,140)])]
S2=('动手：会发生什么？','')
CHI=[('turn 运行中再次 turn/start','被当作转向（Steered），不会开新 turn','sig','start_or_steer。'),('turn/steer 的 expectedTurnId 写错','请求失败','bad',''),('中断正在运行的 exec_command','工具输出 “Wall time … aborted by user”，turn 状态 interrupted','ok',''),('中断后的下一次请求','多一条 <turn_aborted> 用户消息','ok','')]
CHH='选择一种操作。'
S3=('读代码','',X('codex-rs/core/src/session/turn_input.rs',[(1,12),(370,393)])+'<p>中止的工具输出：</p>'+X('codex-rs/core/src/tools/parallel.rs',[(375,384)])+'<p>中断提示：</p>'+X('codex-rs/core/src/context/turn_aborted.rs',[(10,14)])+'<p>app-server 的转向参数：</p>'+X('codex-rs/app-server-protocol/src/protocol/v2/turn.rs',[(317,322),(344,348)])+NOTE('<b>与 pi 对照</b>：'+pi(8,'Agent 类：状态、事件订阅、steering 与 follow-up')+'。'))
S4=('真实输出','')
TERM=[['bash l08.sh','== 2. 中断：慢命令运行时取消 turn\n  turn/completed   status=interrupted\n…\n  function_call_output   Wall time: 0.7 seconds ⏎ aborted by user\n  message   user   <turn_aborted> ⏎ The user interrupted the previous turn on p…','']]
S5=('在你的电脑上练习',RUNNOTE+' 本课新增 <code>apc.py</code>：一个最小的 app-server 客户端（JSON-RPC，每行一条消息），后面几课还会用到；run.sh 新增 <code>RUN</code> 变量，用来运行客户端脚本代替 codex exec。')
PRAC=[('更新 run.sh；app-server 客户端。',heredoc('run.sh')+'\n'+heredoc('apc.py'),''),('剧本：慢命令。',heredoc('s_steer.py'),''),('转向、中断、再继续。',heredoc('l08.py')+'\n'+heredoc('l08.sh')+'\ncd codex/scratch && bash l08.sh',None)]
CHAL=('转向两次','在第一个任务的慢命令运行期间，连续发两次 turn/steer（“A”和“B”）。预测 req02 的末尾，以及模型回答中的“最后一条用户消息”。',
'<p>两条都在慢命令结束后、下一次请求前一并取出，req02 末尾依次是 function_call_output、user “A”、user “B”；模型回答“收到（最后一条用户消息：B）”。两次 turn/steer 都返回同一个 turnId。</p>')
QUIZ=[['turn 运行中提交 turn/start 会？',['转向进当前 turn','开新 turn','报错'],0,''],['转向的输入何时进入请求？',['下一圈循环开头','立即打断模型','turn 结束后'],0,''],['被中断的命令的输出？',['aborted by user','空','原输出'],0,''],['中断后下一次请求多了什么？',['<turn_aborted> 用户消息','系统提示变化','什么都没有'],0,''],['expectedTurnId 的作用？',['防止插错 turn','加速','鉴权'],0,'']]
