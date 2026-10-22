from common import *
TITLE='hooks、技能与插件';MIN=45;NEXT='TUI 与配置'
DESC='pi 只有一种扩展：TypeScript 扩展，在进程内注册工具、命令与事件钩子（第 15 课）。Codex 把扩展拆成三种<b>进程外</b>、以文件声明的机制：<b>hooks</b>——在 14 个生命周期事件上运行外部命令，可以拦截工具调用；<b>技能</b>——一个目录加一个 <code>SKILL.md</code>，只把名称与描述放进开发者消息，正文由模型按需读取；<b>插件</b>——把技能、hooks、MCP 服务器打成一个可从市场安装的包。本课用一个 Python 钩子拦截 <code>rm</code>，再放一个仓库级技能，看它出现在请求中。'
SUM=['<b>事件</b>（<code>protocol.rs</code> 的 <code>HookEventName</code>）：PreToolUse、PermissionRequest、PostToolUse、Pre/PostCompact、SessionStart/End、UserPromptSubmit、SubagentStart/Stop、Stop、Interrupt、Pre/PostModelRequest。处理器类型：command、mcp_tool、prompt、agent。',
'<b>声明位置</b>（<code>hooks/src/engine/discovery.rs</code>）：每个配置层目录下的 <code>hooks.json</code>，或 config.toml 中的同构配置；插件包中的 <code>hooks/hooks.json</code>。两者规范化后计算同一个哈希作为信任身份。',
'<b>信任</b>：钩子会在你的机器上执行任意命令，所以未经信任（未记录其哈希）的钩子<b>不运行</b>——实验 1 中 hook.log 为空。交互界面中可审阅并信任；实验用 <code>--dangerously-bypass-hook-trust</code> 跳过。',
'<b>协议</b>（与 Claude Code 风格兼容）：stdin 收到事件 JSON（<code>hook_event_name</code>、<code>tool_name</code>、<code>tool_input</code>…；shell 工具的名字是 <code>Bash</code>）；退出码 0 时可在 stdout 返回 JSON 控制结果；PreToolUse 以<b>退出码 2</b> 阻止调用，stderr 作为原因，模型收到 “Command blocked by PreToolUse hook: 原因”。',
'<b>技能</b>：根目录按层收集（<code>ext/skills/src/host_roots.rs</code>）：仓库内从项目根到 cwd 的 <code>.agents/skills</code>、<code>~/.agents/skills</code>、旧位置 <code>$CODEX_HOME/skills</code>、系统缓存 <code>skills/.system</code>、管理员目录。开发者消息中给出根目录表 <code>r0/r1/r2…</code> 和每个技能的“名称: 描述 (file: rN/…/SKILL.md)”——<b>渐进披露</b>，正文不预先加载。',
'<b>插件</b>：<code>codex plugin add/list/remove/marketplace</code>；插件钩子的信任还绑定插件内容哈希（<code>plugin_fingerprint.rs</code>），内容变了需要重新信任。']
S1=('一次被拦截的调用','')
A1=[('模型','exec_command("rm -rf data")。',[('m','模型','sig',0,90,80),('t','exec_command','',110,90,120)]),('PreToolUse','运行 guard.py：stdin 收到事件 JSON。',[('h','guard.py','sig',110,90,120)]),('拦截','退出码 2 → 原因回给模型，命令未执行。',[('h','exit 2','bad',110,90,90),('o','blocked: 原因','ok',230,90,140)])]
S2=('动手：钩子会运行吗？','')
CHI=[('$CODEX_HOME/hooks.json，未信任','不运行','bad',''),('同上，加 --dangerously-bypass-hook-trust','运行','ok',''),('钩子退出码 2 + stderr','阻止调用，stderr 作为原因','ok',''),('钩子退出码 1','不阻止：钩子标记为 Failed（“hook exited with code 1”），调用照常进行','sig','')]
CHH='选择一种情形。'
S3=('读代码','',X('codex-rs/protocol/src/protocol.rs',[(1699,1714)])+X('codex-rs/hooks/src/engine/discovery.rs',[(378,384)])+X('codex-rs/hooks/src/events/pre_tool_use.rs',[(213,215),(262,277)])+X('codex-rs/ext/skills/src/host_roots.rs',[(95,113)])+NOTE('<b>与 pi 对照</b>：'+pi(15,'扩展系统：工具、命令与事件钩子')+'。pi 的扩展在进程内、权限等同 pi 本身；Codex 的钩子是外部进程，并且要先被信任。'))
S4=('真实输出','')
TERM=[['bash l21.sh','== 1. 未信任的钩子：不运行\n   hook.log：无\n== 2. --dangerously-bypass-hook-trust：钩子运行\n[mock] 工具输出：\'Command blocked by PreToolUse hook: 禁止删除文件：请改用 git rm 并说明理由. Command: rm -rf dat\'\n[hook] PreToolUse tool_name=Bash input={"command": "rm -rf data"}\n== 3. 技能出现在第 2 条 developer 消息中（根目录表 + 条目）\n   - commit-msg: 按团队规范写提交信息（类型: 摘要），在用户要求提交时使用 (file: r2/commit-msg/SKILL.md)','']]
S5=('在你的电脑上练习',RUNNOTE)
PRAC=[('钩子脚本。',heredoc('guard.py'),''),('剧本：先 echo 再 rm。',heredoc('s_hook.py'),''),('三个实验。',heredoc('l21.sh')+'\ncd codex/scratch && bash l21.sh',None)]
CHAL=('用 JSON 而不是退出码','把 <code>guard.py</code> 改为退出码 0，并在 stdout 输出 Claude Code 风格的 JSON 决定：<code>{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"…"}}</code>。效果相同吗？去 <code>hooks/src/engine/output_parser.rs</code> 找到解析它的函数。',
'<p>效果相同：退出码 0 时，<code>pre_tool_use.rs</code> 调用 <code>output_parser::parse_pre_tool_use(&amp;run_result.stdout)</code>，解析出的 <code>block_reason</code> 与退出码 2 + stderr 走同一条阻止路径；格式不合法时得到 <code>invalid_reason</code>，作为一条错误条目显示而不阻止。JSON 方式的好处是可以同时返回 <code>systemMessage</code>（显示给用户）与 <code>additionalContext</code>（追加给模型）等字段。</p>')
QUIZ=[['未信任的钩子？',['不运行','运行但不能阻止','运行'],0,''],['PreToolUse 阻止调用的退出码？',['2','1','127'],0,''],['shell 工具在钩子中的 tool_name？',['Bash','exec_command','shell'],0,''],['技能正文何时进入上下文？',['模型需要时自己读取','启动时全部注入','从不'],0,''],['仓库级技能目录？',['.agents/skills','.codex/prompts','skills.json'],0,'']]
