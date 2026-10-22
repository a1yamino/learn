from common import *
FS=open('/workspace/src/pi-mono/scratch/faux-session.ts').read()
L2=open('/workspace/src/pi-mono/scratch/l02.ts').read()
TITLE='一次对话的生命周期：从输入到回复';MIN=50;NEXT='统一的消息模型与流式事件'
DESC='在深入每一层之前，先完整地跟踪一次请求：用户在编辑器里按下回车，文本经过扩展命令、输入钩子、技能与提示模板展开，进入 AgentSession；会话检查模型与凭据后启动一次 agent 运行；agent 循环构造请求、流式接收模型回复、执行工具、把结果写回上下文，直到模型不再调用工具；每条完成的消息通过事件被持久化到会话文件，并被渲染到终端。本课建立这张“全景图”，并写一个后续各课都会用到的练习工具 <code>faux-session.ts</code>。'
SUM=['<b>三个层次的对象</b>：<code>AgentSession</code>（coding-agent：输入处理、会话持久化、压缩、扩展、重试）包着 <code>Agent</code>（agent-core：状态与事件）；<code>Agent</code> 运行 <code>runLoop</code>（agent-core：循环本身）；循环通过 <code>streamFn</code> 调用 pi-ai。',
'<b>输入处理顺序</b>（<code>AgentSession.prompt</code>）：扩展命令（<code>/name</code>，立即执行，不进入模型）→ 输入事件（扩展可拦截或改写）→ 技能命令 <code>/skill:name</code> 展开 → 提示模板展开 → 若正在运行则按 steer / followUp 排队 → 校验模型和凭据 → 启动运行。',
'<b>一次运行 = 若干个 turn</b>：每个 turn 是“一次模型回复 + 执行它请求的全部工具”。模型的回复里有工具调用，就需要下一个 turn 把结果交给模型；没有工具调用（也没有排队的消息）时，运行结束。',
'<b>事件驱动</b>：循环只发出事件（<code>agent_start</code>、<code>turn_start</code>、<code>message_start/update/end</code>、<code>tool_execution_*</code>、<code>turn_end</code>、<code>agent_end</code>），界面渲染、会话持久化、扩展钩子都是事件的订阅者。<code>AgentSession</code> 在 <code>message_end</code> 时把完成的消息追加到会话。',
'<b>agent_end 与 agent_settled</b>：<code>agent_end</code> 表示一次底层运行结束；之后可能还有自动重试、自动压缩或排队的消息。<code>agent_settled</code> 才表示 pi 不会再自动继续。',
'<b>系统消息也是消息</b>：pi 把系统提示与工具声明作为转录中的第一条 <code>system</code> 消息（带命名的 sections 与 toolsAdded），后续的变化以新的系统消息追加——第 3 课详述。']
S1=('一次回车之后','从编辑器到模型，再回到屏幕。')
A1=[('输入','用户输入“读一下 hello.txt”，回车。',[('ed','编辑器','sig',0,60,120)]),
('AgentSession.prompt','扩展命令？输入钩子？技能、模板展开？正在运行就排队；否则检查模型与凭据。',[('ed','编辑器','',0,60,120),('as','AgentSession','sig',160,60,160)]),
('Agent → runLoop','启动运行。第一个 turn：把转录发给模型。',[('as','AgentSession','',160,60,160),('lp','runLoop','sig',360,60,120),('ai','pi-ai → 模型','',520,60,140)]),
('工具调用','模型回复里有 read 工具调用：执行它，结果追加到上下文。',[('lp','runLoop','sig',360,60,120),('ai','pi-ai → 模型','',520,60,140),('tl','read 工具','ok',360,140,120)]),
('第二个 turn','把工具结果交给模型；这次回复只有文本，没有工具调用：运行结束。',[('lp','runLoop','ok',360,60,120),('ai','pi-ai → 模型','ok',520,60,140)]),
('事件','每条完成的消息作为 message_end 事件：TUI 渲染、SessionManager 写入 JSONL、扩展收到通知。',[('lp','runLoop','',360,60,120),('ev','事件','sig',360,140,120),('ui','TUI','ok',160,220,100),('sm','会话文件','ok',300,220,120),('ex','扩展','ok',460,220,100)])]
S2=('动手：这段输入会怎样？','pi 对不同输入的处理路径不同。选择一种输入。')
CHI=[('普通文本','“修复 utils.ts 里的类型错误”\n\n→ 输入钩子（扩展可改写）\n→ 不以 / 开头，无需展开\n→ 校验模型与凭据\n→ _startRun：作为 user 消息进入 agent','ok','最常见的路径。'),
('/review（扩展命令）','“/review src/”\n\n→ _tryExecuteExtensionCommand 找到命令\n→ 立即执行 handler(args, ctx)\n→ 不会作为 user 消息发给模型\n  （命令可以自己调用 pi.sendMessage）','sig','扩展命令在其他处理之前，甚至在 agent 运行中也会立即执行。'),
('/skill:pdf 提取第 3 页','→ _expandSkillCommand：读取技能文件\n→ 替换为\n  <skill name="pdf" location="...">\n  References are relative to ...\n  （技能正文）\n  </skill>\n\n  提取第 3 页\n→ 作为 user 消息发送','ok','技能的完整说明只在被调用时才进入上下文（第 12 课）。'),
('运行中再输入（Enter）','agent 正在执行工具时，用户又输入“顺便更新 README”\n\n→ isStreaming 为真\n→ 必须指定 streamingBehavior\n  steer：当前 turn 的工具执行完后、下一次模型调用前插入\n  followUp：等 agent 本来要停下时再处理','sig','交互模式中，Enter 和 Alt+Enter 分别对应 steer 与 follow-up（Windows 上 follow-up 为 Ctrl+Q，均可配置）。第 8 课详解两个队列。'),
('没有 API key','→ hasConfiguredAuth 为假\n→ 抛出错误：No API key found for <provider>.\n  Use /login to log into a provider ...','bad','校验在启动运行之前完成，不会产生半截的会话记录。')]
CHH='选择一种输入。'
S3=('读代码：AgentSession.prompt 与持久化','两个关键位置：输入如何进入 agent；完成的消息如何写入会话。','''<p>输入处理，按顺序：</p>'''+X('packages/coding-agent/src/core/agent-session.ts',[(2099,2108),(2116,2134),(2136,2150),(2172,2174)])+'''<p>持久化不是循环的职责，而是事件的订阅者：</p>'''+X('packages/coding-agent/src/core/agent-session.ts',[(1142,1144),(1146,1147),(1158,1166)])+'''<p>注意顺序：先通知扩展，再通知公共订阅者（例如 TUI），最后持久化。循环本身完全不知道“会话文件”的存在——这正是 agent-core 可以被其他应用复用的原因。</p>'''+NOTE('<b>与 Codex 对照</b>：Codex 把这条通路做成了显式的<b>提交队列 / 事件队列</b>协议：界面提交 <code>Op</code>（如 <code>UserInput</code>），核心发出 <code>Event</code>，二者可以在不同进程甚至不同机器上。见 '+codex(2,'一次 turn 的生命周期')+'。'))
S4=('事件流','运行练习脚本后，用订阅打印出的事件。')
TERM=[['node l02.ts','[工具开始] read {"path":"hello.txt"}\n[turn_end] 本轮工具结果 1 个\n[turn_end] 本轮工具结果 0 个\n[agent_settled]','两个 turn：第一个执行了 read，第二个只返回文本。'],
['# 转录中的消息','system      sections=preamble,tools,rules,docs,skills,cwd tools=read,bash,edit,write\nuser        …\nassistant   [{"type":"toolCall", … "name":"read" …}]\ntoolResult  [{"type":"text","text":"你好，pi\\n"}]\nassistant   [{"type":"text","text":"文件里写着：你好，pi"}]','五条消息：系统、用户、带工具调用的助手、工具结果、最终回复。']]
S5=('在你的电脑上练习','写一个后续各课都会复用的工具：用 faux 模型创建真实的 <code>AgentSession</code>（使用真实的内置工具、真实的会话逻辑），然后跟踪一次完整的请求。')
PRAC=[('<code>scratch/faux-session.ts</code>：注册 faux provider，把它登记到 <code>ModelRuntime</code>（这样会话的凭据检查能通过），再用 SDK 的 <code>createAgentSession</code> 创建会话。工作目录是一个临时目录。','cat > pi-mono/scratch/faux-session.ts <<\'EOF\'\n'+FS+'EOF',''),
('跟踪一次请求：脚本化的模型先调用真实的 <code>read</code> 工具，再回答。','cat > pi-mono/scratch/l02.ts <<\'EOF\'\n'+L2+'EOF\ncd pi-mono/scratch && node l02.ts',None),
('读一下真实的系统提示的开头（它来自 coding-agent 的 system-prompt.ts，第 12 课详解）。','cd pi-mono/scratch && cat > sp.ts <<\'EOF\'\nimport { fauxAssistantMessage } from "@earendil-works/pi-ai/compat";\nimport { fauxSession } from "./faux-session.ts";\nconst { session } = await fauxSession([fauxAssistantMessage("ok")]);\nconsole.log(session.systemPrompt.split("\\n").slice(0, 8).join("\\n"));\nsession.dispose();\nEOF\nnode sp.ts',None)]
CHAL=('steer 与 followUp','修改 <code>l02.ts</code>：在收到第一个 <code>tool_execution_start</code> 事件时调用 <code>session.steer("另外也看看 notes.txt")</code>，并为 faux 模型多准备一条回复。预测并验证：转录中这条 user 消息出现在哪里？如果改用 <code>session.followUp(...)</code> 呢？',
'<p><b>steer</b>：消息在当前 turn 的工具执行完成之后、下一次模型调用之前进入转录。顺序是：system、user、assistant(read)、toolResult、<b>user(另外也看看…)</b>、assistant(…)。</p><p><b>followUp</b>：等 agent 本来要停下（模型回复没有工具调用、也没有 steering 消息）时才进入，因此出现在最终回复<b>之后</b>，并触发新的一轮：…、assistant(文件里写着…)、<b>user(另外也看看…)</b>、assistant(…)。</p><p>对应的代码在 <code>agent-loop.ts</code> 的 <code>runLoop</code>：内层循环每个 turn 结束后读取 <code>getSteeringMessages()</code>；外层循环在要退出前读取 <code>getFollowUpMessages()</code>（第 6 课逐行讲解）。别忘了给 faux 模型准备足够的回复，否则会报 “No more faux responses queued”。</p>')
QUIZ=[['以 / 开头的扩展命令会？',['立即执行 handler，不作为 user 消息发给模型','直接发给模型','被忽略'],0,''],
['一个 turn 包含？',['一次模型回复及其请求的全部工具执行','一条用户消息','一次会话'],0,''],
['会话持久化发生在哪里？',['AgentSession 订阅 message_end 事件时','runLoop 内部','pi-ai 中'],0,''],
['agent 运行中提交新消息却不指定 steer/followUp？',['抛出错误','自动丢弃','自动 steer'],0,'SDK 要求调用者明确选择。'],
['表示 pi 不会再自动继续的事件是？',['agent_settled','agent_end','turn_end'],0,'']]
