from common import *
L11=open('/workspace/src/pi-mono/scratch/l11.ts').read()
TITLE='bash 工具：进程、输出截断与中止';MIN=50;NEXT='系统提示、上下文文件与技能'
DESC='bash 是编码 agent 最强大的工具：编译、测试、git、包管理都靠它。pi 的实现（<code>core/tools/bash.ts</code>，442 行）要解决的是进程管理的老问题：合并 stdout/stderr、保留输出的<b>尾部</b>（错误通常在最后）、把完整输出存到临时文件、超时与中止时杀掉整棵进程树、执行中流式推送输出给界面。注意 pi 默认<b>不做任何沙箱</b>：命令以你的用户权限直接运行。'
SUM=['<b>参数</b>：<code>command</code> 与可选的 <code>timeout</code>（秒，默认无超时，有上限）。命令在 cwd 中通过 shell 执行；非 Windows 平台以 <code>detached</code> 方式启动，使其成为独立进程组。',
'<b>输出</b>：stdout 与 stderr 按到达顺序合并；<code>OutputAccumulator</code> 保留<b>最后</b> 2000 行或 50KB（<code>truncateTail</code>，与 read 相反），被截断时完整输出写入临时文件，并提示 <code>[Showing lines 3001-5000 of 5000. Full output: …]</code>。',
'<b>退出码</b>：非 0 时结果标记 <code>isError</code> 并附 <code>Command exited with code N</code>；被信号杀死时按 shell 惯例使用 128+信号值。',
'<b>超时与中止</b>：都调用 <code>killProcessTree</code> 杀掉整个进程组（包括后台子进程），然后抛出带已收集输出的错误：<code>Command timed out after N seconds</code> 或 <code>Command aborted</code>。',
'<b>流式更新</b>：通过 <code>onUpdate</code> 推送部分输出（有节流），TUI 因此能实时显示命令输出；还会生成 <code>structuredContent</code>（output、exit_code、wall_time_seconds），供 codemode 等程序化调用者使用。',
'<b>可定制</b>：<code>commandPrefix</code>（如先 source 某个环境）、<code>spawnHook</code>（改写命令/cwd/env，例如包一层容器或沙箱）、可替换的 <code>operations</code>（远程执行）。']
S1=('一个命令的一生','')
A1=[('启动','spawn(bash, ["-c", cmd])，detached，stdin 忽略。',[('p','bash -c','sig',0,60,120)]),
('输出','stdout/stderr 合并进入累加器；节流推送 onUpdate。',[('p','bash -c','',0,60,120),('acc','累加器（尾部）','sig',160,60,160),('ui','TUI','ok',360,60,80)]),
('溢出','超过 2000 行：只保留尾部，完整输出写入临时文件。',[('acc','累加器（尾部）','sig',160,60,160),('f','/tmp/…','ok',160,140,160)]),
('结束','退出码 0 → 普通结果；非 0 → isError；超时/中止 → 杀进程树并抛出。',[('r','toolResult','ok',360,60,140)])]
S2=('动手：这条命令的结果？','')
CHI=[('echo hi; echo err >&2','hi\nerr','ok','stderr 与 stdout 合并。'),
('ls /nope','ls: cannot access …\n\nCommand exited with code 2  (isError)','bad',''),
('seq 1 5000','3001 … 5000\n\n[Showing lines 3001-5000 of 5000. Full output: /tmp/…]','sig','保留尾部：测试失败、编译错误通常在最后。'),
('sleep 5，timeout: 1','start\n\nCommand timed out after 1 seconds','bad','进程树被杀。'),
('sleep 30 & sleep 30，用户按 Esc','Command aborted（约 0.3 秒后）','bad','后台的 sleep 也被杀掉——不留孤儿进程。')]
CHH='选择一条命令。'
S3=('读代码','','''<p>进程启动、超时、中止：</p>'''+X('packages/coding-agent/src/core/tools/bash.ts',[(112,118),(124,160)])+'''<p>截断提示：</p>'''+X('packages/coding-agent/src/core/tools/bash.ts',[(337,355)])+'''<p>错误与退出码：</p>'''+X('packages/coding-agent/src/core/tools/bash.ts',[(360,384),(400,408)])+NOTE('<b>与 Codex 对照</b>：这是两者差别最大的地方。Codex 的 shell 命令在<b>沙箱</b>中执行（macOS Seatbelt、Linux Landlock/bubblewrap、Windows 受限令牌），并根据审批策略决定是否先询问用户；它还提供可交互的长驻进程（unified exec，可以向运行中的进程写入 stdin）。见 '+codex(9,'shell 与 unified exec')+'、'+codex(11,'沙箱：macOS Seatbelt')+'。'))
S4=('真实输出','')
TERM=[['node l11.ts','== 大量输出\n  3001\n    …\n  5000\n\n  [Showing lines 3001-5000 of 5000. Full output: <临时文件>]','保留的是尾部。']]
S5=('在你的电脑上练习','直接调用 bash 工具：成功、失败、大输出、超时、中止、流式更新。')
PRAC=[('写脚本并运行（约 3 秒）。','cat > pi-mono/scratch/l11.ts <<\'EOF\'\n'+L11+'EOF\ncd pi-mono/scratch && node l11.ts',None)]
CHAL=('用 spawnHook 加一层保护','使用 <code>createBashTool(dir, { spawnHook })</code>：把每条命令包装成 <code>timeout 60 bash -c &lt;原命令&gt;</code> 并设置环境变量 <code>PI_AGENT=1</code>。再思考：这能算沙箱吗？',
'<pre>const bash = createBashTool(dir, {\n  spawnHook: (ctx) => ({\n    ...ctx,\n    command: `timeout 60 bash -c ${JSON.stringify(ctx.command)}`,\n    env: { ...ctx.env, PI_AGENT: "1" },\n  }),\n});\nawait bash.execute("1", { command: "echo $PI_AGENT" }); // 1</pre><p>这不是沙箱：命令仍以你的用户权限运行，可以读写任何你能访问的文件、访问网络。spawnHook 只是改写“怎么启动”。真正的隔离需要操作系统机制——把命令放进容器（pi 文档 <code>containerization.md</code> 的做法），或像 Codex 那样用 Seatbelt/Landlock 限制文件系统与网络。<code>JSON.stringify</code> 在这里只是演示用的引号处理，并不是可靠的 shell 转义。</p>')
QUIZ=[['bash 输出被截断时保留？',['最后 2000 行/50KB','最前面的部分','中间'],0,''],
['被截断时完整输出在哪里？',['临时文件，路径附在结果中','丢弃','details 中'],0,''],
['非零退出码的结果？',['isError，附 Command exited with code N','抛出异常','视为成功'],0,''],
['超时后？',['杀死整个进程树并抛出带输出的错误','只杀 shell','等待结束'],0,''],
['pi 的 bash 默认有沙箱吗？',['没有','有','只在 macOS 上有'],0,'']]
