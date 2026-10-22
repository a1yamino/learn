from common import *
TITLE='压缩与 /compact';MIN=40;NEXT='MCP：接入外部工具服务器'
DESC='上下文窗口是有限的。pi 在接近上限时让模型写摘要并替换旧消息（第 14 课）；Codex 也是如此，但多了两条路径：支持远程压缩的 provider（OpenAI）走服务端压缩，其余 provider 走<b>本地压缩</b>——把 <code>prompt.md</code> 作为一条用户消息追加到历史末尾，请模型写“交接摘要”，再用“初始上下文 + 用户消息 + 摘要”重建历史。本课把阈值调到 1500 token，观察一次真实的回合中压缩。'
SUM=['<b>触发阈值</b>：<code>ModelInfo::auto_compact_token_limit</code>（<code>protocol/src/openai_models.rs</code>）= min(配置项 <code>model_auto_compact_token_limit</code>, 上下文窗口 × 90%)。',
'<b>时机</b>：回合前（PreTurn）、回合中（MidTurn，工具调用之间）、回合后（PostTurn）都会检查；实验中第 2 次工具调用之后触发了回合中压缩。换到更小窗口的模型时也会压缩（<code>CompactionReason::ModelDownshift</code>）。',
'<b>路径选择</b>（<code>session/turn.rs</code>）：<code>provider.capabilities().remote_compaction</code> 为 V2 时走 <code>compact_remote_v2</code>；Unsupported（如本课的 mock）时走本地 <code>compact.rs::run_inline_auto_compact_task</code>。',
'<b>本地压缩请求</b>：历史 + 一条 user 消息 <code>prompts/templates/compact/prompt.md</code>（“CONTEXT CHECKPOINT COMPACTION…”），工具列表为空（实验 req03 工具 0 个）。',
'<b>重建历史</b>（<code>build_compacted_history</code>）：初始上下文 + 最近的用户消息（总量上限 <code>COMPACT_USER_MESSAGE_MAX_TOKENS</code> = 20 000）+ 以 <code>summary_prefix.md</code> 开头的摘要。工具调用与输出不再保留（实验 req04 只剩 5 条）。',
'<b>持久化</b>：rollout 写入一行 <code>compacted</code>，恢复时据此直接还原压缩后的历史。',
'<b>手动</b>：TUI 的 <code>/compact</code>（<code>tui/src/chatwidget/slash_dispatch.rs</code>），app-server 的 <code>thread/compact/start</code>。']
S1=('一次回合中压缩','')
A1=[('req01–02','正常：用户消息 → 工具调用 → 工具输出。',[('h','历史 6 条','sig',0,90,150)]),('req03','超过 1500 token：追加压缩提示，工具 0 个。',[('h','历史 8 条','',0,90,150),('p','+ prompt.md','sig',160,90,120)]),('req04','重建：初始上下文 + 用户消息 + 摘要。',[('h','历史 5 条','ok',0,90,150)])]
S2=('动手：压缩后剩下什么？','')
CHI=[('developer 基础指令','保留（初始上下文）','ok',''),('用户消息“数文件”','保留（最近的用户消息）','ok',''),('exec_command 调用与输出','丢弃，信息只在摘要里','bad','因此摘要必须写清楚已做的事。'),('模型写的摘要','以 summary_prefix 开头，作为 user 消息','ok','')]
CHH='选择一条历史。'
S3=('读代码','',X('codex-rs/protocol/src/openai_models.rs',[(529,540)])+X('codex-rs/core/src/session/turn.rs',[(1552,1555),(1598,1612)])+X('codex-rs/core/src/compact.rs',[(61,63),(697,708)])+X('codex-rs/prompts/templates/compact/prompt.md',[(1,9)])+NOTE('<b>与 pi 对照</b>：'+pi(14,'上下文压缩（compaction）')+'。pi 保留最近若干 token 的原始消息；Codex 本地压缩只保留用户消息与摘要。'))
S4=('真实输出','')
TERM=[['bash l16.sh','== req03.json  工具 0 个，input 9 条\n  …\n  message  user  You are performing a CONTEXT CHECKPOINT COMPACTION…\n== req04.json  工具 10 个，input 5 条\n  …\n  message  user  Another language model started to solve this problem…\n== rollout 中的 compacted 行：1','']]
S5=('在你的电脑上练习',RUNNOTE)
PRAC=[('剧本：识别压缩请求并回摘要。',heredoc('s_compact.py'),''),('运行并查看请求。',heredoc('l16.sh')+'\ncd codex/scratch && bash l16.sh',None)]
CHAL=('无限压缩',
'去掉 <code>s_compact.py</code> 中对 “Another language model” 的判断再运行。为什么会一直压缩下去？真实环境中什么能阻止这种情况？',
'<p>去掉后，压缩完成的新历史中没有工具输出，剧本又从 <code>ls</code> 开始；而 mock 报告的 input_tokens 是 1000×n，随请求数单调增长，永远超过 1500，于是每两次请求就压缩一次——这正是作者第一次运行时看到的 500 多个请求（用 <code>timeout</code> 中止）。</p><p>真实环境中，压缩后的历史明显变短，服务端报告的 token 数随之下降；另外摘要会告诉模型“已经执行过 ls”，模型不会重来。教训：压缩依赖于“摘要足够好”与“token 统计真实”两个前提。</p>')
QUIZ=[['本地压缩的提示放在哪？',['作为最后一条 user 消息','系统提示','工具描述'],0,''],['压缩后工具输出？',['不保留','全部保留','保留最后一个'],0,''],['阈值？',['min(配置值, 窗口×90%)','固定 10 万','窗口×50%'],0,''],['mock provider 走哪条路径？',['本地','远程 V2','不压缩'],0,'remote_compaction 为 Unsupported。'],['手动压缩？',['/compact 或 thread/compact/start','/clear','codex reset'],0,'']]
