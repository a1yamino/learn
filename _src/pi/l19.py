from common import *
SH=open('/workspace/src/pi-mono/scratch/l19.sh').read()
TITLE='信任边界：pi 刻意不做什么';MIN=40;NEXT='毕业项目：用 SDK 写一个迷你编码 agent'
DESC='pi 的哲学是“内核最小，策略交给扩展”。它<b>没有</b>内置沙箱，<b>不会</b>在每次工具调用前请求批准，也没有内置的计划模式或子 agent。官方文档写得很直接：模型生成的命令和代码应视为不可信，安全来自操作系统或虚拟化边界，而不是看着记录。本课用实验划清 pi 真正提供的唯一边界——<b>项目信任</b>——以及它不保护什么。'
SUM=['<b>没有内置沙箱与审批</b>：工具以启动 pi 的用户权限运行。<code>docs/security.md</code> 建议把 pi 整个放进容器/虚拟机/沙箱（<code>docs/containerization.md</code> 列出 Docker、Docker Sandboxes、OpenShell 等方式）。',
'<b>项目信任</b>（<code>trust-manager.ts</code>）：当前目录存在 <code>.pi/settings.json</code>、<code>mcp.json</code>、<code>extensions</code>、<code>skills</code>、<code>prompts</code>、<code>themes</code>、<code>SYSTEM.md</code>、<code>APPEND_SYSTEM.md</code>（或项目 <code>.agents/skills</code>）时需要决定是否加载。只有空 <code>.pi</code> 目录不需要。',
'<b>决定顺序</b>：命令行 <code>--approve</code>/<code>--no-approve</code> → 用户级扩展处理 <code>project_trust</code> 事件 → <code>~/.pi/agent/trust.json</code> 中最近的父目录决定 → 设置 <code>defaultProjectTrust</code>（默认 ask）。非交互模式下 ask 等同于跳过。',
'<b>信任不保护什么</b>：AGENTS.md/CLAUDE.md 不受信任控制、始终加载；项目信任也完全不限制工具调用能访问的路径。它只阻止一个文件夹<b>静默执行</b>扩展代码。',
'<b>策略在扩展里</b>：官方示例 <code>permission-gate.ts</code>（危险命令确认，无 UI 时直接拦截）、<code>protected-paths.ts</code>、<code>confirm-destructive.ts</code>、<code>sandbox/</code>（用 sandbox-runtime 在 macOS sandbox-exec / Linux bubblewrap 中运行 bash）、<code>plan-mode/</code>（第 16 课）、<code>subagent/</code>。',
'<b>对比</b>：Codex 把沙箱、审批策略与执行策略做成内置的核心功能——这是两者最大的设计分歧。']
S1=('谁能执行代码？','')
A1=[('项目扩展','克隆来的仓库带着 .pi/extensions/x.ts —— 不信任就不加载。',[('p','.pi/extensions','bad',0,90,140),('g','信任？','sig',180,90,100),('n','跳过','ok',320,40,80),('y','加载执行','bad',320,140,100)]),
('工具调用','模型调用 bash —— pi 内核直接执行；只有扩展的 tool_call 钩子能拦。',[('m','模型：rm -rf','bad',0,90,140),('h','tool_call 钩子','sig',180,90,140),('b','bash','',360,90,80)])]
S2=('动手：会发生什么？','预测，再看实验结果。')
CHI=[('非交互运行，带 .pi/extensions 的陌生项目','项目扩展被跳过；但模型的 rm -rf 照样执行','bad','信任只管资源加载，不管工具。'),
('加 --approve','项目扩展加载并执行','sig',''),
('加载 permission-gate 示例且无 UI','rm -rf 被拦截："Dangerous command blocked (no UI for confirmation)"','ok',''),
('项目里有恶意 AGENTS.md','照样加载进系统提示','bad','上下文文件不受信任控制，属于提示注入面。')]
CHH='选择一种情况。'
S3=('读代码','',X('packages/coding-agent/docs/security.md',[(3,7)])+'<p>需要信任决定的项目资源：</p>'+X('packages/coding-agent/src/core/trust-manager.ts',[(30,39)])+'<p>权限闸门只是一个 tool_call 钩子（第 15 课）：</p>'+X('packages/coding-agent/examples/extensions/permission-gate.ts',[(10,33)])+NOTE('<b>与 Codex 对照</b>：Codex 内置平台沙箱（'+codex(11,'沙箱：macOS Seatbelt')+'、'+codex(12,'沙箱：Linux')+'）与审批/执行策略（'+codex(13,'审批与执行策略')+'）。'))
S4=('真实输出','')
TERM=[['bash l19.sh','== 3. 加载官方示例 permission-gate\n工具结果："Dangerous command blocked (no UI for confirmation)"\nbuild\n(build 仍在)','']]
S5=('在你的电脑上练习','脚本在临时目录里构造一个“陌生项目”：带一个项目扩展和一个 <code>build</code> 目录；faux 模型总是要求执行 <code>rm -rf build</code>。一切发生在临时 HOME 与临时目录中，不会碰你的文件。')
PRAC=[('运行实验。','cat > pi-mono/scratch/l19.sh <<\'EOF\'\n'+SH+'EOF\ncd pi-mono/scratch && bash l19.sh 2>&1',None)]
CHAL=('写一个用户级信任策略','写一个扩展，处理 <code>project_trust</code> 事件：路径位于 <code>~/work/</code> 下的项目自动信任，其他一律拒绝。用 <code>-e</code> 加载它重新运行实验，看第 1 步的结果。',
'<pre>import { homedir } from "node:os";\nexport default function (pi: any) {\n  pi.on("project_trust", async (event: any) =&gt;\n    event.cwd.startsWith(homedir() + "/work/") ? { trusted: "yes" } : { trusted: "no" });\n}</pre><p>按文档，用户级与命令行扩展可以处理 <code>project_trust</code>，第一个给出是/否的扩展决定结果，优先于 trust.json 与 defaultProjectTrust。事件只有 <code>cwd</code>，返回 <code>{ trusted: "yes"|"no"|"undecided", remember? }</code>（<code>types.ts</code> 中的 <code>ProjectTrustEventResult</code>）；返回 undecided 则交给后续规则。注意：这仍然只控制资源加载，模型发出的命令照样执行。</p>')
QUIZ=[['pi 是否内置沙箱？',['否，建议用容器/VM 或扩展','是','只在 macOS'],0,''],
['项目信任控制什么？',['是否加载 .pi 下的设置、扩展等资源','工具能访问哪些路径','网络'],0,''],
['非交互模式、defaultProjectTrust=ask 时？',['跳过受保护资源','弹出提示','全部加载'],0,''],
['AGENTS.md 受项目信任控制吗？',['不受，始终加载','受','只在 RPC 模式受'],0,''],
['permission-gate 在无 UI 时？',['直接拦截危险命令','放行','崩溃'],0,'']]
