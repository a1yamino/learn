from common import *
TITLE='斜杠命令';MIN=35;NEXT='/plan 与 update_plan'
DESC='pi 的斜杠命令来自扩展与提示模板（第 16 课）；Codex 的斜杠命令是 TUI 中一个<b>枚举</b> <code>SlashCommand</code>：枚举顺序就是弹窗顺序，每个命令有描述、是否接受行内参数、任务进行中是否可用等属性，再由 <code>slash_dispatch.rs</code> 分派。有的命令只改界面状态，有的调用 app-server 方法，还有的（如 <code>/init</code>）只是把一段内置提示当作普通用户消息提交。本课在伪终端中驱动真实的 TUI。'
SUM=['<b>定义</b>：<code>tui/src/slash_command.rs</code> 的 <code>enum SlashCommand</code>（注释写着“DO NOT ALPHA-SORT! Enum order is presentation order”），strum 负责名字与别名（如 <code>/pwd</code> 别名 <code>/cwd</code>，<code>/stop</code> 别名 <code>/clean</code>）。',
'<b>属性</b>：<code>description()</code>；<code>supports_inline_args()</code>（如 <code>/plan 文本</code>、<code>/goal 目标</code>）；<code>available_during_task()</code>——<code>/compact</code>、<code>/plan</code>、<code>/new</code> 等在回合进行中被拒绝；<code>available_in_side_conversation()</code>。',
'<b>可见性</b>（<code>bottom_pane/slash_commands.rs</code>）：<code>builtins_for_input</code> 按特性开关过滤：没有协作模式就没有 <code>/plan</code>，没有 Goals 特性就没有 <code>/goal</code>，<code>/apps</code>、<code>/plugins</code>、<code>/worktree</code> 等同理。服务档位命令（如 <code>/fast</code>）是动态插入在 <code>/model</code> 之后的 <code>ServiceTier</code> 条目。',
'<b>查找</b>：<code>find_builtin_command</code> 先 <code>from_str</code>，还接受 <code>/goooal</code> 这种多个 o 的写法——仍解析为 <code>/goal</code>。',
'<b>分派</b>（<code>chatwidget/slash_dispatch.rs</code>）：<code>/init</code> = 提交 <code>assets/prompt_for_init_command.md</code>；<code>/compact</code> 设置状态栏后请求压缩；<code>/plan</code> 切换协作模式（下一课）。',
'<b>与 exec 的关系</b>：斜杠命令只存在于 TUI；<code>codex exec "/init"</code> 只会把字面量“/init”发给模型。']
S1=('从按键到动作','')
A1=[('输入 /','弹窗列出可见的内置命令。',[('p','popup：/model /fast /presets …','sig',0,90,230)]),('过滤','/co → compact、config、copy。',[('p','/compact /config /copy','sig',0,90,200)]),('分派','/init：提交内置提示为用户消息。',[('d','slash_dispatch','sig',0,90,120),('m','user：Generate AGENTS.md…','ok',150,90,170)])]
S2=('动手：回合进行中能用吗？','依据 available_during_task()。')
CHI=[('/compact','不能：会改动正在使用的历史','bad',''),('/plan','不能','bad',''),('/diff','可以','ok',''),('/status','可以','ok','')]
CHH='选择一个命令。'
S3=('读代码','',X('codex-rs/tui/src/slash_command.rs',[(12,16),(172,186),(249,258)])+X('codex-rs/tui/src/bottom_pane/slash_commands.rs',[(72,79),(118,123)])+X('codex-rs/tui/src/chatwidget/slash_dispatch.rs',[(328,331)])+NOTE('<b>与 pi 对照</b>：'+pi(16,'斜杠命令与提示模板')+'。'))
S4=('真实输出','')
TERM=[['bash l18.sh','== 2. 输入 /co（模糊过滤）\n  › /compact  summarize conversation to prevent hitting the context limit\n    /config   configure Codex preferences\n    /copy     copy the last response or part of it\n== 3. /init 回车：把内置提示作为一条普通用户消息提交\n  …\n   模型收到的最后一条用户消息： Generate a file named AGENTS.md that serves as a contributor guide for','']]
S5=('在你的电脑上练习',RUNNOTE+'<p><code>tui.py</code> 在伪终端中启动 codex，回应终端查询，并用一个极简的屏幕模拟器还原画面。</p>')
PRAC=[('伪终端驱动器。',heredoc('tui.py'),''),('三个实验。',heredoc('l18.sh')+'\ncd codex/scratch && bash l18.sh',None)]
CHAL=('任务中按 /compact','写一个剧本让模型执行 <code>sleep 5</code>，在 TUI 中提交消息后立刻输入 <code>/compact</code> 回车。会发生什么？在源码中找到给出提示的位置。',
'<p>命令被拒绝，界面显示 <code>\'/compact\' is disabled while a task is in progress.</code>。这一检查在输入框层：<code>bottom_pane/chat_composer.rs</code> 的 <code>reject_slash_command_if_unavailable</code>（任务运行中且 <code>available_during_task()</code> 为 false 时拒绝；需要 <code>requires_dispatch_validation</code> 的命令如 /review 交给分派层）。分派层 <code>slash_dispatch.rs</code> L142 起还有一道同样的检查，覆盖回合正在启动、审阅模式等情况。用 <code>tui.py</code> 时按键序列可写成 <code>"跑一下\\r" "/compact\\r"</code>。</p>')
QUIZ=[['弹窗顺序由什么决定？',['枚举声明顺序','字母序','使用频率统计'],0,''],['/init 做了什么？',['提交内置提示作为用户消息','直接写 AGENTS.md','调用 git'],0,''],['为何看不到 /goal？',['Goals 特性被关闭','需要登录','只在 exec 可用'],0,''],['/fast 来自？',['服务档位命令','SlashCommand 枚举中的 Fast','插件'],0,''],['codex exec "/init" 会？',['把字面量发给模型','执行 /init','报错'],0,'']]
