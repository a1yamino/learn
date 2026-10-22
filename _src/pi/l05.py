from common import *
L5=open('/workspace/src/pi-mono/scratch/l05.ts').read()
TITLE='适配真实 API：消息转换与流式解析';MIN=55;NEXT='Agent 循环：runLoop 逐行精读'
DESC='上一课的 Provider 只是配置；真正的工作在 <code>packages/ai/src/api/</code> 里：每种 API 协议一个文件（openai-completions 1754 行、anthropic-messages 1703 行……）。每个实现做三件事：<b>把统一转录转换成该 API 的请求</b>，<b>把该 API 的流式响应解析成统一事件</b>，<b>把各种错误和停止原因归一化</b>。本课用一个本地的假 Chat Completions 服务器，亲眼看这三件事发生。'
SUM=['<b>请求方向</b>：<code>transformMessages</code>（所有协议共用）先做跨模型清理，再由各协议的 <code>convertMessages</code> 转成线上格式（如 Chat Completions 的 <code>messages</code>、<code>tools</code>）。',
'<b>跨模型切换</b>：同一会话中途换模型时，<code>transformMessages</code> 丢弃<b>其他模型</b>的 thinking 块（签名与加密推理只对产生它的模型有效，明文思考又会被新模型误当作可见回复），去掉 Google 的 thoughtSignature，并可按目标 API 规范化工具调用 id。',
'<b>孤儿工具调用</b>：如果某个工具调用在转录里没有结果（例如被中断），会插入一个合成的 <code>toolResult</code>：“No result provided”，isError=true——许多 API 拒绝不配对的工具调用。',
'<b>响应方向</b>：逐块读取 SSE；<code>reasoning_content / reasoning / reasoning_text</code> → thinking；<code>content</code> → text；<code>tool_calls</code> 按 index 累积参数片段，用 <code>parseStreamingJson</code> 随时给出“到目前为止”的参数对象（UI 可以在参数还没流完时就显示路径）。',
'<b>停止原因映射</b>：<code>stop/end→stop</code>、<code>length→length</code>、<code>tool_calls/function_call→toolUse</code>，<code>content_filter</code> 等→error 并带说明。原始值保存在 <code>rawStopReason</code>。没有 finish_reason 的流被视为错误（除非该兼容端点声明不支持 finish_reason）。',
'<b>错误永不抛出</b>：任何异常都被捕获，转成一条 <code>stopReason=error</code>（或 aborted）的 assistant 消息，并作为 <code>error</code> 事件推送。已流出的内容保留。',
'<b>兼容性开关</b>：OpenAI 兼容服务各有怪癖，<code>detectCompat</code> 按 provider 与 baseUrl 自动探测（是否支持 developer 角色、usage 放在哪、思考字段格式……），模型的 <code>compat</code> 字段可以覆盖。']
S1=('一个 SSE 流的解析','左边是线上的分块，右边是 pi 的事件。')
A1=[('content 分块','delta.content="我看" → text_start + text_delta',[('w','data: {content:"我看"}','sig',0,60,240),('e','text_delta','ok',300,60,160)]),
('tool_calls 第一块','index 0，id、name 和参数前缀 {"pa → toolcall_start + toolcall_delta',[('w','data: {tool_calls:[{index:0,…}]}','sig',0,60,280),('e','toolcall_delta','ok',300,60,160)]),
('参数后续','后续块只带 index 与参数片段；parseStreamingJson 把不完整的 JSON 解析为“目前为止”的对象。',[('w','data: {arguments:"th\\":\\"a.txt\\"}"}','sig',0,60,280),('e','arguments={path:"a.txt"}','ok',300,60,200)]),
('finish_reason','tool_calls → stopReason=toolUse；流结束时依次关闭所有块（text_end、toolcall_end）。',[('w','finish_reason: tool_calls','sig',0,60,240),('e','done (toolUse)','ok',300,60,160)])]
S2=('动手：服务器返回这个 finish_reason','映射结果是什么？')
CHI=[('stop','stopReason=stop → done 事件','ok',''),('length','stopReason=length → done 事件（循环会让被截断的工具调用失败）','sig',''),('tool_calls','stopReason=toolUse → done','ok',''),
('content_filter','stopReason=error\nerrorMessage="Provider finish_reason: content_filter"\n→ error 事件（已流出的内容保留）','bad',''),
('流直接断开，没有 finish_reason','→ Error("Stream ended without finish_reason")\n→ 被 catch，转成 error 事件','bad','部分兼容端点（compat.supportsFinishReason=false）例外：根据是否有工具调用推断 toolUse/stop。')]
CHH='选择一个 finish_reason。'
S3=('读代码','','''<p>流解析主循环（节选）：finish_reason、文本、工具调用参数的累积：</p>'''+X('packages/ai/src/api/openai-completions.ts',[(564,564),(587,595),(646,691)])+'''<p>结束与错误处理：</p>'''+X('packages/ai/src/api/openai-completions.ts',[(693,714),(715,724),(736,741)])+'''<p>停止原因映射：</p>'''+X('packages/ai/src/api/openai-completions.ts',[(1582,1606)])+'''<p>跨模型清理（所有协议共用）：</p>'''+X('packages/ai/src/api/transform-messages.ts',[(119,139)])+NOTE('<b>与 Codex 对照</b>：Codex 只需支持很少的线上协议（以 Responses API 为主），但在传输层投入更多：SSE 与 WebSocket 两种传输、带退避的重试、流空闲超时。见 '+codex(5,'模型客户端：SSE、WebSocket 与重试')+'。'))
S4=('请求与事件','')
TERM=[['node l05.ts','[服务器收到] model=tiny stream=true\n    system    "你是助手"\n    user      "a.txt 里有什么？"\n    tools: read\n[事件] text_start\n…\n[事件] toolcall_delta "{\\"pa"\n[事件] toolcall_delta "th\\":\\"a.txt\\"}"\n[事件] text_end\n[事件] toolcall_end\n[事件] done','注意：text_end 在工具调用开始之后才出现——块在流结束时统一关闭。']]
S5=('在你的电脑上练习','启动一个返回固定 SSE 的本地服务器，让 pi-ai 的 openai-completions 适配器连接它。不需要任何真实 API。')
PRAC=[('写脚本：服务器打印收到的请求，然后流出文本与一个分成两块的工具调用。','cat > pi-mono/scratch/l05.ts <<\'EOF\'\n'+L5+'EOF\ncd pi-mono/scratch && node l05.ts',None),
('让服务器返回 <code>content_filter</code>：','cd pi-mono/scratch && node l05.ts content_filter | tail -3',None)]
CHAL=('第二轮请求','修改脚本：拿到第一条回复后，把它和一条 <code>toolResult</code>（toolCallId <code>call_1</code>，内容“hello”）追加到 messages，再请求一次（服务器第二次返回 <code>finish_reason: "stop"</code> 即可）。服务器会收到什么样的 messages？再试一次：把 toolResult 删掉，只追加 assistant 消息。',
'<p>完整时服务器收到 4 条：system、user、<code>assistant</code>（content "我看一下。" + <code>tool_calls:[{id:"call_1",function:{name:"read",arguments:"{\\"path\\":\\"a.txt\\"}"}}]</code>）、<code>tool</code>（tool_call_id "call_1"，content "hello"）。</p><p>删掉 toolResult 后，服务器仍会收到一条 <code>tool</code> 消息，内容是 “No result provided”——这是 <code>transformMessages</code> 第二遍为孤儿工具调用插入的合成结果。没有它，OpenAI 会以 400 拒绝请求（“tool_calls must be followed by tool messages”）。</p>')
QUIZ=[['同一会话从模型 A 切换到模型 B，A 的 thinking 块会？',['被丢弃','原样发送','转成文本'],0,''],
['工具调用参数流到一半时，arguments 是？',['parseStreamingJson 解析出的“目前为止”的对象','空对象，直到流结束','字符串'],0,''],
['finish_reason=content_filter 映射为？',['error，并带说明','stop','length'],0,''],
['转录中有工具调用但没有结果，发送前会？',['插入合成的 isError 结果 “No result provided”','删除该工具调用','报错'],0,''],
['适配器内部出现网络异常时？',['转成 stopReason=error 的消息并推送 error 事件','抛给调用方','重试直到成功'],0,'重试由上层（AgentSession）决定。']]
