from common import *
L15='import { fauxAssistantMessage, fauxToolCall } from "@earendil-works/pi-ai/compat";\nimport { fauxSession } from "./faux-session.ts";\n\n// 一个项目扩展：注册工具、注册命令、拦截危险命令、改写输入、保存状态\nconst extension = `\nimport { Type } from "typebox";\nexport default function (pi) {\n  let calls = 0;\n  pi.registerTool({\n    name: "today", label: "today", description: "返回今天的日期",\n    parameters: Type.Object({}),\n    async execute() { calls++; return { content: [{ type: "text", text: "2026-10-22" }], details: undefined }; },\n  });\n  pi.registerCommand("stats", {\n    description: "显示扩展统计",\n    handler: async (_args, ctx) => { console.log("[/stats] today 被调用", calls, "次；当前模型", ctx.model?.id); },\n  });\n  pi.on("tool_call", async (event) => {\n    if (event.toolName === "bash" && /\\\\brm\\\\s+-rf\\\\b/.test(event.input.command)) return { block: true, reason: "guard 扩展：禁止 rm -rf" };\n  });\n  pi.on("input", async (event) => {\n    if (event.text.startsWith("!!")) return { action: "transform", text: "请用一句话回答：" + event.text.slice(2) };\n  });\n  pi.on("agent_settled", async () => { pi.appendEntry("guard-stats", { calls }); });\n}`;\n\nconst { session } = await fauxSession([\n  fauxAssistantMessage([fauxToolCall("today", {}), fauxToolCall("bash", { command: "rm -rf build" })], { stopReason: "toolUse" }),\n  fauxAssistantMessage("今天是 2026-10-22，删除被拒绝了。"),\n], { files: { ".pi/extensions/guard.ts": extension } });\n\nconsole.log("活动工具:", session.agent.state.tools.map((t) => t.name).join(", "));\nawait session.prompt("!!今天几号？顺便清理 build");\nfor (const m of session.messages as any[]) {\n  if (m.role === "user") console.log("user       ", m.content[0].text);\n  if (m.role === "toolResult") console.log("toolResult ", m.toolName, m.isError ? "(错误)" : "", m.content[0].text);\n}\nawait session.prompt("/stats");\nconst custom = session.sessionManager.getEntries().filter((e: any) => e.type === "custom");\nconsole.log("custom 条目:", JSON.stringify(custom.map((e: any) => ({ customType: e.customType, data: e.data }))));\nconsole.log("/stats 产生了发给模型的消息吗？", session.messages.some((m: any) => m.role === "user" && JSON.stringify(m.content).includes("stats")));\nsession.dispose();\n'
TITLE='扩展系统：工具、命令与事件钩子';MIN=55;NEXT='斜杠命令与提示模板'
DESC='pi 的核心刻意保持很小，几乎所有“额外”的能力——权限确认、子 agent、计划模式、MCP、自定义 UI——都应该由<b>扩展</b>实现。扩展就是一个导出默认函数的 TypeScript 文件，函数接收 <code>ExtensionAPI</code>，可以注册工具、命令、快捷键、提供方，订阅三十多种生命周期事件，并在会话中保存自己的状态。本课写一个小小的“guard”扩展，覆盖最常用的五种能力。'
SUM=['<b>加载</b>：<code>~/.pi/agent/extensions/</code>、项目 <code>.pi/extensions/</code>（需信任）、pi 包、<code>pi --extension ./x.ts</code>。通过 jiti 直接加载 TypeScript，无需编译；<code>typebox</code>、<code>@earendil-works/pi-*</code> 等导入被映射到 pi 自带的模块（virtual modules），扩展不需要自己安装它们。',
'<b>注册</b>：<code>registerTool</code>（与内置工具同样的形状，可设置 exposure：direct / model-only / codemode / deferred / hidden）、<code>registerCommand</code>、<code>registerShortcut</code>、<code>registerFlag</code>、<code>registerProvider</code>、<code>registerToolRenderer</code>。',
'<b>事件</b>：输入（<code>input</code> 可改写或消费）、<code>before_agent_start</code>（改提示段落、工具）、<code>context</code>（每次请求前过滤消息）、提供方请求/响应、<code>tool_call</code>（可 block）、<code>tool_result</code>（可改写）、<code>turn_end</code>、<code>agent_before_settle</code>、<code>agent_settled</code>、会话事件（start、switch、fork、compact、shutdown）等。',
'<b>与循环的连接</b>：AgentSession 把 Agent 的 <code>beforeToolCall</code>/<code>afterToolCall</code> 钩子接到扩展的 <code>tool_call</code>/<code>tool_result</code> 事件上——第 7 课看到的钩子正是扩展的入口。处理器抛错会阻止工具执行（失败即关闭）。',
'<b>状态与消息</b>：<code>appendEntry</code> 写 custom 条目（持久化、不进上下文）；<code>sendMessage</code> 注入自定义消息（进上下文）；<code>sendUserMessage</code> 以用户身份发送。',
'<b>UI</b>：<code>ctx.ui</code> 提供 notify、confirm、select、input、自定义组件等；在 print/RPC 模式下有对应的降级或协议实现。',
'<b>生命周期纪律</b>：工厂函数中不要启动进程、定时器；在 <code>session_start</code> 中启动，在 <code>session_shutdown</code> 中清理。reload 会替换整个扩展运行时。']
S1=('扩展挂在哪里','')
A1=[('输入','input 事件：guard 把 "!!" 前缀改写成“请用一句话回答：”。',[('in','input','sig',0,60,100)]),
('提示','before_agent_start：可修改系统提示段落与活动工具。',[('in','input','',0,60,100),('b','before_agent_start','sig',120,60,160)]),
('工具调用','tool_call：bash("rm -rf build") 被 block。',[('b','before_agent_start','',120,60,160),('t','tool_call','sig',300,60,110)]),
('结果','tool_result：可改写；today 工具来自扩展。',[('t','tool_call','',300,60,110),('r','tool_result','ok',430,60,110)]),
('结束','agent_settled：appendEntry 保存统计。',[('s','agent_settled','ok',300,140,140),('e','custom 条目','ok',460,140,120)])]
S2=('动手：选择一种能力','看它在本课 guard 扩展中的实际效果。')
CHI=[('registerTool("today")','活动工具: read, bash, edit, write, today\n模型调用 today → "2026-10-22"','ok',''),
('pi.on("tool_call") 返回 block','toolResult bash (错误) guard 扩展：禁止 rm -rf','sig','与第 7 课 beforeToolCall 的 block 完全相同。'),
('pi.on("input") 返回 transform','user: 请用一句话回答：今天几号？顺便清理 build','ok',''),
('registerCommand("stats")','/stats 立即执行 handler；不会发消息给模型','ok',''),
('appendEntry("guard-stats", …)','会话文件中出现 custom 条目 {"calls":1}；模型看不到','ok','')]
CHH='选择一种能力。'
S3=('读代码','','''<p>ExtensionAPI（节选）：</p>'''+X('packages/coding-agent/src/core/extensions/types.ts',[(1671,1680),(1731,1747),(1778,1778)])+'''<p>AgentSession 把循环的工具钩子接到扩展事件：</p>'''+X('packages/coding-agent/src/core/agent-session.ts',[(652,681)])+'''<p>扩展可以直接导入的模块：</p>'''+X('packages/coding-agent/src/core/extensions/virtual-modules.ts',[(15,33)])+NOTE('<b>与 Codex 对照</b>：Codex 把许多 pi 交给扩展的能力内置进核心（审批、计划、MCP、子 agent），对外的扩展点是 <b>MCP 服务器</b>、<b>hooks</b>（在特定事件运行外部命令）、技能与插件。见 '+codex(17,'MCP 客户端与服务端')+' 与 '+codex(21,'hooks、技能与插件')+'。'))
S4=('真实输出','')
TERM=[['node scratch/l15.ts','活动工具: read, bash, edit, write, today\nuser        请用一句话回答：今天几号？顺便清理 build\ntoolResult  today  2026-10-22\ntoolResult  bash (错误) guard 扩展：禁止 rm -rf\n[/stats] today 被调用 1 次；当前模型 faux-1\ncustom 条目: [{"customType":"guard-stats","data":{"calls":1}}]','五种能力全部生效。']]
S5=('在你的电脑上练习','本课每个命令块都从第 1 课的 <code>pi-mono</code> 仓库根目录执行；若上一课停在 scratch，先回到仓库根目录。需要已完成依赖安装和构建，并已有 <code>scratch/</code>；下面运行脚本不改变当前 shell 的目录。把扩展写进临时项目的 <code>.pi/extensions/guard.ts</code>，用真实的 AgentSession 加载它。')
PRAC=[('写脚本并运行。','cat > scratch/l15.ts <<\'EOF\'\n'+L15+'EOF\nnode scratch/l15.ts',None),
('pi 自带了大量扩展示例：','(cd packages/coding-agent/examples/extensions && ls | head -30 && ls | wc -l)',None)]
CHAL=('权限确认扩展','写一个扩展：对 bash 工具，命令匹配 <code>git push|npm publish|rm -rf</code> 时调用 <code>ctx.ui.confirm()</code> 询问用户，拒绝则 block。在 print 模式（没有交互 UI）下应该怎么处理才安全？',
'<pre>export default function (pi) {\n  const risky = /\\b(git push|npm publish|rm -rf)\\b/;\n  pi.on("tool_call", async (event, ctx) => {\n    if (event.toolName !== "bash" || !risky.test(event.input.command)) return;\n    if (!ctx.hasUI) return { block: true, reason: "非交互模式下禁止高风险命令" };\n    const ok = await ctx.ui.confirm("允许执行？", event.input.command);\n    if (!ok) return { block: true, reason: "用户拒绝" };\n  });\n}</pre><p>没有 UI 时默认<b>拒绝</b>（fail closed）：print/JSON 模式常用于脚本和 CI，无人值守时宁可阻止。注意正则只是启发式，<code>git  push</code>、<code>sh -c</code> 包装、别名都可能绕过；它防的是模型的失误，不是恶意。确切的 API（例如 <code>ctx.hasUI</code>）以 <code>extensions/types.ts</code> 中的 ExtensionContext 为准；examples/extensions 中有完整的权限示例可参考。</p>')
QUIZ=[['扩展需要先编译吗？',['不需要，jiti 直接加载 TS','需要 tsc','需要打包'],0,''],
['tool_call 处理器抛出异常时？',['阻止工具执行','忽略异常继续执行','崩溃'],0,'失败即关闭。'],
['appendEntry 的数据会发给模型吗？',['不会','会','只在压缩时'],0,''],
['扩展 import "typebox" 从哪里解析？',['pi 自带的虚拟模块','扩展目录的 node_modules','网络'],0,''],
['长期运行的资源应该在哪里启动？',['session_start','工厂函数','模块顶层'],0,'']]
