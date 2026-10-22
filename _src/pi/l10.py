from common import *
L10=open('/workspace/src/pi-mono/scratch/l10.ts').read()
TITLE='edit 工具：精确替换、diff 与文件修改队列';MIN=55;NEXT='bash 工具：进程、输出截断与中止'
DESC='编码 agent 最常做、也最容易出错的事情是修改文件。pi 的 edit 工具采用“精确文本替换”：模型给出 <code>oldText</code> 与 <code>newText</code>，旧文本必须在文件中唯一出现。看似简单，实现里却处理了大量现实问题：多处修改如何避免偏移错乱、模型把弯引号写成直引号怎么办、Windows 换行与 BOM、重叠修改、旧版参数格式。'
SUM=['<b>参数</b>：<code>path</code> + <code>edits[]</code>（每项 oldText/newText）。所有 edits 都相对<b>原文件</b>匹配，而不是依次应用后的结果；然后按位置倒序替换，偏移保持稳定。',
'<b>四种拒绝</b>：oldText 为空；找不到（“must match exactly including all whitespace and newlines”）；出现多次（“Please provide more context to make it unique”）；两个 edit 重叠（“Merge them into one edit”）。替换后内容不变也报错。每条错误都告诉模型下一步该怎么做。',
'<b>模糊匹配</b>：精确匹配失败时，在规范化空间中再试一次：NFKC、去除行尾空白、弯引号→直引号、各种破折号→连字符、特殊空格→普通空格。匹配成功后，只有被修改的行采用规范化文本，<b>未修改的行保留原始字节</b>。',
'<b>换行与 BOM</b>：读文件后先剥离 BOM、检测原换行风格、统一转为 LF 再匹配；写回时恢复原换行与 BOM。模型永远不需要关心 <code>\\r\\n</code>。',
'<b>兼容旧参数</b>：<code>prepareArguments</code> 把旧格式（顶层 oldText/newText）或单个对象转换为 <code>edits[]</code>。它由循环在校验前调用，所以直接调用 <code>execute</code> 时不会生效。',
'<b>结果</b>：给模型的只是一行“Successfully replaced N block(s)”；完整的 diff、统一补丁、首个修改行号放在 <code>details</code> 中供 TUI 渲染——节省上下文。整个修改在文件修改队列中进行。']
S1=('多处修改的匹配','所有 edit 都在原文件中定位。')
A1=[('原文件','4 行，CRLF，带 BOM。',[('f','原文件','sig',0,60,140)]),
('规范化','剥离 BOM，CRLF→LF。',[('f','LF 文本','sig',0,60,140)]),
('定位','edit0 在第 2 行，edit1 在第 4 行；检查唯一性与重叠。',[('f','LF 文本','',0,60,140),('a','edit0 @2','ok',180,40,100),('b','edit1 @4','ok',180,100,100)]),
('倒序替换','先替换靠后的，再替换靠前的。',[('b','edit1 ✓','ok',180,100,100),('a','edit0 ✓','ok',180,40,100)]),
('写回','恢复 CRLF 与 BOM；生成 diff 放入 details。',[('o','写回文件','ok',340,60,140),('d','details.diff','',340,130,140)])]
S2=('动手：这次 edit 的结果？','文件第一行是 <code>const greeting = “hello”;␠␠</code>（弯引号、两个尾随空格）。')
CHI=[('oldText 用直引号、没有尾随空格','精确匹配失败 → 模糊匹配成功\n该行被替换；其他行字节不变','ok',''),
('oldText = " = 1;"','Found 2 occurrences … Please provide more context to make it unique.','bad',''),
('两个 edit 都覆盖 "let m = 1;"','edits[0] and edits[1] overlap … Merge them into one edit','bad',''),
('newText 与 oldText 相同','No changes made to app.ts. The replacement produced identical content.','bad',''),
('文件不存在','Could not edit file: app.ts. Error code: ENOENT.','bad','')]
CHH='选择一种 edit。'
S3=('读代码','','''<p>参数定义——描述就是给模型的使用说明：</p>'''+X('packages/coding-agent/src/core/tools/edit.ts',[(21,41)])+'''<p>执行：BOM、换行、匹配、写回、diff：</p>'''+X('packages/coding-agent/src/core/tools/edit.ts',[(185,201)])+'''<p>模糊规范化：</p>'''+X('packages/coding-agent/src/core/tools/edit-diff.ts',[(34,55)])+'''<p>匹配所有 edits：</p>'''+X('packages/coding-agent/src/core/tools/edit-diff.ts',[(300,362)])+NOTE('<b>与 Codex 对照</b>：Codex 用 <code>apply_patch</code> 修改文件：模型输出一种自定义的补丁格式（*** Begin Patch / *** Update File / @@ 上下文……），可以在一次调用中新增、删除、移动多个文件；补丁会被解析、校验，并经过审批与沙箱。见 '+codex(10,'apply_patch')+'。'))
S4=('真实输出','')
TERM=[['node l10.ts','== 模糊匹配：直引号、无尾随空格\n  Successfully replaced 1 block(s) in app.ts.\n  -1 const greeting = “hello”;  \n  +1 const greeting = "hi";\n   2 let n = 1;\n  BOM 保留: true  CRLF 保留: true','模糊匹配后，只有被修改的行改变。']]
S5=('在你的电脑上练习','在一个带 BOM 与 CRLF、含弯引号的文件上尝试各种 edit。')
PRAC=[('写脚本并运行。','cat > pi-mono/scratch/l10.ts <<\'EOF\'\n'+L10+'EOF\ncd pi-mono/scratch && node l10.ts',None)]
CHAL=('为什么不用行号？','有人提议让模型用“替换第 12–15 行”的方式编辑。结合本课内容，列出精确文本替换相对于行号的三个优点，以及它的一个代价。',
'<p>优点：①<b>对过期视图稳健</b>：模型读文件后，文件可能已被它自己的另一个 edit、bash 命令或用户修改，行号会漂移，而文本匹配要么命中正确位置要么明确失败；②<b>自我验证</b>：oldText 必须存在且唯一，等于让模型证明它“看到了”要改的内容，错误能被立即发现并给出可操作的提示；③<b>多处修改无需计算偏移</b>：所有 edit 相对原文件匹配，模型不需要推算前一处修改造成的行号变化。</p><p>代价：输出 token 更多（必须复述旧文本），并且对空白、引号等字符敏感——这正是模糊匹配存在的原因。Codex 的 apply_patch 选择了另一种折中：用上下文行定位的补丁格式。</p>')
QUIZ=[['多个 edits 的匹配基准是？',['原文件','依次应用后的文件','最后一个 edit'],0,''],
['oldText 出现两次时？',['报错，要求提供更多上下文','替换第一个','全部替换'],0,''],
['文件是 CRLF，模型给的 oldText 是 LF？',['统一为 LF 匹配，写回时恢复 CRLF','匹配失败','文件被改成 LF'],0,''],
['模糊匹配后未修改的行？',['保留原始字节','也被规范化','被删除'],0,''],
['完整 diff 放在哪里？',['details，供界面渲染','发送给模型的文本中','日志文件'],0,'']]
