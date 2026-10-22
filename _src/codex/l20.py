from common import *
TITLE='/goal：长时间运行的目标';MIN=45;NEXT='hooks、技能与插件'
DESC='普通 agent 回合在模型停止调用工具时结束，然后等待用户。<b>/goal</b> 改变了这一点：线程有了一个持久化的目标（objective、状态、token 预算），每当线程<b>空闲</b>，Goals 扩展就自动开启一个新回合，注入“继续推进目标”的提示，直到模型用 <code>update_goal</code> 把目标标记为 complete（或 blocked、被用户暂停、预算耗尽）。pi 的 follow-up 队列（第 8 课）需要调用方主动续上；Codex 把“续上”做进了运行时。本课只设置目标、不发任何消息，看 Codex 自己跑三个回合。'
SUM=['<b>特性</b>：<code>Feature::Goals</code> 稳定且默认开启（<code>features/src/lib.rs</code>）。实现在扩展 crate <code>ext/goal</code>（约 3400 行）。',
'<b>工具</b>（<code>spec.rs</code>）：<code>get_goal</code>、<code>create_goal</code>（只在用户明确要求时）、<code>update_goal</code>（status 只能是 complete/blocked/paused；blocked 要求同一阻塞连续出现至少 3 个目标回合；paused 只能应用户要求）。这些规则写在工具描述里，直接给模型看。',
'<b>存储</b>：目标存在 <code>CODEX_HOME</code> 下的 SQLite（<code>goals_1.sqlite</code>），所以恢复线程后目标还在（<code>restore_after_resume</code>）。',
'<b>续跑循环</b>：<code>extension.rs</code> 的 <code>on_thread_idle</code> → <code>runtime.rs</code> 的 <code>continue_if_idle</code>：工具不可用、有延迟标记、目标不是 Active 都直接返回；否则用 <code>continuation_steering_item</code> 构造提示，<code>start_turn_if_idle</code> 以 <code>turn_trigger="goal"</code> 开启回合。',
'<b>继续提示</b>（<code>templates/goals/continuation.md</code>）：把 objective 当作数据放进 <code>&lt;objective&gt;</code>（XML 转义），附上已用/预算/剩余 token，并要求“以当前工作区为准、保持完整目标”。未启用 update_plan 时使用去掉相关说明的版本。另有预算耗尽与目标被修改两种模板。',
'<b>入口</b>：TUI <code>/goal 目标文本</code>（还接受 <code>/goooal</code>）；app-server <code>thread/goal/set|get|clear</code> 与通知 <code>thread/goal/updated|cleared</code>。']
S1=('无人值守的三个回合','')
A1=[('set','thread/goal/set：status=active。',[('g','goal: active','sig',0,90,120)]),('idle','线程空闲 → on_thread_idle → continue_if_idle。',[('i','idle','',0,90,70),('t','turn（trigger=goal）','sig',100,90,170)]),('complete','模型调用 update_goal(complete)，循环停止。',[('g','goal: complete','ok',0,90,140)])]
S2=('动手：会不会再开回合？','')
CHI=[('目标 active，回合刚结束','会：continue_if_idle 开启继续回合','ok',''),('模型调用了 update_goal(complete)','不会：状态不是 Active','bad',''),('用户暂停（paused）','不会','bad',''),('关闭 goals 特性','不会：工具不可用时直接返回','bad','')]
CHH='选择一种状态。'
S3=('读代码','',X('codex-rs/ext/goal/src/extension.rs',[(180,202)])+X('codex-rs/ext/goal/src/runtime.rs',[(436,444),(476,496)])+X('codex-rs/ext/goal/templates/goals/continuation.md',[(1,19)])+X('codex-rs/features/src/lib.rs',[(1973,1978)])+NOTE('<b>与 pi 对照</b>：'+pi(8,'Agent 类：状态、事件订阅、steering 与 follow-up')+'。'))
S4=('真实输出','')
TERM=[['bash l20.sh','[mock] req01 历史中的继续提示 1 条 → 第 1 步\n[mock] req03 历史中的继续提示 2 条 → 第 2 步\n[mock] req05 历史中的继续提示 3 条 → 第 3 步\nthread/goal/set → {\'status\': \'active\', \'tokensUsed\': 0, \'tokenBudget\': None}\n  turn/started #1（没有任何用户输入）\n  …\n  turn/started #3（没有任何用户输入）\n  thread/goal/updated → status = complete\nthread/goal/get → complete\nlog.txt: [\'step1\', \'step2\']','']]
S5=('在你的电脑上练习',RUNNOTE)
PRAC=[('剧本：每个继续回合做一步，第 3 步标记完成。',heredoc('s_goal.py'),''),('客户端：只设置目标，然后观察。',heredoc('l20.py'),''),('运行。',heredoc('l20.sh')+'\ncd codex/scratch && bash l20.sh',None)]
CHAL=('给目标加预算','在 <code>thread/goal/set</code> 中加入 <code>"tokenBudget": 2500</code>（mock 每次报告 1000×n 个输入 token）。会在第几步停下？状态是什么？模型最后收到的是哪个模板？',
'<p>作者实测：第 1 个继续回合有两次请求，mock 报告 1000+2000 = 3000 输入 token，超过 2500；回合结束时状态变为 <code>budgetLimited</code>（<code>thread/goal/updated</code> 与 <code>thread/goal/get</code> 都能看到），之后不再自动续跑，log.txt 中只有 step1。这次没有出现第三个请求：<code>budget_limit.md</code> 模板（<code>budget_limit_steering_item</code>）只在<b>工具执行结束</b>时注入（<code>extension.rs</code> L513–550：每次工具完成后结算 token，发现 BudgetLimited 就用 <code>inject_active_turn_steering</code> 把模板塞进进行中的回合，让模型收尾汇报）；工具 s1 结束时只计入了 1000 token，本例中越界发生在回合的最后一个请求，回合已经结束，所以没有机会注入。</p>')
QUIZ=[['谁开启继续回合？',['Goals 扩展在线程空闲时','用户','模型自己调用 continue'],0,''],['目标存在哪里？',['SQLite（goals_1.sqlite）','rollout 文件名','内存'],0,''],['模型能把目标设为 paused 吗？',['只能应用户明确要求','随时','不能设任何状态'],0,''],['objective 在提示中如何放置？',['作为 <objective> 中的数据','作为系统指令','作为工具名'],0,''],['回合的 turn_trigger？',['goal','user','cron'],0,'']]
