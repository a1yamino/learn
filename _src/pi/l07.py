from common import *
L7='import { Type } from "@earendil-works/pi-ai";\nimport { fauxAssistantMessage, fauxToolCall, registerFauxProvider, streamSimple } from "@earendil-works/pi-ai/compat";\nimport { runAgentLoop, type AgentLoopConfig } from "@earendil-works/pi-agent-core";\n\nconst faux = registerFauxProvider();\nconst t0 = () => performance.now();\nlet start = 0;\nconst at = () => `${Math.round((performance.now() - start) / 100) * 100}ms`;\nconst sleep = {\n  name: "sleep", label: "sleep", description: "等待", parameters: Type.Object({ ms: Type.Number() }),\n  execute: async (_id: string, p: { ms: number }) => {\n    console.log(`   [${at()}] sleep(${p.ms}) 开始`);\n    await new Promise((r) => setTimeout(r, p.ms));\n    console.log(`   [${at()}] sleep(${p.ms}) 结束`);\n    return { content: [{ type: "text" as const, text: "ok" }], details: {} };\n  },\n};\nconst sh = {\n  name: "sh", label: "sh", description: "执行命令", parameters: Type.Object({ cmd: Type.String() }),\n  execute: async (_id: string, p: { cmd: string }) => ({ content: [{ type: "text" as const, text: `(执行了 ${p.cmd})` }], details: {} }),\n};\n\nasync function run(title: string, calls: [string, any][], extra: Partial<AgentLoopConfig> = {}) {\n  console.log("==", title);\n  faux.setResponses([fauxAssistantMessage(calls.map(([n, a]) => fauxToolCall(n, a)), { stopReason: "toolUse" }), fauxAssistantMessage("好")]);\n  start = t0();\n  const msgs = await runAgentLoop([{ role: "user", content: "go", timestamp: Date.now() }],\n    { systemPrompt: "", messages: [], tools: [sleep, sh] },\n    { model: faux.getModel(), convertToLlm: (m) => m as any, ...extra }, () => {}, undefined, streamSimple);\n  for (const m of msgs as any[]) if (m.role === "toolResult") console.log(`   结果 ${m.toolName}: ${m.isError ? "错误 " : ""}${m.content[0].text.replace(/\\n/g, " ⏎ ").slice(0, 80)}`);\n  console.log(`   总耗时约 ${at()}`);\n}\n\nawait run("并行（默认）", [["sleep", { ms: 300 }], ["sleep", { ms: 200 }]]);\nawait run("顺序执行", [["sleep", { ms: 300 }], ["sleep", { ms: 200 }]], { toolExecution: "sequential" });\nawait run("参数校验与未知工具", [["sleep", { ms: "很久" }], ["nope", {}]]);\nawait run("钩子：拦截与改写", [["sh", { cmd: "rm -rf /" }], ["sh", { cmd: "ls" }]], {\n  beforeToolCall: async ({ args }) => ((args as any).cmd.startsWith("rm") ? { block: true, reason: "策略禁止 rm" } : undefined),\n  afterToolCall: async ({ result }) => ({ content: [{ type: "text", text: (result.content[0] as any).text + " [已审计]" }] }),\n});\n'
TITLE='工具调用：参数校验、并行执行与钩子';MIN=55;NEXT='Agent 类：状态、事件订阅、steering 与 follow-up'
DESC='模型在一条回复里可能请求多个工具。agent 循环要回答一连串问题：工具存在吗？参数合法吗？可以执行吗（权限钩子）？并行还是顺序？执行抛异常怎么办？结果要不要改写？本课精读 <code>agent-loop.ts</code> 中从 <code>executeToolCalls</code> 到 <code>finalizeExecutedToolCall</code> 的全过程，以及 <code>validateToolArguments</code>。'
SUM=['<b>工具的形状</b>（<code>AgentTool</code>）：<code>name</code>、<code>label</code>、<code>description</code>、<code>parameters</code>（TypeBox/JSON Schema）、<code>execute(id, args, signal, onUpdate)</code>，可选 <code>prepareArguments</code>（兼容旧参数形状）与 <code>executionMode</code>。',
'<b>准备阶段</b>（<code>prepareToolCall</code>）：查找工具（找不到 → “Tool X not found”）→ <code>prepareArguments</code> → <code>validateToolArguments</code>（先按 schema 做类型转换，如 "300"→300，再校验；失败 → “Validation failed…”，附上收到的参数）→ <code>beforeToolCall</code> 钩子（可 <code>block</code>，附 reason）。任何一步失败都直接产生错误结果，不执行。',
'<b>执行阶段</b>：<code>execute</code> 抛出的异常被捕获为错误结果；执行中可通过 <code>onUpdate</code> 推送部分结果（<code>tool_execution_update</code> 事件，例如 bash 的实时输出）。',
'<b>收尾阶段</b>：<code>afterToolCall</code> 钩子可以替换 content、details、isError——例如审计、脱敏、追加提示。',
'<b>并行是默认</b>：各工具按顺序做准备（因此 beforeToolCall 依次被调用），然后并发执行；结果消息<b>按原始顺序</b>发出。配置 <code>toolExecution:"sequential"</code>，或批次中任一工具声明 <code>executionMode:"sequential"</code>，则整批顺序执行。',
'<b>提前终止</b>：只有当批次中<b>每个</b>结果都带 <code>terminate:true</code> 时，循环才在这批之后停止（不再请求模型）。',
'<b>runToolCall</b>：工具调用其他工具（例如 codemode 脚本）时走同一条路径，所以权限钩子同样生效。']
S1=('一次工具调用经过的关卡','任何关卡失败都变成一条 isError 结果，而不是异常。')
A1=[('查找','tools 中有这个名字吗？',[('a','查找工具','sig',0,60,110)]),
('校验','按 schema 转换并校验参数。',[('a','查找工具','ok',0,60,110),('b','校验参数','sig',130,60,110)]),
('beforeToolCall','权限/策略钩子，可以 block。',[('a','查找工具','ok',0,60,110),('b','校验参数','ok',130,60,110),('c','before 钩子','sig',260,60,120)]),
('执行','execute(...)，可推送部分结果；异常被捕获。',[('c','before 钩子','ok',260,60,120),('d','execute','sig',400,60,100)]),
('afterToolCall','可改写结果。然后发出 tool_execution_end 与 toolResult 消息。',[('d','execute','ok',400,60,100),('e','after 钩子','sig',520,60,110)])]
S2=('动手：这次工具调用的结果是？','')
CHI=[('模型调用不存在的工具 nope','toolResult (isError)\n"Tool nope not found"','bad','模型会在下一轮看到这个错误并自我纠正。'),
('sleep({ms:"很久"})','toolResult (isError)\nValidation failed for tool "sleep":\n  - ms: must be number\n\nReceived arguments: …','bad','附上收到的参数，帮助模型修正。'),
('sleep({ms:"300"})','校验通过：Value.Convert 先把 "300" 转成 300','ok','对模型常见的小错误宽容。'),
('beforeToolCall 返回 {block:true, reason}','toolResult (isError) = reason\n工具不执行','sig','pi 本身不内置权限弹窗；这个钩子就是扩展实现权限策略的位置（第 19 课）。'),
('execute 抛出 Error("disk full")','toolResult (isError) = "disk full"','bad','循环继续，模型决定怎么办。')]
CHH='选择一种调用。'
S3=('读代码','','''<p>选择并行或顺序：</p>'''+X('packages/agent/src/agent-loop.ts',[(518,534)])+'''<p>并行执行：顺序准备，并发执行，按原顺序发出结果：</p>'''+X('packages/agent/src/agent-loop.ts',[(596,668)])+'''<p>准备阶段：</p>'''+X('packages/agent/src/agent-loop.ts',[(718,765)])+'''<p>参数校验：</p>'''+X('packages/ai/src/utils/validation.ts',[(317,325),(340,347)])+NOTE('<b>与 Codex 对照</b>：Codex 的工具由“规格（spec）+ 路由（router）+ 处理器（handler）”组成，并按工具是否支持并行来调度；最大的不同是在执行前插入了<b>审批</b>与<b>沙箱</b>两个关卡，而 pi 把这两件事留给钩子与扩展。见 '+codex(7,'工具规格、路由与并行')+'。'))
S4=('计时','')
TERM=[['node scratch/l07.ts','== 并行（默认）\n   [0ms] sleep(300) 开始\n   [0ms] sleep(200) 开始\n   [200ms] sleep(200) 结束\n   [300ms] sleep(300) 结束\n   总耗时约 300ms\n== 顺序执行\n   总耗时约 500ms','并行时总耗时取决于最慢的工具。']]
S5=('在你的电脑上练习','本课每个命令块都从第 1 课的 <code>pi-mono</code> 仓库根目录执行；若上一课停在 scratch，先回到仓库根目录。需要已完成依赖安装和构建，并已有 <code>scratch/</code>；下面运行脚本不改变当前 shell 的目录。四个场景：并行、顺序、校验失败与未知工具、钩子拦截与改写。')
PRAC=[('写脚本并运行。','cat > scratch/l07.ts <<\'EOF\'\n'+L7+'EOF\nnode scratch/l07.ts',None)]
CHAL=('一个确认钩子','写一个 <code>beforeToolCall</code>：对 <code>sh</code> 工具，命令中含有 <code>git push</code> 时阻止并返回 “需要人工确认”，其他命令放行。如果模型在同一条回复中请求了 <code>git status</code> 和 <code>git push</code>，两个工具的结果分别是什么？下一次模型请求会发生吗？',
'<pre>beforeToolCall: async ({ toolCall, args }) =>\n  toolCall.name === "sh" &amp;&amp; /\\bgit push\\b/.test((args as any).cmd)\n    ? { block: true, reason: "需要人工确认" }\n    : undefined,</pre><p>结果：<code>git status</code> 正常执行；<code>git push</code> 得到 isError 结果“需要人工确认”。下一次模型请求<b>会</b>发生（模型看到被拒绝，可以向用户解释）。只有当批次中所有结果都带 <code>terminate:true</code>（可以在 block 时设置 <code>terminate:true</code>）时，循环才会停下。注意：钩子拿到的是<b>校验后</b>的参数；真正的权限系统还要考虑命令的各种变形（<code>git  push</code>、别名、<code>sh -c</code>），这是第 19 课和 Codex 的 execpolicy 要面对的问题。</p>')
QUIZ=[['默认的工具执行方式？',['并行执行，结果按原顺序发出','顺序执行','随机'],0,''],
['批次中有一个工具 executionMode="sequential"？',['整批顺序执行','只有它顺序执行','忽略'],0,''],
['execute 抛出异常时？',['捕获为 isError 结果，循环继续','运行崩溃','重试'],0,''],
['参数 "300" 而 schema 要求 number？',['先转换为 300，校验通过','校验失败','原样传入'],0,''],
['何时在这批工具后直接停止？',['每个结果都带 terminate:true','任一结果出错','任一结果 terminate'],0,'']]
