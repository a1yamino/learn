from common import *
L8=open('/workspace/src/pi-mono/scratch/l08.ts').read()
TITLE='Agent 类：状态、事件订阅、steering 与 follow-up';MIN=50;NEXT='编码工具集：read、write、ls、grep、find'
DESC='<code>runAgentLoop</code> 是无状态的函数；<code>Agent</code> 类（<code>packages/agent/src/agent.ts</code>）把它包装成一个有状态的对象：持有转录与运行时状态、把循环事件“归约”进状态再分发给订阅者、管理两个消息队列、提供中止。理解它，你就理解了“用户在 agent 工作时插话”到底是怎么实现的。'
SUM=['<b>AgentState</b>：<code>systemPrompt</code>、<code>model</code>、<code>thinkingLevel</code>、<code>tools</code>、<code>messages</code>，以及运行时字段 <code>isStreaming</code>、<code>streamingMessage</code>（正在流入的消息）、<code>pendingToolCalls</code>、<code>errorMessage</code>。',
'<b>processEvents</b>：每个循环事件先更新状态（message_end 时把消息加入 <code>messages</code>；tool_execution_start/end 维护 pendingToolCalls），再<b>依次 await</b> 每个订阅者。订阅者变慢，循环就等待——这保证了持久化等副作用的顺序。',
'<b>两个队列</b>：<code>steer()</code> 进入 steering 队列，在当前 turn 的工具执行完后、下一次模型请求前注入；<code>followUp()</code> 进入 follow-up 队列，只在 agent 本来要停下时注入。正在执行的工具不会被跳过。',
'<b>队列模式</b>：<code>one-at-a-time</code>（默认）每次只取一条，每条插话都得到一次单独的模型回复；<code>all</code> 一次取出全部。',
'<b>单一活动运行</b>：运行中调用 <code>prompt()</code> 会抛错并提示使用 steer/followUp；<code>continue()</code> 从现有转录继续（最后一条是 assistant 时，先消费队列）。',
'<b>中止</b>：<code>abort()</code> 触发当前运行的 AbortSignal；工具与提供方都收到它。运行中的未预期异常被转换为一条 error/aborted 的 assistant 消息，事件序列保持完整。<code>waitForIdle()</code> 在 agent_end 的订阅者全部完成后才 resolve。']
S1=('插话是怎么进入转录的','steering 模式 one-at-a-time。')
A1=[('工具执行中','模型请求了 wait 工具，正在执行。用户插话 A、B。',[('t','wait 执行中','sig',0,60,140),('q','steering: [A, B]','',200,60,180)]),
('turn 结束','工具结果写入。循环调用 getSteeringMessages()：取出 A。',[('t','toolResult','ok',0,60,140),('q','steering: [B]','',200,60,180),('a','user: A','sig',420,60,100)]),
('下一个 turn','模型看到 A，回复 1。没有工具调用，但队列里还有 B。',[('q','steering: [B]','sig',200,60,180),('r','回复1','ok',420,60,100)]),
('再一个 turn','取出 B，模型回复 2。队列空，运行结束。',[('q','steering: []','',200,60,180),('r','回复2','ok',420,60,100)])]
S2=('动手：选择操作','agent 正在执行一个工具。')
CHI=[('steer("插话") ×2，one-at-a-time','… toolResult | user:插话A | assistant:回复1 | user:插话B | assistant:回复2','ok','每条插话一次模型回复。'),
('steer ×2，all','… toolResult | user:插话A | user:插话B | assistant:回复1','ok','一次注入全部，节省请求。'),
('followUp("之后再做 X")','当前任务全部结束（模型不再调用工具）后，才注入并开始新一轮。','ok','适合“排队下一个任务”。'),
('prompt("新任务")','Error: Agent is already processing a prompt. Use steer() or followUp() to queue messages, or wait for completion.','bad',''),
('abort()','AbortSignal 触发：wait 工具抛出“被中止” → 错误结果；随后的模型请求以 aborted 结束；isStreaming 变回 false。','bad','转录始终保持可继续的状态。')]
CHH='选择一个操作。'
S3=('读代码','','''<p>队列本身很简单：</p>'''+X('packages/agent/src/agent.ts',[(149,179)])+'''<p>Agent 把队列接到循环配置上：</p>'''+X('packages/agent/src/agent.ts',[(476,480),(506,514)])+'''<p>prompt 与运行生命周期：</p>'''+X('packages/agent/src/agent.ts',[(382,391),(517,540)])+'''<p>事件归约：</p>'''+X('packages/agent/src/agent.ts',[(575,596),(614,622)])+NOTE('<b>与 Codex 对照</b>：Codex 中这一层是“会话/线程”：界面通过提交队列发送 <code>Op::UserInput</code>、<code>Op::Interrupt</code> 等操作，正在进行的 turn 可以接收追加输入。Codex 还在此之上实现了长时间运行任务的 <code>/goal</code>。见 '+codex(8,'会话线程、中断与转向')+' 与 '+codex(20,'/goal')+'。'))
S4=('真实输出','')
TERM=[['node l08.ts','== steeringMode=one-at-a-time\n   user:开始 | assistant:<toolCall:wait> | toolResult:done | user:插话A | assistant:回复1 | user:插话B | assistant:回复2\n== steeringMode=all\n   user:开始 | assistant:<toolCall:wait> | toolResult:done | user:插话A | user:插话B | assistant:回复1','两种队列模式的差别。']]
S5=('在你的电脑上练习','用 Agent 类实验两种队列模式、并发 prompt 与 abort。')
PRAC=[('写脚本并运行。','cat > pi-mono/scratch/l08.ts <<\'EOF\'\n'+L8+'EOF\ncd pi-mono/scratch && node l08.ts',None)]
CHAL=('慢订阅者','给 agent 添加一个订阅者：在 <code>message_end</code> 时 <code>await</code> 300ms（模拟写磁盘）。总运行时间如何变化？如果改成不 await（fire-and-forget），会有什么风险？',
'<p>processEvents 会依次 await 每个订阅者，所以每条完成的消息都会让循环多等 300ms：本例中约 5 条消息 → 运行时间增加约 1.5 秒。这是有意的设计：AgentSession 的持久化就在 message_end 订阅者里，保证消息按顺序、在下一步开始前写入。</p><p>如果不 await，循环不会等待，但可能出现：进程在写入完成前退出导致会话丢失消息；多次写入交错导致顺序错乱；<code>waitForIdle()</code> resolve 时数据其实还没落盘。真正需要慢操作又不想阻塞时，应在订阅者内部自己排队并在合适时机刷新。</p>')
QUIZ=[['steer 的消息何时注入？',['当前 turn 的工具执行完后、下一次模型请求前','立即中断工具','运行结束后'],0,''],
['followUp 的消息何时注入？',['agent 本来要停下时','下一个 turn','立即'],0,''],
['one-at-a-time 模式下两条 steering 消息？',['分两个 turn 各取一条','一次全部取出','只取最后一条'],0,''],
['运行中再次调用 prompt？',['抛错，提示使用 steer/followUp','排队','覆盖'],0,''],
['订阅者是如何被调用的？',['依次 await','并发，不等待','在另一个线程'],0,'']]
