from common import *
L3=open('/workspace/src/pi-mono/scratch/l03.ts').read()
TITLE='统一的消息模型与流式事件';MIN=50;NEXT='Provider 抽象、模型目录与凭据'
DESC='pi 支持几十家模型提供方，但上层代码只认识一种消息格式和一种事件流。这一课精读 <code>packages/ai/src/types.ts</code> 中的核心类型：四种消息角色（system、user、assistant、toolResult）、五种内容块、七种停止原因，以及把“流式回复”统一成一串有序事件的 <code>AssistantMessageEvent</code>。理解了这一层，后面的循环、会话、压缩、TUI 都只是在处理这些数据。'
SUM=['<b>Message</b>：<code>system</code>（指令、命名 sections、toolsAdded/toolsRemoved）、<code>user</code>（文本/图片）、<code>assistant</code>（文本、thinking、toolCall + usage、stopReason、provider/model）、<code>toolResult</code>（toolCallId、content、details、isError）。',
'<b>系统消息可以出现在转录中间</b>：后续的 system 消息按名称替换或删除 section（<code>null</code> 表示删除），并增减工具。把所有系统消息依次重放，就得到当前的提示与工具集。支持中途系统消息的提供方原样发送，不支持的则重建开头的系统消息。',
'<b>内容块</b>：<code>text</code>、<code>thinking</code>（可带不透明的 thinkingSignature 以便多轮回放，可被 redacted）、<code>image</code>、<code>toolCall</code>（id、name、arguments；若模型给出的参数不是合法 JSON，则 <code>arguments={}</code> 并设置 <code>argumentsError</code>）。',
'<b>StopReason</b>：<code>stop</code>、<code>length</code>、<code>toolUse</code>、<code>error</code>、<code>aborted</code>、<code>deferred</code>，以及流式进行中的 <code>pending</code>。循环据此决定下一步（例如 length 时，被截断的工具调用会被判为失败）。',
'<b>事件流</b>：<code>start</code> → 每个内容块的 <code>*_start / *_delta / *_end</code>（带 contentIndex）→ <code>done</code> 或 <code>error</code>。每个事件都带当前的 <code>partial</code> 消息快照，所以 UI 可以随时渲染完整状态。错误也以事件交付，而不是抛出异常。',
'<b>EventStream</b>：一个可异步迭代的推送队列，外加一个 <code>result()</code> Promise：遇到 done/error 时完成。提供方只管 <code>push</code>，消费者只管 <code>for await</code>。']
S1=('一条回复是怎么流进来的','模型说了：思考 → 文字 → 工具调用。')
A1=[('start','连接建立。partial 是一条空的 assistant 消息（stopReason=pending）。',[('m','partial: []','sig',0,60,200)]),
('thinking','thinking_start / delta / end，contentIndex=0。',[('m','partial: [thinking]','sig',0,60,200),('b0','0 thinking','ok',240,60,120)]),
('text','text_start / delta… / end，contentIndex=1，UI 逐字渲染。',[('m','partial: [thinking, text]','sig',0,60,200),('b0','0 thinking','',240,60,120),('b1','1 text','ok',380,60,100)]),
('toolCall','toolcall_delta 携带参数 JSON 片段；toolcall_end 给出解析好的 arguments。',[('m','partial: [thinking, text, toolCall]','sig',0,60,240),('b2','2 toolCall','ok',380,140,120)]),
('done','reason=toolUse，message 是最终消息；result() 完成。',[('m','AssistantMessage stopReason=toolUse','ok',0,60,300)])]
S2=('动手：循环看到这个 stopReason 会怎样？','停止原因决定循环接下来做什么。')
CHI=[('toolUse','有工具调用 → 执行这些工具，结果作为 toolResult 消息追加 → 下一个 turn。','ok','最常见的继续原因。'),
('stop','没有工具调用 → 检查 steering 队列、follow-up 队列；都为空则运行结束。','ok','正常结束。'),
('length','输出被 max tokens 截断。最后一个工具调用的参数可能不完整：\nfailToolCallsFromTruncatedMessage 把这些工具调用判为失败，\n而不是执行半截参数。','sig','“宁可失败也不执行被截断的命令”。'),
('error','消息里带 errorMessage。agent_end 后 AgentSession 判断是否可重试（如过载、限流），可能自动重试；上下文溢出则可能触发压缩。','bad','错误是数据，不是异常：循环始终能产出一条完整的 assistant 消息。'),
('aborted','用户按了 Esc（AbortSignal）。已经流出的部分内容被保留在消息里。','bad','中止后，会话仍然一致，可以继续对话。')]
CHH='选择一个停止原因。'
S3=('读代码：类型定义','这些类型是整个 pi 的“通用语言”。','''<p>内容块：</p>'''+X('packages/ai/src/types.ts',[(422,457)])+'''<p>停止原因与系统消息：</p>'''+X('packages/ai/src/types.ts',[(489,489),(561,577)])+'''<p>assistant 消息（节选）：</p>'''+X('packages/ai/src/types.ts',[(585,600)])+'''<p>流式事件：</p>'''+X('packages/ai/src/types.ts',[(822,837)])+'''<p>事件流本身是个很小的类：</p>'''+X('packages/ai/src/utils/event-stream.ts',[(97,113)])+NOTE('<b>与 Codex 对照</b>：Codex 直接以 OpenAI Responses API 的 <code>ResponseItem</code> 为内部转录格式，并在其上定义了自己的协议层（<code>EventMsg</code>）。pi 选择自己定义一个与提供方无关的最小模型，再为每个 API 写转换。见 '+codex(3,'协议与 ResponseItem')+'。'))
S4=('事件序列','faux 提供方像真实提供方一样分块输出。')
TERM=[['node l03.ts','start           - \nthinking_start  0 \nthinking_delta  0 "先看文件"\nthinking_end    0 \ntext_start      1 \ntext_delta      1 "我来读一下。"\ntext_end        1 \ntoolcall_start  2 \ntoolcall_delta  2 "{\\"path\\":\\"a.txt\\"}"\ntoolcall_end    2 {"path":"a.txt"}\ndone            - \nstopReason = toolUse | 内容块 = thinking,text,toolCall','每个内容块都有 start/delta/end，contentIndex 指向它在 content 数组中的位置。']]
S5=('在你的电脑上练习','直接使用 pi-ai 的 <code>streamSimple</code>，不经过 agent，观察原始事件。')
PRAC=[('写脚本：脚本化的回复包含 thinking、文本和工具调用。','cat > pi-mono/scratch/l03.ts <<\'EOF\'\n'+L3+'EOF\ncd pi-mono/scratch && node l03.ts',None),
('看看 faux 提供方如何把文本切成小块（每块 3–5 个 token），这就是 delta 的来源。','cd pi-mono && grep -n "DEFAULT_MIN_TOKEN_SIZE\\|DEFAULT_MAX_TOKEN_SIZE" packages/ai/src/providers/faux.ts | head -4',None)]
CHAL=('渲染器','写一个最小渲染器：只用事件（不读 <code>partial</code>），在终端里实时拼出最终文本，并在 <code>toolcall_end</code> 时打印 <code>⚙ read(a.txt)</code>。然后思考：为什么每个事件还要带上 <code>partial</code>？',
'<pre>let out = "";\nfor await (const e of s) {\n  if (e.type === "text_delta") { process.stdout.write(e.delta); out += e.delta; }\n  if (e.type === "toolcall_end") console.log(`\\n⚙ ${e.toolCall.name}(${e.toolCall.arguments.path})`);\n  if (e.type === "error") console.error("错误:", e.error.errorMessage);\n}</pre><p>带上 <code>partial</code> 的原因：订阅者可能中途加入（例如 TUI 重绘、扩展在 <code>message_update</code> 中检查内容），或者只关心“此刻完整的样子”而不想自己维护拼接状态。增量（delta）适合高效追加，快照（partial）适合无状态渲染；pi 两者都给。</p>')
QUIZ=[['模型的工具参数不是合法 JSON 时？',['arguments 为 {} 并设置 argumentsError，参数校验失败','抛出异常','直接执行'],0,''],
['表示输出被 max tokens 截断的停止原因是？',['length','stop','aborted'],0,''],
['转录中途的 system 消息可以？',['替换/删除命名 section、增减工具','只能追加文字','不允许'],0,''],
['流式错误如何交付？',['作为 error 事件，带一条完整的 assistant 消息','抛出异常','静默丢弃'],0,''],
['contentIndex 指的是？',['该内容块在 assistant.content 数组中的下标','第几个 turn','第几条消息'],0,'']]
