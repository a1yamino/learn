from common import *
EXT='// 课程练习用扩展：为 pi CLI 注册一个离线的 faux 模型（无需 API key）\nimport { fauxAssistantMessage, fauxToolCall, registerFauxProvider } from "@earendil-works/pi-ai/compat";\n\nexport default function (pi: any) {\n  const faux = registerFauxProvider();\n  faux.setResponses([\n    fauxAssistantMessage([fauxToolCall("bash", { command: "echo 来自 bash 的输出" })], { stopReason: "toolUse" }),\n    fauxAssistantMessage("完成：bash 输出了一行文字。"),\n  ]);\n  pi.registerProvider("faux", {\n    baseUrl: "http://localhost:0", apiKey: "faux-key", api: faux.api,\n    models: faux.models.map((m: any) => ({ id: m.id, name: m.name, reasoning: false, input: ["text"],\n      cost: m.cost, contextWindow: m.contextWindow, maxTokens: m.maxTokens })),\n  });\n}\n'
SH='#!/bin/bash\n# 同一个 AgentSession，三种运行模式（用 faux 扩展离线运行，无需 API key）\nCLI=(node "$PWD/packages/coding-agent/dist/cli.js")\nEXT="$PWD/scratch/faux-ext.ts"\nexport HOME=$(mktemp -d); cd "$(mktemp -d)"\nPI=("${CLI[@]}" --no-session -e "$EXT" --model faux/faux-1)\n\necho "== 1. print 模式（-p）：只打印最后的回答"\n"${PI[@]}" -p "运行一个命令" </dev/null\n\necho "== 2. json 模式：每个事件一行 JSON（这里只列出事件类型）"\n"${PI[@]}" --mode json -p "运行一个命令" </dev/null | grep -o \'^{"type":"[a-z_]*"\' | cut -d\'"\' -f4 | tr \'\\n\' \' \'; echo\n\necho "== 3. rpc 模式：stdin 发命令，stdout 收响应和事件"\n(echo \'{"id":"1","type":"prompt","message":"运行一个命令"}\'; sleep 2\n echo \'{"id":"2","type":"get_last_assistant_text"}\'; sleep 1) \\\n | "${PI[@]}" --mode rpc | grep \'"type":"response"\'\n'
TITLE='运行模式：交互、print/JSON、RPC 与 SDK';MIN=40;NEXT='信任边界：pi 刻意不做什么'
DESC='同一个 <code>AgentSession</code> 可以挂在四种“外壳”上：交互式 TUI、一次性的 print 模式（纯文本或 JSON 事件流）、通过 stdin/stdout 交换 JSONL 的 RPC 模式，以及直接在你的程序里 <code>createAgentSession()</code> 的 SDK。本课用一个离线的 faux 扩展驱动真实的 <code>pi</code> CLI，亲眼看三种模式的输出。'
SUM=['<b>模式选择</b>：<code>resolveAppMode</code> —— 显式 <code>--mode rpc</code> → RPC；有 <code>-p</code>、<code>--mode json</code>，或 stdin/stdout 不是终端 → print；否则交互。管道输入的内容会作为首条消息并切换到 print。',
'<b>print 模式</b>（<code>print-mode.ts</code>，173 行）：发出初始消息，等待 agent 结束；text 模式只打印最后一条助手文本，json 模式把每个会话事件写成一行 JSON（先输出会话头）。',
'<b>RPC 模式</b>（<code>rpc-mode.ts</code>）：每行一个命令 <code>{id,type,…}</code>，响应 <code>{id,type:"response",command,success,data}</code>，事件同时流出。命令有 prompt/steer/follow_up/abort、模型与思考级别、compact、bash、会话 fork/clone/切换、get_state/get_messages 等。<code>rpc-client.ts</code> 提供类型化客户端，IDE 插件可直接用。',
'<b>prompt 的响应时机</b>：RPC 在<b>预检</b>通过后才回复 success（disposition: started/queued…），而不是在 agent 结束时；结束靠事件 <code>agent_end</code>/<code>agent_settled</code> 判断。',
'<b>SDK</b>：<code>createAgentSession()</code> 返回同一个 AgentSession；前面各课的 faux-session 就是 SDK 用法。',
'<b>扩展也能注册模型提供方</b>：<code>pi.registerProvider()</code>，本课的 faux 扩展就是例子。']
S1=('一个内核，四个外壳','')
A1=[('内核','AgentSession：循环、工具、会话、压缩。',[('k','AgentSession','sig',150,90,160)]),
('外壳','TUI / print / json / rpc / SDK 都只是订阅事件、调用 prompt。',[('k','AgentSession','sig',150,90,160),('t','TUI','',0,20,80),('p','print','',0,160,80),('r','rpc','',360,20,80),('s','SDK','',360,160,80)])]
S2=('动手：哪个模式？','根据场景选择。')
CHI=[('在终端里交互聊天','交互模式（默认，stdin/stdout 都是终端）','ok',''),
('CI 中一次性执行，只要最终答案','pi -p "…"','ok','text 模式只打印最后的回答。'),
('脚本需要看到每次工具调用','--mode json','ok','一行一个事件。'),
('编辑器插件长期驱动 agent、中途 steer','--mode rpc','ok','双向 JSONL，可发 steer/abort。'),
('在自己的 Node 程序中嵌入','SDK：createAgentSession()','ok','')]
CHH='选择一个场景。'
S3=('读代码','','''<p>模式解析：</p>'''+X('packages/coding-agent/src/main.ts',[(112,127)])+'''<p>分派：</p>'''+X('packages/coding-agent/src/main.ts',[(949,952),(985,997)])+'''<p>json 模式把事件逐行写出：</p>'''+X('packages/coding-agent/src/modes/print-mode.ts',[(108,112)])+'''<p>RPC 的 prompt 命令：</p>'''+X('packages/coding-agent/src/modes/rpc/rpc-mode.ts',[(394,414)])+NOTE('<b>与 Codex 对照</b>：Codex 有 <code>codex exec</code>（非交互，可 <code>--json</code>）以及面向 IDE 的 app-server（JSON-RPC）。见 '+codex(23,'非交互与 app-server')+'。'))
S4=('真实输出','')
TERM=[['bash scratch/l18.sh','== 1. print 模式（-p）：只打印最后的回答\n完成：bash 输出了一行文字。','']]
S5=('在你的电脑上练习','本课每个命令块都从第 1 课的 <code>pi-mono</code> 仓库根目录执行；若上一课停在 scratch，先回到仓库根目录。需要已完成依赖安装和构建，并已有 <code>scratch/</code>；下面运行脚本不改变当前 shell 的目录。先写一个只注册 faux 模型的扩展（这样不需要 API key），再用 <code>-e</code> 加载它运行真正的 pi CLI。注意 print 模式会读取管道输入，因此用 <code>&lt;/dev/null</code> 关闭 stdin。需要先在 pi-mono 根目录执行过 <code>npm run build</code>。')
PRAC=[('faux 扩展。','cat > scratch/faux-ext.ts <<\'EOF\'\n'+EXT+'EOF',''),
('三种模式。','cat > scratch/l18.sh <<\'EOF\'\n'+SH+'EOF\nbash scratch/l18.sh',None)]
CHAL=('RPC 中途 steer','修改 RPC 部分：faux 的第一条响应改为调用 <code>bash</code> 执行 <code>sleep 1</code>；在发送 prompt 后 0.3 秒发送 <code>{"type":"steer","message":"改为列出文件"}</code>。观察 steer 的响应和后续事件中出现的用户消息。',
'<pre>(echo \'{"id":"1","type":"prompt","message":"开始"}\'; sleep 0.3\n echo \'{"id":"2","type":"steer","message":"改为列出文件"}\'; sleep 3) \\\n | "${PI[@]}" --mode rpc | grep -E \'"response"|"role":"user"\' | cut -c1-120</pre><p>steer 立即得到 success 响应；消息进入转向队列，在当前工具调用结束后、下一次模型调用之前注入（第 2、8 课的机制），所以你会在 tool_execution_end 之后看到这条用户消息。faux 的响应列表需要多准备一条，供 steer 之后的那次调用使用。</p>')
QUIZ=[['stdout 被重定向到文件且未加参数时？',['进入 print 模式','进入交互模式','报错'],0,''],
['json 模式输出？',['每个事件一行 JSON','只有最终答案','HTML'],0,''],
['RPC prompt 命令何时回复 success？',['预检通过后','agent 结束后','从不'],0,''],
['RPC 中怎么判断 agent 结束？',['agent_end / agent_settled 事件','prompt 的响应','超时'],0,''],
['扩展能注册新的模型提供方吗？',['能，pi.registerProvider','不能','只能改环境变量'],0,'']]
