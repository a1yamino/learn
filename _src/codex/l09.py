from common import *
TITLE='shell 与 unified exec';MIN=45;NEXT='apply_patch：补丁格式与解析'
DESC='pi 的 bash 工具执行一条命令、等它结束、截断输出尾部。Codex 的 <b>unified exec</b> 更像一个终端复用器：<code>exec_command</code> 在 PTY 中启动进程，最多等待 <code>yield_time_ms</code>；进程还没结束就返回一个 <b>session ID</b>，模型之后可以用 <code>write_stdin</code> 继续输入、读取新输出。于是交互式程序（REPL、提示输入、长时间构建）也能被 agent 驱动。本课在真实 codex 中走一遍：提示输入 → 写入 stdin → 一条十万行的输出被截断。'
SUM=['<b>exec_command</b>：参数 cmd、workdir、shell、login、tty、yield_time_ms、max_output_tokens，以及审批相关的 sandbox_permissions/justification/prefix_rule。yield_time_ms 被限制在 250–30000 ms。',
'<b>会话</b>：进程未结束时输出 “Process running with session ID N”；<code>write_stdin{session_id, chars}</code> 向它写入并收集新输出（chars 为空就只是轮询）。最多同时保留 64 个进程。',
'<b>输出格式</b>（<code>tools/context.rs</code>）：Chunk ID、Wall time、退出码或 session ID、Original token count，然后是 Output。模型据此判断进程状态。',
'<b>截断</b>：超过 max_output_tokens（默认 10000）时保留<b>开头与结尾</b>，中间用省略标记替换，并加上 “Warning: truncated output (original token count: …)” 和总行数。对比 pi 只保留尾部。',
'<b>编排</b>（<code>unified_exec/mod.rs</code> 的说明）：构建请求 → 编排器处理审批（跳过/缓存/询问）→ 选择沙箱 → 在 PTY 中运行；若被沙箱拒绝且策略允许，以无沙箱重试（不再询问）。第 11–13 课展开。',
'<b>登录 shell</b>：命令通过 <code>/bin/bash -lc</code> 运行；core 中还有 shell 环境快照机制（<code>shell_snapshot.rs</code>）。']
S1=('一个交互式进程','')
A1=[('启动','exec_command(tty) → 500ms 后进程仍在等输入 → 返回 session ID。',[('e','exec_command','',0,90,130),('s','session 73009','sig',170,90,140)]),('输入','write_stdin("codex\\n") → 进程输出并退出。',[('w','write_stdin','ok',0,90,120),('s','session 73009','sig',160,90,140),('o','你好, codex','ok',330,90,110)]),('截断','十万行输出：保留头和尾。',[('h','1 2 3 …','',0,90,100),('m','（省略）','bad',120,90,90),('t','… 100000','',230,90,110)])]
S2=('动手：输出会是什么样？','')
CHI=[('命令 0.1 秒内结束','Process exited with code 0 + 全部输出','ok',''),('命令需要输入，yield 500ms','Process running with session ID N','sig',''),('write_stdin 空字符串','轮询：返回新产生的输出','ok',''),('输出 14 万 token，max_output_tokens=200','保留开头与结尾，标注 truncated 与总行数','sig','')]
CHH='选择一种情况。'
S3=('读代码','',X('codex-rs/core/src/unified_exec/mod.rs',[(1,24),(68,77)])+'<p>输出头部：</p>'+X('codex-rs/core/src/tools/context.rs',[(524,549)])+NOTE('<b>与 pi 对照</b>：'+pi(9,'编码工具集')+' 与 '+pi(11,'bash 工具：进程、输出截断与中止')+'。'))
S4=('真实输出','')
TERM=[['bash l09.sh','>> exec_command {"cmd": "read -p \'名字? \' x; echo 你好, $x", "tty": true, "yield_time_ms": 500}\n   Process running with session ID 73009\n   Output:\n   名字? \n>> write_stdin {"session_id": 73009, "chars": "codex\\n", …}\n   Process exited with code 0\n   你好, codex','']]
S5=('在你的电脑上练习',RUNNOTE)
PRAC=[('剧本：读取 session ID 并写入 stdin。',heredoc('s_exec.py'),''),('运行，打印三次工具输出。',heredoc('l09.sh')+'\ncd codex/scratch && bash l09.sh',None)]
CHAL=('后台进程','让模型启动 <code>python3 -m http.server 8999</code>（yield 1000ms），再用另一个 exec_command 执行 <code>curl -s localhost:8999 | head -3</code>，最后不结束服务器就回答。turn 结束后服务器还在吗？',
'<p>第一次调用返回 session ID，服务器在后台运行；第二个命令能拿到目录列表。turn 结束后进程仍在（unified exec 进程属于会话而非 turn），直到会话关闭或被清理——这正是 Op::CleanBackgroundTerminals 与中断提示里“正在运行的 unified exec 进程可能仍在后台运行”的由来。如果实验中启动失败，先检查沙箱：默认的 read-only 沙箱下可改用 <code>--sandbox danger-full-access</code>（仅在临时目录中这样做）。</p>')
QUIZ=[['进程未结束时 exec_command 返回？',['session ID','错误','空输出'],0,''],['向进程写输入用？',['write_stdin','exec_command','apply_patch'],0,''],['截断保留哪部分？',['开头与结尾','只有结尾','只有开头'],0,''],['yield_time_ms 上限？',['30000 ms','无限','1000 ms'],0,''],['被沙箱拒绝后？',['策略允许时无沙箱重试','直接失败','重启'],0,'']]
