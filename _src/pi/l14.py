from common import *
L14=open('/workspace/src/pi-mono/scratch/l14.ts').read()
TITLE='上下文压缩（compaction）';MIN=55;NEXT='扩展系统：工具、命令与事件钩子'
DESC='长时间工作的 agent 迟早会撑满上下文窗口。pi 的办法是<b>压缩</b>：用模型把较早的对话总结成一份结构化的“检查点”，保留最近的若干消息原文，之后发给模型的就是“系统提示 + 摘要 + 近期消息”。原始消息仍完整留在会话文件里。本课阅读 <code>core/compaction/compaction.ts</code>（1104 行），并用 faux 模型扮演“摘要器”，亲眼看到压缩时发出的请求。'
SUM=['<b>何时触发</b>：<code>contextTokens &gt; contextWindow − reserveTokens</code>（reserve 默认 16384）。在多轮运行中，工具结果追加后、下一次模型请求前检查（通过 <code>prepareNextTurn</code> 钩子）；新的用户提示前也检查。也可以手动 <code>/compact [指令]</code>。',
'<b>溢出恢复</b>：提供方报“上下文溢出”或过早的 length 停止时，可触发一次“压缩后重试”。',
'<b>切点</b>：从最新往回累加估算的 token，直到达到 <code>keepRecentTokens</code>（默认 20000）。可以在 user、assistant、bash 执行、自定义消息处切开，<b>永远不在工具结果处切开</b>（结果必须跟着它的调用）。',
'<b>切开的一轮</b>：如果切点落在某个用户消息开启的一轮中间，会生成两份摘要：更早历史的摘要 + 这一轮前半部分的摘要，然后合并。',
'<b>摘要格式</b>：固定的 Markdown 结构——Goal、Constraints &amp; Preferences、Progress（Done / In Progress / Blocked）、Key Decisions、Next Steps、Critical Context，要求保留确切的文件路径、函数名和错误信息。再次压缩时使用“更新摘要”提示，把旧摘要放在 <code>&lt;previous-summary&gt;</code> 中增量更新。<code>/compact</code> 的指令以 “Additional focus:” 追加。',
'<b>持久化</b>：追加一个 <code>compaction</code> 条目（summary、firstKeptEntryId、tokensBefore、usage、details 中累计的读/改文件列表）。构建上下文时，最新的压缩条目之前、firstKeptEntryId 之前的消息被摘要替代。',
'<b>扩展可接管</b>：<code>session_before_compact</code> 事件允许扩展取消压缩或提供自己的摘要。']
S1=('压缩前后','')
A1=[('压缩前','system + 三轮对话，约 7500 token。',[('s','system','',0,60,80),('a','第1轮','sig',100,60,80),('b','第2轮','sig',200,60,80),('c','第3轮','sig',300,60,80)]),
('找切点','从最新往回累加，超过 keepRecentTokens 的位置：落在第 2 轮中间（assistant 处）。',[('a','第1轮','',100,60,80),('b','第2轮 ✂','sig',200,60,80),('c','第3轮','ok',300,60,80)]),
('两份摘要','历史（第 1 轮）摘要 + 第 2 轮前半部分（用户请求）摘要。',[('m1','摘要：历史','ok',100,140,120),('m2','摘要：本轮前半','ok',240,140,140)]),
('压缩后','system + compactionSummary + 第 2 轮的 assistant + 第 3 轮。',[('s','system','',0,60,80),('sum','摘要','ok',100,60,80),('b','第2轮后半','',200,60,90),('c','第3轮','',310,60,80)])]
S2=('动手：会发生什么？','')
CHI=[('上下文 190k，窗口 200k，reserve 16384','190000 &gt; 200000 − 16384 = 183616 → 触发压缩','sig',''),
('切点候选落在一条工具结果上','向后找最近的合法切点（调用它的 assistant 之后的 user/assistant），工具结果不会与调用分离','ok',''),
('第二次压缩','从上次的 firstKeptEntryId 开始总结，使用“更新摘要”提示，旧摘要放在 &lt;previous-summary&gt;','ok',''),
('摘要请求自己以 length 结束','不保存：截断的摘要不能成为检查点','bad',''),
('/compact 只保留与数据库相关的内容','指令以 “Additional focus: …” 追加到摘要提示后','ok','')]
CHH='选择一种情况。'
S3=('读代码','','''<p>触发条件：</p>'''+X('packages/coding-agent/src/core/compaction/compaction.ts',[(267,270)])+'''<p>寻找切点：</p>'''+X('packages/coding-agent/src/core/compaction/compaction.ts',[(446,474)])+'''<p>摘要提示（节选）：</p>'''+X('packages/coding-agent/src/core/compaction/compaction.ts',[(507,537)])+NOTE('<b>与 Codex 对照</b>：Codex 也有 <code>/compact</code> 与自动压缩（达到 token 上限时），实现上有两种路径：本地用模型生成摘要，或在支持的 OpenAI 模型上调用服务端的远程压缩。见 '+codex(16,'压缩与 /compact')+'。'))
S4=('真实输出','')
TERM=[['node l14.ts','摘要请求 1：\n  <conversation>\n  [User]: 建一个数据库模块\n  [Assistant]: 第一轮：已创建 src/db.ts。细节…\n  </conversation>\n  The messages above are a conversation to summarize. …\n摘要请求 2：\n  # Conversation\n  [User]: 加连接池\n  …','对话被序列化为文本交给摘要器，而不是作为真实的多轮消息。']]
S5=('在你的电脑上练习','把 keepRecentTokens 调小，让 faux 模型扮演摘要器，观察压缩的两次请求与压缩后的转录。')
PRAC=[('写脚本并运行。','cat > pi-mono/scratch/l14.ts <<\'EOF\'\n'+L14+'EOF\ncd pi-mono/scratch && node l14.ts',None)]
CHAL=('为什么序列化成文本？','摘要请求把整段对话变成一条用户消息里的 <code>&lt;conversation&gt;[User]: … [Assistant]: …</code> 文本，而不是把原消息原样作为多轮对话发给模型。列出两个原因。再思考：摘要中为什么特别要求“保留确切的文件路径、函数名和错误信息”？',
'<p>原因：①避免模型“继续对话”——如果以原始多轮形式发送，最后一条是 assistant 或工具结果，模型倾向于接着干活而不是总结；变成一段待总结的材料，任务就清楚了。②摆脱协议约束——原始消息包含工具调用/结果配对、thinking 签名等，换个模型（摘要可能用便宜的模型）就需要转换，有的 API 还会拒绝；纯文本对任何模型都有效。另外也禁用了提示缓存写入，因为这种一次性请求不会被复用。</p><p>精确信息：压缩后 agent 要继续工作，它会根据摘要去 read 文件、重跑命令、搜索错误。“修改了数据库模块”无法行动，“修改了 src/db.ts 的 createPool()，错误 ECONNREFUSED 127.0.0.1:5432”可以直接行动。</p>')
QUIZ=[['默认的 reserveTokens？',['16384','20000','4096'],0,''],
['永远不会成为切点的是？',['工具结果','user 消息','assistant 消息'],0,''],
['被压缩的原始消息？',['仍在会话文件中，只是不再发给模型','被删除','移到另一个文件'],0,''],
['切点落在一轮中间时？',['生成历史摘要与本轮前半部分摘要并合并','放弃压缩','只保留本轮'],0,''],
['再次压缩时如何处理旧摘要？',['放在 previous-summary 中增量更新','丢弃','原样拼接'],0,'']]
