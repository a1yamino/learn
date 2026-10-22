from common import *
FS=open('/workspace/src/pi-mono/scratch/faux-session.ts').read()
L20=open('/workspace/src/pi-mono/scratch/l20.ts').read()
TITLE='毕业项目：用 SDK 写一个迷你编码 agent';MIN=60;NEXT=None
DESC='把整门课拼起来：用 <code>createAgentSession()</code> 组装一个名叫 <b>fixbot</b> 的迷你编码 agent——内置 read/edit 工具、一个自定义的 <code>run_tests</code> 工具、一道禁止 bash 的守卫，以及一个订阅事件流的极简界面。它要修复一个真实的 bug：先跑测试看到失败，读代码，改代码，再跑测试确认通过。中途它还会试图执行 <code>git push --force</code>，被守卫拦下。'
SUM=['<b>内核</b>：<code>createAgentSession()</code>（<code>sdk.ts</code>）解析 cwd、agentDir、ModelRuntime、设置、资源加载器与工具集，构造 <code>AgentSession</code>（第 2、8 课）。',
'<b>工具</b>：<code>tools: ["read","edit","bash","run_tests"]</code> 是允许列表；<code>customTools</code> 中的 <code>defineTool()</code> 工具用 TypeBox 声明参数，循环负责校验（第 7 课）。',
'<b>守卫</b>：会话已在 <code>agent.beforeToolCall</code> 上安装钩子（用于分发扩展的 <code>tool_call</code>）。我们<b>串联</b>而不是覆盖它；正式项目更推荐写成扩展（第 15、19 课）。',
'<b>并行与顺序</b>：edit 与被拦截的 bash 在同一条助手消息中，拦截结果先返回，edit 后返回——同一消息中的工具调用并行执行，事件按完成顺序发出（第 7 课）。',
'<b>界面</b>：只是 <code>session.subscribe()</code>。把它换成 pi-tui（第 17 课）就是交互模式，换成 JSON 输出就是 print/json/rpc（第 18 课）。',
'<b>换真模型</b>：把 faux 换成 <code>modelRuntime</code> 中的真实模型（第 4 课），其余代码不变。']
S1=('fixbot 的一次运行','')
A1=[('失败','run_tests → FAIL：add(2,3) = -1',[('t','run_tests','bad',0,90,120)]),
('理解','read math.js：return a - b',[('t','run_tests','bad',0,90,120),('r','read','',150,90,90)]),
('修改','edit a-b → a+b；同时 bash git push --force 被守卫拦截',[('r','read','',150,90,90),('e','edit','ok',270,50,90),('b','bash ✗','bad',270,140,90)]),
('验证','run_tests → PASS，总结',[('e','edit','ok',270,50,90),('p','run_tests ✓','ok',400,90,120)])]
S2=('动手：这部分来自哪一课？','fixbot 的每个零件都对应前面的课程。')
CHI=[('createAgentSession','第 2、8 课：会话与 Agent 类','ok',''),('run_tests 参数校验','第 7 课：工具校验与并行','ok',''),
('edit 的 oldText → newText','第 10 课：edit 工具','ok',''),('拦截 bash','第 15、19 课：钩子与信任边界','ok',''),('事件日志界面','第 3、17、18 课：事件、TUI、运行模式','ok','')]
CHH='选择一个零件。'
S3=('读代码','','<p>SDK 入口：</p>'+X('packages/coding-agent/src/core/sdk.ts',[(191,199),(453,479)])+'<p>会话安装的工具钩子（所以要串联）：</p>'+X('packages/coding-agent/src/core/agent-session.ts',[(652,655)])+NOTE('<b>与 Codex 对照</b>：Codex 的“同一件事”由 Rust 的 codex-core 完成，内置沙箱、审批、计划与目标，是更重、更完整的产品。下一门课逐一对照：'+codex(24,'毕业项目')+'。'))
S4=('真实输出','')
TERM=[['node l20.ts','→ run_tests {}\n  ✓ "FAIL\\nadd(2,3) = -1，期望 5"\n…\nfixbot: 修好了：add 把减号改成加号。测试结果：PASS','']]
S5=('在你的电脑上练习','需要 pi-mono 已构建（<code>npm install &amp;&amp; npm run build</code>）、Node 22.18+（可直接运行 .ts）。<code>faux-session.ts</code> 是本课程反复使用的辅助文件。')
PRAC=[('辅助文件（若前面课程已创建可跳过）。','cat > pi-mono/scratch/faux-session.ts <<\'EOF\'\n'+FS+'EOF',''),
('fixbot。','cat > pi-mono/scratch/l20.ts <<\'EOF\'\n'+L20+'EOF\ncd pi-mono/scratch && node l20.ts',None)]
CHAL=('让 fixbot 接上真模型','去掉 faux：用 <code>ModelRuntime.create()</code> 读取你的凭据，挑一个模型传给 <code>createAgentSession</code>，保留 run_tests、守卫与事件界面。再加一条规则：run_tests 连续失败 3 次就 <code>session.abort()</code>。',
'<pre>import { createAgentSession, ModelRuntime, SessionManager, SettingsManager } from "@earendil-works/pi-coding-agent";\nconst modelRuntime = await ModelRuntime.create();\nconst model = modelRuntime.getModel("anthropic", "claude-sonnet-4-5")!; // 第 4 课：按 provider/id 查找\nconst { session } = await createAgentSession({ cwd, model, modelRuntime,\n  customTools: [runTests], tools: ["read", "edit", "run_tests"],\n  sessionManager: SessionManager.inMemory(cwd), settingsManager: SettingsManager.inMemory({}) });\nlet fails = 0;\nsession.subscribe((e: any) =&gt; {\n  if (e.type === "tool_execution_end" &amp;&amp; e.toolName === "run_tests")\n    fails = e.result.details?.ok ? 0 : fails + 1;\n  if (fails &gt;= 3) void session.abort();\n});</pre><p><code>getModel(providerId, modelId)</code> 找不到时返回 undefined；凭据优先级见第 4 课。直接把 bash 从允许列表中去掉，比运行时拦截更彻底。</p>')
QUIZ=[['SDK 的入口函数？',['createAgentSession','new Pi()','runAgentLoop 只能这样'],0,''],
['为什么串联而不是覆盖 beforeToolCall？',['会话的钩子负责分发扩展 tool_call','性能','语法要求'],0,''],
['允许列表放在哪个选项？',['tools','customTools','settings'],0,''],
['被拦截的工具调用会？',['返回错误结果给模型，循环继续','终止会话','抛异常退出'],0,''],
['换成真模型需要改什么？',['只改模型与 ModelRuntime','重写循环','重写工具'],0,'']]
