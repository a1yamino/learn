from common import *
TITLE='毕业项目：在 Codex 上搭一个可审计的修复流程';MIN=60;NEXT=None
DESC='pi 的毕业项目用 SDK 写了一个迷你编码 agent（第 20 课）。Codex 的内核已经完整，我们要做的是在它之上搭<b>流程</b>：用 app-server 协议（第 23 课）启动一个线程，沙箱为 workspace-write、审批为 on-request（第 11–13 课），让模型跑测试、打补丁（第 10 课）、再验证；所有越权请求都交给我们自己的审批策略——只放行白名单；每个条目与每次审批决定都写进 <code>audit.jsonl</code>。整个流程不到 60 行 Python，却用到了本课程的大部分机制。'
SUM=['<b>边界由内核保证</b>：沙箱内的命令（跑测试）与工作区内的补丁不需要审批，直接执行；需要越权（<code>sandbox_permissions: "require_escalated"</code>）的 <code>git push</code> 触发一次服务器→客户端的审批请求。',
'<b>策略由我们决定</b>：<code>on_request</code> 去掉 <code>/bin/bash -lc</code> 包装后按前缀白名单判断——这一点很重要：审批里看到的是包装后的命令，直接 startswith 会全部失败。',
'<b>拒绝不是失败</b>：被拒绝的命令以 status=declined 结束，模型收到 “rejected by user” 并据此调整，最终总结里如实写出“推送被拒绝，留给人工处理”。',
'<b>审计</b>：只依赖 app-server 的 <code>item/completed</code> 通知与审批请求本身，不需要解析日志；rollout 文件（第 15 课）是另一份完整记录，可用于复盘。',
'<b>可扩展</b>：把白名单换成 execpolicy 规则（第 13 课）、加一个 PreToolUse 钩子（第 21 课）、用 <code>thread/goal/set</code> 让它跑到测试全绿为止（第 20 课）、用 <code>--output-schema</code> 输出机器可读的结论（第 23 课）。']
S1=('一次修复的全过程','')
A1=[('测试','沙箱内运行：FAILED (errors=1)。',[('t','unittest ✗','bad',0,90,120)]),('补丁 + 验证','apply_patch calc.py → OK。',[('p','apply_patch','ok',0,90,120),('t','unittest ✓','ok',150,90,120)]),('越权','git push → 审批 → 不在白名单 → decline。',[('g','git push','sig',0,90,100),('d','decline','bad',140,90,90),('a','audit.jsonl','ok',260,90,110)])]
S2=('动手：会经过审批吗？','沙箱 workspace-write，审批 on-request。')
CHI=[('python3 -m unittest（沙箱内）','不经过：直接执行','ok',''),('apply_patch 修改工作区内的 calc.py','不经过：工作区可写','ok',''),('git push，申请 require_escalated','经过：我们的策略拒绝','bad',''),('把 git push 加入 ALLOW 后','经过：策略放行（并在 audit.jsonl 中留下记录）','sig','')]
CHH='选择一步。'
S3=('读代码','','<p>本课的代码就是练习中的 <code>fixflow.py</code>；它依赖的内核机制分别在第 10、12、13、23 课读过。</p>'+NOTE('<b>与 pi 对照</b>：'+pi(20,'毕业项目：用 SDK 写一个迷你编码 agent')+'。pi 的项目自己实现循环与工具；这里循环、工具、沙箱都在 Codex 内核中，我们只写策略与审计。'))
S4=('真实输出','')
TERM=[['bash l24.sh','  命令 "/bin/bash -lc \'python3 -m unittest -q 2>&1 | tai" status=completed exit=0\n  补丁 [\'calc.py\'] status=completed\n  审批 \'git push origin main\' 理由=\'推送修复\' → decline\n  命令 "/bin/bash -lc \'git push origin main\'" status=declined exit=None\n  消息 已修复 mean([]) 的除零错误，测试通过；推送被拒绝，留给人工处理。\n== 审计摘要 {\'message\': 2, \'command\': 3, \'patch\': 1, \'approval\': 1}','']]
S5=('在你的电脑上练习',RUNNOTE)
PRAC=[('剧本：测试 → 补丁 → 测试 → 越权推送。',heredoc('s_fix.py'),''),('可审计的修复流程。',heredoc('fixflow.py'),''),('准备有 bug 的仓库并运行。',heredoc('l24.sh')+'\ncd codex/scratch && bash l24.sh',None)]
CHAL=('跑到全绿为止','把 fixflow.py 改成：不发 <code>turn/start</code>，而是 <code>thread/goal/set</code>（objective=“让 python3 -m unittest 全部通过”），等待目标变为 complete 或 budgetLimited；剧本在测试通过后调用 <code>update_goal(complete)</code>。审计里还需要记录什么？',
'<p>流程：<code>tid = thread/start(...)</code> → <code>thread/goal/set {threadId, objective, origin:"user", tokenBudget:20000}</code> → 循环 <code>wait("thread/goal/updated")</code> 直到 status 不是 active（第 20 课的 l20.py）。剧本在看到 “OK” 的工具输出后返回 <code>call("update_goal", {"status": "complete"})</code>。审计中应额外记录每个 <code>turn/started</code>（它们没有用户输入、由 goal 触发）与每次 <code>thread/goal/updated</code> 的状态和 tokensUsed，这样复盘时能区分“人发起的回合”和“自动续跑的回合”，也能看出预算消耗。</p>')
QUIZ=[['git push 为什么会触发审批？',['申请了 require_escalated 越权','push 一定审批','钩子'],0,''],['审批里的 command 是？',['带 shell 包装的字符串','原始 argv','空'],0,''],['被拒绝的命令状态？',['declined','failed','completed'],0,''],['审计依赖？',['item/completed 通知与审批请求','解析日志文件','抓包'],0,''],['让流程自动跑到完成用？',['thread/goal/set','/plan','update_plan'],0,'']]
