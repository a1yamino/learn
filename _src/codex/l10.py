from common import *
TITLE='apply_patch：补丁格式与解析';MIN=45;NEXT='沙箱：macOS Seatbelt'
DESC='pi 的 edit 工具做“精确文本替换”（oldText → newText），再加一点模糊匹配。Codex 让模型写一种专门设计的<b>补丁语言</b>：<code>*** Begin Patch</code> … <code>*** End Patch</code>，一个补丁里可以新增、删除、修改、移动多个文件。在 gpt-5.5 上它是一个 <b>custom（自由格式）工具</b>，语法用 Lark 文法约束模型输出，补丁原文不必塞进 JSON 字符串。本课在真实 codex 中应用三个补丁：新增、修改并删除、以及一个对不上的补丁。'
SUM=['<b>文法</b>（<code>apply-patch/src/parser.rs</code> 顶部注释，<code>core/assets/tools/apply_patch.lark</code>）：hunk 分为 Add File（全部为 + 行）、Delete File、Update File（可带 Move to，用 <code>@@ 上下文</code> 定位，<code>+ - 空格</code> 三种行，可选 End of File）。',
'<b>定位</b>（<code>seek_sequence.rs</code>）：在文件中查找要替换的旧行，按严格程度递减尝试：完全相等 → 忽略行尾空白 → 忽略首尾空白（还有 Unicode 标点规范化）。<code>@@ def greet(name):</code> 这样的上下文行先把搜索起点移到该行。',
'<b>先验证再写入</b>：找不到旧行就整体失败：“apply_patch verification failed: Failed to find expected lines …”，文件保持不变，错误回给模型重试。',
'<b>结果</b>：成功时输出 “Success. Updated the following files:” 与 A/M/D 列表，并报告退出码与耗时。',
'<b>与沙箱、审批的关系</b>：apply_patch 也要通过安全检查——默认 read-only 沙箱、审批策略 never 时得到 “patch rejected: writing is blocked by read-only sandbox; rejected by user approval settings”。<code>--sandbox workspace-write</code> 允许写工作目录。',
'<b>独占执行</b>：apply_patch 不支持并行（第 7 课），修改文件时不会与其他工具交错；修改还会被 <code>turn_diff_tracker</code> 记录，生成整个 turn 的 diff。']
S1=('一个补丁的旅程','')
A1=[('解析','按文法切成 hunk：Update greet.py、Delete old.txt。',[('p','*** Begin Patch','',0,90,150),('h1','Update','sig',190,40,90),('h2','Delete','sig',190,140,90)]),('定位','seek_sequence：@@ 上下文 → 找旧行（精确 → 宽松）。',[('f','greet.py','',0,90,100),('s','seek_sequence','sig',140,90,140)]),('写入','全部验证通过后写盘；输出 M greet.py / D old.txt。',[('o','Success','ok',0,90,100)])]
S2=('动手：会成功吗？','')
CHI=[('Add File 两个新文件','成功：A greet.py、A old.txt','ok',''),('旧行多了行尾空格','成功：第二轮比较忽略行尾空白','ok',''),('旧行在文件中不存在','verification failed，文件不变','bad',''),('read-only 沙箱 + approval never','patch rejected','bad','')]
CHH='选择一个补丁。'
S3=('读代码','',X('codex-rs/apply-patch/src/parser.rs',[(1,24)])+'<p>逐级放宽的匹配：</p>'+X('codex-rs/apply-patch/src/seek_sequence.rs',[(1,6),(35,40)])+NOTE('<b>与 pi 对照</b>：'+pi(10,'edit 工具：精确替换、diff 与文件修改队列')+'。两者都要求“旧文本必须能找到”，都做了容错；Codex 用一种多文件补丁语言，pi 用逐处替换。'))
S4=('真实输出','')
TERM=[['bash l10.sh','  p2 → Exit code: 0 ⏎ … Success. Updated the following files: ⏎ M greet.py ⏎ D old.txt\n  p3 → apply_patch verification failed: Failed to find expected lines in …/greet.py','']]
S5=('在你的电脑上练习',RUNNOTE+' 自由格式工具调用的输出项类型是 <code>custom_tool_call</code>，字段 <code>input</code> 是补丁原文。')
PRAC=[('三个补丁。',heredoc('s_patch.py'),''),('在 workspace-write 沙箱下应用。',heredoc('l10.sh')+'\ncd codex/scratch && bash l10.sh',None)]
CHAL=('移动并修改','写一个补丁：把 greet.py 移动到 <code>pkg/greet.py</code>，同时把函数名改成 <code>hello</code>。',
'<pre style="white-space:pre-wrap">*** Begin Patch\n*** Update File: greet.py\n*** Move to: pkg/greet.py\n@@\n-def greet(name):\n+def hello(name):\n*** End Patch</pre><p>Move to 必须紧跟在 Update File 之后（文法 <code>update_hunk: … change_move? change?</code>）。结果列表中以 M 显示目标文件，原文件被删除，中间目录会被创建。</p>')
QUIZ=[['gpt-5.5 上 apply_patch 的工具类型？',['custom（Lark 文法）','function','MCP'],0,''],['找不到旧行时？',['整个补丁失败，文件不变','跳过该 hunk','追加到末尾'],0,''],['seek_sequence 的第二轮比较？',['忽略行尾空白','忽略大小写','模糊编辑距离'],0,''],['@@ 上下文行的作用？',['移动搜索起点','注释','分隔文件'],0,''],['read-only 沙箱下打补丁？',['被拒绝','成功','询问模型'],0,'']]
