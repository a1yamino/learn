from common import *
TITLE='rollout：恢复与分叉';MIN=40;NEXT='压缩与 /compact'
DESC='pi 把会话存成一棵 JSONL 树，分支就是树上的另一条路径（第 13 课）。Codex 的做法更“线性”：每个线程一个 <b>rollout</b> 文件（<code>$CODEX_HOME/sessions/年/月/日/rollout-时间-线程id.jsonl</code>），追加写入；<b>resume</b> 读回它并在同一线程继续，<b>fork</b> 则把历史复制进一个新线程、生成新文件。可查询的元数据（标题、时间、cwd……）另存于 SQLite。本课用一个“报告自己看到了哪些用户消息”的剧本，验证恢复与分叉后的历史。'
SUM=['<b>RolloutItem</b>（<code>history/src/lib.rs</code>）：每行一个条目——SessionMeta（线程元信息）、ResponseItem（发给模型的历史）、TurnContext（每个 turn 的设置）、EventMsg（给前端的事件）、Compacted（压缩结果）、WorldState、TokenUsageRecord 等。实验中一个最简单的 turn 写出 1+6+4+1+1+1 行。',
'<b>两种数据</b>：ResponseItem/Compacted 用来重建模型看到的历史；EventMsg 用来重放界面。恢复时据此重建上下文与 UI。',
'<b>thread store</b>（<code>thread-store/README.md</code>）：<code>ThreadStore</code> 是存储边界；本地实现用 rollout JSONL 存历史、SQLite 存可查询元数据；<code>LiveThread</code> 负责活动会话的持久化。',
'<b>resume</b>：<code>codex exec resume --last</code> 或按 id/名字；交互模式 <code>codex resume</code> 提供选择器。实验中第二句时模型看到了“第一句 / 第二句”。',
'<b>fork</b>：<code>codex exec fork &lt;id&gt;</code>、交互式 <code>codex fork</code>、TUI 的 /fork；内核 <code>ThreadManager::fork_thread_from_history</code> 以快照历史启动新线程。分叉后 <code>--last</code> 指向最新的那个线程（实验第 4 步继续的是分叉线）。',
'<b>对比 pi</b>：pi 在同一文件里用 parentId 形成树，可在树上任意跳转；Codex 用“复制成新线程”实现分支，每个线程的文件保持线性。']
S1=('resume 与 fork','')
A1=[('新会话','线程 A：rollout-A.jsonl 追加写入。',[('a','线程 A','sig',0,90,90),('f','rollout-A.jsonl','',140,90,150)]),('resume','继续写同一个文件。',[('a','线程 A','sig',0,90,90),('f','rollout-A.jsonl（追加）','ok',140,90,190)]),('fork','历史复制到线程 B，新文件。',[('a','线程 A','',0,40,90),('b','线程 B','sig',0,140,90),('f','rollout-B.jsonl','ok',140,140,150)])]
S2=('动手：模型会看到什么？','')
CHI=[('新会话说“第一句”','第一句','ok',''),('resume --last 说“第二句”','第一句 / 第二句','ok',''),('fork 第一个会话说“分叉的一句”','第一句 / 第二句 / 分叉的一句','ok','fork 复制的是该线程当前的全部历史。'),('再 resume --last','继续的是分叉出的新线程','sig','')]
CHH='选择一步。'
S3=('读代码','',X('codex-rs/history/src/lib.rs',[(213,231)])+X('codex-rs/thread-store/README.md',[(1,30)])+X('codex-rs/core/src/thread_manager.rs',[(1588,1600)])+NOTE('<b>与 pi 对照</b>：'+pi(13,'会话：JSONL 树、分支与恢复')+'。'))
S4=('真实输出','')
TERM=[['bash l15.sh','== 3. exec fork <id>：从第一个会话分叉出新线程\n我看到的用户消息：第一句 / 第二句 / 分叉的一句\n…\n== rollout 文件数：2','']]
S5=('在你的电脑上练习',RUNNOTE)
PRAC=[('剧本：报告看到的用户消息。',heredoc('s_mem.py'),''),('新建、恢复、分叉。',heredoc('l15.sh')+'\ncd codex/scratch && bash l15.sh',None)]
CHAL=('读 rollout','写一个脚本，从 rollout JSONL 中只提取 <code>response_item</code> 行，按顺序打印每条的 type/role 与文本前 40 个字符。它与 req 文件中的 input 一致吗？',
'<pre style="white-space:pre-wrap">import json, sys\nfor l in open(sys.argv[1]):\n    r = json.loads(l)\n    if r["type"] != "response_item": continue\n    p = r["payload"]; t = p.get("type"); role = p.get("role", "")\n    text = "".join(c.get("text", "") for c in p.get("content", []) or [])\n    print(t, role, text[:40].replace("\\n", " "))</pre><p>rollout 中的 response_item 就是模型历史的来源，与请求 input 基本一致：开场的 developer/user 上下文消息、用户消息、助手回答都在其中。差异在于请求是“历史 + 本次新增上下文”的组合；压缩之后两者的差别会更明显（下一课）。</p>')
QUIZ=[['rollout 文件的位置？',['$CODEX_HOME/sessions/年/月/日/','项目目录','/tmp'],0,''],['fork 如何实现分支？',['复制历史到新线程、新文件','在同一文件中加 parentId','git 分支'],0,''],['EventMsg 行的用途？',['重放界面','发给模型','计费'],0,''],['resume --last 选择？',['最近的线程','第一个线程','随机'],0,''],['可查询的元数据存在？',['SQLite','rollout 文件名','环境变量'],0,'']]
