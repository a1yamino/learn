from common import *
L13=open('/workspace/src/pi-mono/scratch/l13.ts').read()
TITLE='会话：JSONL 树、分支与恢复';MIN=50;NEXT='上下文压缩（compaction）'
DESC='pi 把每次对话保存为一个 JSONL 文件，但它不是线性日志，而是一棵<b>树</b>：每个条目有 <code>id</code> 与 <code>parentId</code>，“当前位置”是一个叶子指针。回到早先的某一步换个方向，只需把叶子指针移回去再追加——旧的分支原样保留在同一个文件里。本课阅读 <code>session-manager.ts</code>，亲手构造一棵会话树。'
SUM=['<b>位置</b>：<code>~/.pi/agent/sessions/--&lt;cwd 路径&gt;--/&lt;时间戳&gt;_&lt;id&gt;.jsonl</code>。第一行是 <code>session</code> 头（version 3、cwd 等），之后每行一个条目。旧版本文件加载时自动迁移。',
'<b>条目类型</b>：<code>message</code>（任意 AgentMessage）、<code>model_change</code>、<code>thinking_level_change</code>、<code>usage</code>、<code>compaction</code>、<code>context_edit</code>、<code>branch_summary</code>、<code>custom</code>（扩展的私有状态，不进上下文）、<code>custom_message</code>（扩展注入、进上下文）、<code>label</code>、<code>session_info</code>。',
'<b>追加即前进</b>：每个 <code>appendXxx</code> 都以当前叶子为父创建条目，并把叶子移到新条目。文件只追加，不改写。',
'<b>延迟落盘</b>：只有在出现第一条 user 或 assistant 消息时才创建文件（一次性写入之前缓存的条目），之后逐行 append。打开 pi 不说话就退出不会留下空会话。',
'<b>分支</b>：<code>branch(id)</code> 只是移动叶子指针；<code>branchWithSummary</code> 还会为被放弃的路径写一条摘要；<code>getTree()</code> 返回整棵树。界面上对应 <code>/tree</code>（在树中切换）、<code>/fork</code>（从某条用户消息新建会话文件）、<code>/clone</code>。',
'<b>构建上下文</b>：<code>buildSessionContext()</code> 从叶子走到根，得到当前路径；遇到压缩条目时用摘要替换更早的部分；应用 context_edit；同时恢复路径上最后的模型与思考级别。其他分支对模型不可见。',
'<b>恢复</b>：<code>pi -c</code> 继续最近的会话，<code>pi -r</code> / <code>/resume</code> 选择会话；<code>SessionManager.open(path)</code> 读取文件，叶子指向最后一个条目。']
S1=('一棵会话树','')
A1=[('线性对话','user → assistant → user → assistant。叶子在末尾。',[('a','u1','',0,60,60),('b','a1','',80,60,60),('c','u2','',160,60,60),('d','a2','sig',240,60,60)]),
('branch(a1)','叶子指针移回 a1。文件不变。',[('a','u1','',0,60,60),('b','a1','sig',80,60,60),('c','u2','',160,60,60),('d','a2','',240,60,60)]),
('追加','新的 user 以 a1 为父：树出现分叉。',[('b','a1','',80,60,60),('c','u2','',160,60,60),('d','a2','',240,60,60),('e','u3','sig',160,130,60)]),
('构建上下文','从叶子走到根：u1, a1, u3, a3。u2/a2 对模型不可见，但仍在文件中。',[('a','u1','ok',0,60,60),('b','a1','ok',80,60,60),('e','u3','ok',160,130,60),('f','a3','ok',240,130,60)])]
S2=('动手：会发生什么？','')
CHI=[('启动 pi，不输入就退出','不创建会话文件（只有设置条目，没有对话）','ok',''),
('/tree 选择较早的一条消息并继续','叶子移动，新消息成为该消息的另一个子节点；同一文件','ok',''),
('/fork','从选定的用户消息创建一个新的会话文件','ok',''),
('pi -c','打开该目录最近的会话，叶子指向最后的条目','ok',''),
('扩展调用 appendEntry 保存状态','写入 custom 条目：持久化，但不进入模型上下文','sig','第 15 课。')]
CHH='选择一个操作。'
S3=('读代码','','''<p>延迟落盘与追加：</p>'''+X('packages/coding-agent/src/core/session-manager.ts',[(1166,1214)])+'''<p>路径与分支：</p>'''+X('packages/coding-agent/src/core/session-manager.ts',[(1469,1479),(1579,1584)])+NOTE('<b>与 Codex 对照</b>：Codex 把会话记录为 <b>rollout</b> 文件（同样是 JSONL），支持 <code>resume</code> 与 <code>fork</code>；它的线程模型更偏线性，分叉会产生新线程。见 '+codex(15,'rollout：恢复与分叉')+'。'))
S4=('真实输出','')
TERM=[['node l13.ts','树：\n  └ model_change\n    └ user: 用 Python 写快排\n      └ assistant: def quicksort(xs): ...\n        └ user: 改成原地排序\n          └ assistant: …\n        └ user: 改用 Rust\n          └ assistant: fn quicksort…','两个分支共享前两条消息。']]
S5=('在你的电脑上练习','直接使用 SessionManager：追加、分支、读 JSONL、打印树、构建上下文、重新打开。')
PRAC=[('写脚本并运行。','cat > pi-mono/scratch/l13.ts <<\'EOF\'\n'+L13+'EOF\ncd pi-mono/scratch && node l13.ts',None),
('看看你自己机器上真实的会话（如果用过 pi）：','ls ~/.pi/agent/sessions 2>/dev/null | head -3 || echo "(还没有会话)"','')]
CHAL=('统计花费','会话中每条 assistant 消息都带 <code>usage.cost.total</code>。写一个函数，读取一个会话文件，分别计算：①整个文件（所有分支）的总花费；②当前路径的花费。两者何时不同？',
'<pre>const sm = SessionManager.open(file);\nconst cost = (es) => es.reduce((s, e) =>\n  s + (e.type === "message" &amp;&amp; e.message.role === "assistant" ? e.message.usage.cost.total : 0), 0);\nconsole.log("全部", cost(sm.getEntries()));\nconsole.log("当前路径", cost(sm.getBranch()));</pre><p>存在分支时两者不同：被放弃的分支已经花了钱（全部包含它），但不在当前路径上。注意压缩：压缩生成摘要的那次模型调用不一定是 assistant 消息条目，严格的统计还应加上 <code>usage</code> 类型的条目（<code>appendUsage</code> 记录的辅助调用）。</p>')
QUIZ=[['会话条目之间如何关联？',['id 与 parentId 组成树','行号','时间戳'],0,''],
['branch(id) 会修改文件吗？',['不会，只移动叶子指针','会删除后续条目','会复制文件'],0,''],
['会话文件何时创建？',['第一条 user 或 assistant 消息出现时','启动时','退出时'],0,''],
['custom 条目会发给模型吗？',['不会','会','只在压缩时'],0,''],
['发给模型的消息来自？',['从叶子到根的路径','整个文件','最后 N 条'],0,'']]
