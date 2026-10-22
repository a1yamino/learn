from common import *
TITLE='run_turn 循环';MIN=45;NEXT='工具规格、路由与并行'
DESC='pi 的 <code>runLoop</code> 只有 159 行。Codex 的 <code>run_turn</code>（<code>core/src/session/turn.rs</code>）是它的“生产版本”：同样是“请求模型 → 执行工具 → 再请求”的循环，但每一圈都要处理排队的用户输入、钩子、上下文窗口检查、自动压缩、Stop 钩子要求继续等。本课抓住它的骨架：<b>needs_follow_up</b> 如何决定是否再来一圈，并用三个场景验证。'
SUM=['<b>骨架</b>：<code>loop { 取出排队输入 → 记录 → 捕获本步上下文 → run_sampling_request → 计算 needs_follow_up → 可能压缩 → 若不需继续则跑 Stop 钩子并 break }</code>。',
'<b>needs_follow_up = 模型需要继续 || 有排队输入</b>。模型需要继续 ⇔ 本次响应中出现了工具调用（<code>stream_events_utils.rs</code> 中处理每个输出项时置位）。只回文字就结束 turn；文字与工具调用并存时仍然继续（场景 b）。',
'<b>边流边执行</b>：每个工具调用在 <code>output_item.done</code> 到达时就立即派发（注释：“handle_tool_call dispatches immediately”），不等整个响应结束；未完成的调用进入 <code>in_flight</code> 队列，响应结束后统一等待。',
'<b>并行与顺序</b>：场景 c 中 echo B 先于 echo A 完成（事件按完成顺序），但写回历史的 function_call_output 保持调用顺序。',
'<b>自动压缩</b>：每圈之后检查 token 状态，超过阈值就在 turn 中途或结束后压缩（第 16 课）。',
'<b>Stop 钩子</b>：turn 将要结束时运行；钩子可以阻止结束并注入一条继续提示（<code>should_block</code> → <code>continue</code>），这是 /goal 之外另一种“让 agent 继续干活”的机制（第 21 课）。']
S1=('一圈循环','')
A1=[('请求','发送历史 + 排队输入。',[('h','历史','',0,90,80),('m','模型','sig',130,90,80)]),('流式','output_item.done 到达即派发工具。',[('m','模型','sig',0,90,80),('t1','exec A','ok',130,40,90),('t2','exec B','ok',130,140,90)]),('判断','有工具调用或排队输入 → 再来一圈；否则 Stop 钩子 → 结束。',[('f','needs_follow_up?','sig',0,90,170),('y','loop','ok',220,40,70),('n','break','bad',220,140,70)])]
S2=('动手：会再请求一次吗？','')
CHI=[('响应只有文字','不会，turn 结束（1 次请求）','ok',''),('文字 + 工具调用','会（2 次请求）','ok','只要有工具调用就要把结果交给模型。'),('两个工具调用','会，两者并行执行后一起回传','ok',''),('只有文字，但用户在此期间又输入了一句','会：has_pending_input','sig',''),('Stop 钩子返回 block','会：注入钩子提示后 continue','sig','')]
CHH='选择一种情况。'
S3=('读代码','',X('codex-rs/core/src/session/turn.rs',[(460,483),(578,609)])+'<p>结束分支与 Stop 钩子：</p>'+X('codex-rs/core/src/session/turn.rs',[(723,757)])+'<p>工具调用立即派发并置位 needs_follow_up：</p>'+X('codex-rs/core/src/stream_events_utils.rs',[(349,369)])+NOTE('<b>与 pi 对照</b>：'+pi(6,'Agent 循环：runLoop 逐行精读')+'。pi 在 assistant 消息完整结束后才执行工具；Codex 在流式过程中就开始执行。'))
S4=('真实输出','')
TERM=[['bash l06.sh','== 场景 c\n  item.completed command_execution /bin/bash -lc \'echo B\'\n  item.completed command_execution /bin/bash -lc \'echo A\'\n  item.completed agent_message 两个都执行了\n  请求次数：2','']]
S5=('在你的电脑上练习',RUNNOTE)
PRAC=[('三个场景的剧本。',heredoc('s_loop.py'),''),('运行并比较。',heredoc('l06.sh')+'\ncd codex/scratch && bash l06.sh',None)]
CHAL=('证明“边流边执行”','设计实验证明工具在响应流结束前就开始执行：让 mock 在发出 function_call 的 output_item.done 之后 sleep 2 秒再发 response.completed，工具执行 <code>date +%s.%N</code>，比较命令时间与 mock 发送 completed 的时间。',
'<p>在 mock.py 的循环里，对带 <code>"sleep_after": 2</code> 的项在发送后 <code>time.sleep(2)</code>，并在发 <code>response.completed</code> 前打印 <code>time.time()</code>。命令输出的时间戳会比 completed 早约 2 秒，说明工具在 output_item.done 到达时就派发了。这正对应源码注释 “handle_tool_call dispatches immediately, not when its future is polled”（有 post-model 钩子时会延后）。</p>')
QUIZ=[['什么让 turn 继续？',['工具调用或排队输入','响应很长','超时'],0,''],['工具何时开始执行？',['output_item.done 到达时','响应全部结束后','下一次请求时'],0,''],['并行调用的结果在历史中的顺序？',['按调用顺序','按完成顺序','随机'],0,''],['Stop 钩子可以？',['阻止结束并注入继续提示','修改模型','删除历史'],0,''],['run_turn 在哪个文件？',['core/src/session/turn.rs','tui/src/app.rs','exec/src/lib.rs'],0,'']]
