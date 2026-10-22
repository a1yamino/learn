from common import *
L6=open('/workspace/src/pi-mono/scratch/l06.ts').read()
TITLE='Agent 循环：runLoop 逐行精读';MIN=60;NEXT='工具调用：参数校验、并行执行与钩子'
DESC='整个编码 agent 的“心脏”只有大约 160 行：<code>packages/agent/src/agent-loop.ts</code> 中的 <code>runLoop</code>。它由两层 while 组成：内层处理“工具调用与 steering”，外层处理“follow-up”。本课逐段阅读它，再直接调用底层的 <code>runAgentLoop</code>（不经过 Agent 类），用四个场景验证每条分支：连续工具调用、输出被截断、钩子提前结束、follow-up 续跑。'
SUM=['<b>入口</b>：<code>runAgentLoop(prompts, context, config, emit, signal, streamFn)</code> 发出 agent_start、turn_start 和提示消息，然后进入 <code>runLoop</code>。<code>runAgentLoopContinue</code> 从现有上下文继续（最后一条不能是 assistant）。',
'<b>内层循环条件</b>：<code>hasMoreToolCalls || pendingMessages.length &gt; 0</code>。每圈：（非首圈）<code>prepareNextTurn</code> 钩子 → 把排队的消息写入上下文 → <code>prepareRequest</code> 钩子 → <code>streamAssistantResponse</code> → 执行工具 → <code>finishTurn</code> 钩子 → <code>turn_end</code> → 读 steering 队列。',
'<b>硬退出</b>：stopReason 为 error 或 aborted 时立即 turn_end + agent_end 并返回，不执行任何工具。',
'<b>截断保护</b>：stopReason 为 length 时，消息中的所有工具调用都被判为失败（可能带着被截断的参数，例如 <code>rm -rf /tm</code>），模型在下一轮看到错误结果。',
'<b>外层循环</b>：内层结束（没有工具调用、没有 steering）时读 follow-up 队列；有就作为 pending 继续；<code>finishTurn</code> 返回 continue 时额外跑一个只基于上下文的 turn；否则退出并发出 agent_end。',
'<b>streamAssistantResponse</b>：<code>transformContext</code>（AgentMessage 层面的变换，如裁剪）→ <code>convertToLlm</code>（过滤/转换自定义消息）→ 每次请求重新解析 API key（应对过期令牌）→ 把 partial 消息放进上下文并随事件不断替换 → done/error 时换成最终消息并发出 message_end。',
'<b>工具声明</b>：<code>declareToolChanges</code> 比较“转录中已声明的工具”与 <code>context.tools</code>，差异作为 system 消息（toolsAdded/toolsRemoved）插入。所以练习输出的新消息里第一条是 system。']
S1=('两层循环','内层：工具与 steering；外层：follow-up。')
A1=[('turn 1','请求模型 → 回复含工具调用 → 执行 → turn_end。hasMoreToolCalls=true。',[('in','内层循环','sig',0,60,160),('m','模型','',220,60,100),('t','工具','ok',360,60,100)]),
('turn 2','再次请求，模型看到工具结果 → 又一个工具调用 → 执行。',[('in','内层循环','sig',0,60,160),('m','模型','',220,60,100),('t','工具','ok',360,60,100)]),
('turn 3','回复只有文本。hasMoreToolCalls=false；steering 队列为空 → 退出内层。',[('in','内层循环','ok',0,60,160),('m','模型','',220,60,100)]),
('外层检查','follow-up 队列有消息？有 → 作为 pending 回到内层。',[('out','外层循环','sig',0,150,160),('q','follow-up 队列','',220,150,160)]),
('结束','都没有 → agent_end。',[('out','外层循环','ok',0,150,160),('end','agent_end','ok',220,150,120)])]
S2=('动手：预测循环的行为','选择一个场景，看循环如何反应（与练习脚本的真实输出一致）。')
CHI=[('两次工具调用后回答','模型请求 3 次\nturn_start → 工具(成功) → turn_end → turn_start → 工具(成功) → turn_end → turn_start → turn_end → agent_end','ok',''),
('输出被截断（length）','模型请求 2 次\n工具调用 echo("rm -rf /tm") 被判为错误，不执行\n模型在下一轮看到错误，重新回答','sig','永远不要执行被截断的参数。'),
('finishTurn 返回 end','模型请求 1 次\n工具执行完成后立即 agent_end，不再请求模型','sig','AgentSession 用这类钩子实现例如“达到上限就停”的策略。'),
('提供 follow-up 消息','第一次回答后，外层循环取到“再说一次” → 内层再跑一个 turn','ok',''),
('模型返回 error','立即 turn_end → agent_end，返回\n（工具不执行，队列不读取）','bad','重试由上层 AgentSession 决定。')]
CHH='选择一个场景。'
S3=('读代码：runLoop','完整阅读下面的代码；每段后面是要点。','''<p>内层循环的开头：准备下一个 turn、写入排队消息、准备请求：</p>'''+X('packages/agent/src/agent-loop.ts',[(172,190),(220,229)])+'''<p>请求模型，以及两种出口（硬退出、正常工具执行）：</p>'''+X('packages/agent/src/agent-loop.ts',[(250,305)])+'''<p>turn 结束后的决策与外层循环：</p>'''+X('packages/agent/src/agent-loop.ts',[(306,330)])+'''<p>流式回复如何进入上下文：</p>'''+X('packages/agent/src/agent-loop.ts',[(390,420),(452,467)])+NOTE('<b>与 Codex 对照</b>：Codex 的对应物是 <code>codex-rs/core</code> 中的 turn 执行：采样一次、处理输出项、执行工具调用、若需要后续就继续采样。它在同一位置还要处理沙箱与审批的结果、自动压缩、以及 turn 级的计划/目标状态。见 '+codex(6,'run_turn 循环')+'。'))
S4=('四个场景','')
TERM=[['node l06.ts','== 两次工具调用：模型请求 3 次\n== 输出被截断：模型请求 2 次\n   事件: … tool_execution_end(错误) …\n== finishTurn 提前结束：模型请求 1 次\n== follow-up：模型请求 2 次','完整输出见下方练习。']]
S5=('在你的电脑上练习','直接调用 <code>runAgentLoop</code>。用 <code>transformContext</code> 统计模型请求次数（它在每次请求前被调用一次）。')
PRAC=[('写脚本并运行四个场景。','cat > pi-mono/scratch/l06.ts <<\'EOF\'\n'+L6+'EOF\ncd pi-mono/scratch && node l06.ts',None),
('数一数 runLoop 有多长：','cd pi-mono && awk \'/^async function runLoop/{s=NR} s&&/^}/{print "runLoop:", NR-s+1, "行"; exit}\' packages/agent/src/agent-loop.ts',None)]
CHAL=('实现“最多 N 个 turn”','用 <code>finishTurn</code> 实现一个上限：第 3 个 turn 结束时停止运行，即使模型还想调用工具。用“无限调用工具”的脚本化模型（准备 10 条工具调用回复）验证模型只被请求 3 次。',
'<pre>let turns = 0;\nawait run("上限 3", Array.from({ length: 10 }, (_, i) => call(String(i))), {\n  finishTurn: async () => (++turns >= 3 ? { action: "end" } : undefined),\n});\n// == 上限 3：模型请求 3 次\n//    新消息: system, user, assistant(toolUse), toolResult ×3 组</pre><p><code>finishTurn</code> 在工具结果已经发出之后、<code>turn_end</code> 之前调用；返回 <code>{action:"end"}</code> 时循环发出 agent_end 并返回，不读任何队列。返回 undefined 保持正常调度。注意转录仍然一致：最后一个工具调用有对应的结果。</p>')
QUIZ=[['内层循环继续的条件是？',['有更多工具调用或有待处理的消息','模型返回 stop','用户按回车'],0,''],
['stopReason=length 且含工具调用时？',['所有工具调用判为失败，不执行','执行工具','直接结束'],0,''],
['follow-up 队列何时被读取？',['内层循环结束、agent 本来要停下时','每个 turn 结束时','运行开始时'],0,''],
['API key 何时解析？',['每次模型请求之前','运行开始时一次','从不'],0,'应对执行长工具期间令牌过期。'],
['transformContext 与 convertToLlm 的区别？',['前者在 AgentMessage 层面变换，后者转换为 LLM 消息','完全相同','后者先执行'],0,'']]
