from common import *
TITLE='Codex 全景：仓库地图与 crate 分层';MIN=35;NEXT='一次 turn 的生命周期'
DESC='pi 用约十万行 TypeScript 给出了编码 agent 的最小内核；Codex 则是一个 Rust 工作区，包含 160 多个 crate，核心库 <code>codex-core</code> 一个就有四十多万行（含测试）。多出来的东西几乎都围绕一个主题：<b>让 agent 在真实机器上安全地自主工作</b>——沙箱、审批、执行策略、可恢复的会话、计划与长时间目标。本课画出仓库地图，并用一个假的模型服务器离线跑通真实的 codex。'
SUM=['<b>分层</b>：<code>protocol</code>（Op/Event/ResponseItem 等类型）→ <code>codex-api</code>/<code>codex-client</code>（与模型通信）→ <code>core</code>（会话、turn 循环、工具、上下文、压缩）→ 前端：<code>tui</code>（交互）、<code>exec</code>（非交互）、<code>app-server</code>（给 IDE/桌面应用的 JSON-RPC）。<code>cli</code> 把它们组装成一个 <code>codex</code> 可执行文件。',
'<b>安全相关 crate</b>：<code>linux-sandbox</code>、<code>bwrap</code>、Windows 沙箱、<code>execpolicy</code>（命令规则）、<code>apply-patch</code>（自有补丁格式）。',
'<b>扩展</b>：<code>ext/</code> 下是以扩展形式实现的功能，例如 <code>ext/goal</code>（/goal 背后的目标运行时）、<code>ext/skills</code>、<code>ext/mcp</code>、<code>ext/web-search</code>。<code>hooks</code>、<code>core-plugins</code> 提供钩子与插件。',
'<b>与 pi 对照</b>：pi-ai ≈ codex-api + 模型目录；pi-agent-core ≈ core 的 turn 循环；coding-agent 的工具 ≈ core/tools；pi-tui ≈ tui（ratatui）。pi 把安全交给扩展和容器，Codex 把它做进内核。',
'<b>离线练习</b>：Codex 支持在 <code>config.toml</code> 中自定义 <code>model_providers</code>（<code>base_url</code> + <code>wire_api = "responses"</code>）。我们把它指向本机的假服务器，就能在不联网、没有 API key 的情况下观察真实 codex 的行为。']
S1=('一个请求穿过哪些 crate','')
A1=[('入口','codex exec "…"：cli 解析参数，交给 exec 前端。',[('c','cli','sig',0,90,90),('e','exec','',120,90,90)]),
('内核','exec 通过 app-server 客户端启动线程；core 运行 turn。',[('e','exec','',0,90,90),('a','app-server','',120,90,110),('k','core','sig',260,90,90)]),
('模型与工具','core 调用 codex-api 请求模型，执行工具（在沙箱中）。',[('k','core','sig',0,90,90),('m','codex-api','',130,30,110),('t','tools + sandbox','ok',130,150,150)])]
S2=('动手：这个功能在哪个 crate？','')
CHI=[('解析 *** Begin Patch 格式','apply-patch','ok',''),('判断 rm -rf 是否需要审批','execpolicy + core 的 exec_policy','ok',''),('在 Linux 上限制写权限','linux-sandbox / bwrap','ok',''),('/goal 的预算与自动续跑','ext/goal','ok',''),('VS Code 插件通信','app-server（JSON-RPC）','ok','')]
CHH='选择一个功能。'
S3=('读代码','','<p>工作区成员（节选）：</p>'+X('codex-rs/Cargo.toml',[(1,12)])+'<p>CLI 子命令：</p>'+X('codex-rs/cli/src/main.rs',[(150,162)])+NOTE('<b>与 pi 对照</b>：'+pi(1,'pi 是什么：极简 agent harness 与 monorepo 地图')+'。两者回答的是同一个问题——“一个编码 agent 由什么组成”，但 Codex 的答案多出一整层安全与运维机制。'))
S4=('真实输出','')
TERM=[['bash run.sh s_hello.py "打个招呼"','exec\n/bin/bash -lc \'echo 你好，codex\' …\n succeeded in 0ms:\n你好，codex\ncodex\n命令输出了：你好，codex','']]
S5=('在你的电脑上练习','先构建，再写假模型服务器与启动脚本。'+RUNNOTE)
PRAC=[BUILD,
('假的 Responses API 服务器。',heredoc('mock.py'),''),
('启动脚本：临时 CODEX_HOME + 自定义 provider。',heredoc('run.sh'),''),
('仓库地图。',heredoc('l01.sh')+'\ncd codex/scratch && bash l01.sh',None),
('剧本：先调用 exec_command，再回答。运行真实 codex。',heredoc('s_hello.py')+'\ncd "$(mktemp -d)" && bash $OLDPWD/codex/scratch/run.sh $OLDPWD/codex/scratch/s_hello.py "打个招呼" 2>&1 | tail -12',None)]
CHAL=('看看 codex 发了什么','打开 <code>$CODEX_HOME/requests/req01.json</code>：列出 <code>tools</code> 中每个工具的名字，以及 <code>input</code> 中每条消息的 role。再把 run.sh 里的 <code>MODEL</code> 换成一个不存在的名字，比较工具列表的变化。',
'<pre style="white-space:pre-wrap">python3 -c "import json,sys;b=json.load(open(sys.argv[1]))[\'body\'];print([t.get(\'name\',t[\'type\']) for t in b[\'tools\']]);print([i.get(\'role\') for i in b[\'input\']])" $CODEX_HOME/requests/req01.json</pre><p>使用 gpt-5.5 时工具为 exec_command、write_stdin、request_user_input、apply_patch、view_image、get_goal、create_goal、update_goal、tool_search、web_search；input 中是两条 developer 消息（权限说明、协作模式等）和两条 user 消息（AGENTS/环境上下文与你的提示）。没有顶层 instructions 字段。换成未知模型时 codex 警告“使用回退元数据”，工具集也会不同（例如没有 apply_patch）：工具集由模型元数据（models-manager/models.json）决定。</p>')
QUIZ=[['codex 的核心逻辑在哪个 crate？',['core','tui','cli'],0,''],['IDE 插件通过什么与 codex 通信？',['app-server（JSON-RPC）','直接链接 tui','读 rollout 文件'],0,''],['/goal 的运行时在哪？',['ext/goal','tui','protocol'],0,''],['本课程如何离线运行 codex？',['自定义 model_provider 指向假服务器','修改源码','使用 pi'],0,''],['pi 与 Codex 最大的设计分歧？',['安全机制是否内置','编程语言','是否支持工具'],0,'']]
