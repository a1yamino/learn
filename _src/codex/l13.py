from common import *
TITLE='审批与执行策略';MIN=50;NEXT='系统提示与 AGENTS.md'
DESC='沙箱回答“命令能碰到什么”，审批回答“命令要不要先问人”。Codex 把三样东西组合起来：<b>沙箱模式</b>（read-only / workspace-write / danger-full-access）、<b>审批策略</b>（untrusted / on-request / granular / never），以及用户可写的<b>执行策略规则</b>（<code>~/.codex/rules/*.rules</code>，Starlark 语法的 <code>prefix_rule</code>）。本课用 app-server 扮演用户，在一个 turn 里观察四条命令分别走向：沙箱内直接运行、请求提升权限被拒、被规则禁止、被规则要求询问后批准。'
SUM=['<b>规则</b>（<code>execpolicy</code> crate）：<code>prefix_rule(pattern=[…], decision="allow"|"prompt"|"forbidden", justification=…)</code>，按命令前缀匹配；还可写 match/not_match 作为自测样例。<code>codex execpolicy check -r 文件 命令…</code> 单独检验。',
'<b>决策 → 要求</b>（<code>core/src/exec_policy.rs</code>）：Forbidden → 直接拒绝（附理由）；Prompt → 需要审批，但若审批策略不允许询问（如 never）就变成拒绝；Allow → 跳过审批，并且<b>只有当命令的每一段都被规则显式允许时才绕过沙箱</b>。',
'<b>没有规则匹配时</b>：交给审批策略与内置的安全命令启发式；on-request 下普通命令在沙箱中直接运行，模型可通过 <code>sandbox_permissions: "require_escalated"</code> + justification 主动请求无沙箱执行。',
'<b>编排器</b>（<code>tools/orchestrator.rs</code>）：审批（跳过 / 缓存 / 询问）→ 选择沙箱 → 运行 → 若被沙箱拒绝且策略允许，询问后以无沙箱重试。',
'<b>前端看到的审批</b>：app-server 发送服务器→客户端请求 <code>item/commandExecution/requestApproval</code>；客户端回答 accept、acceptForSession、acceptWithExecpolicyAmendment（记住为规则）、decline（继续 turn）或 cancel（同时中断 turn）。',
'<b>模型看到的结果</b>：被拒绝时工具输出 “exec_command failed: … Rejected("rejected by user")” 或规则给出的理由，turn 继续，由模型决定下一步。']
S1=('一条命令的审批路径','')
A1=[('规则','execpolicy：forbidden / prompt / allow / 无匹配。',[('c','命令','',0,90,80),('r','rules','sig',120,90,80)]),('审批','prompt 或 require_escalated → 询问用户。',[('r','rules','sig',0,90,80),('a','requestApproval','',120,90,160),('u','用户','ok',320,90,70)]),('沙箱','获准后在沙箱（或经批准的无沙箱）中运行。',[('s','sandbox','ok',0,90,90),('x','运行','ok',140,90,70)])]
S2=('动手：这条命令会怎样？','approval=on-request，sandbox=workspace-write，规则见练习。')
CHI=[('touch inside.txt','沙箱内直接运行','ok',''),('touch $HOME/x，require_escalated','询问用户；拒绝后模型收到 rejected by user','sig',''),('git reset --hard','规则 forbidden：不询问，直接拒绝','bad',''),('cp a b','规则 prompt：询问用户','sig',''),('ls（规则 allow）','跳过审批且绕过沙箱','ok','每一段都被 allow 规则匹配时才绕过沙箱。')]
CHH='选择一条命令。'
S3=('读代码','',X('codex-rs/execpolicy/src/decision.rs',[(7,16)])+'<p>决策变成审批要求：</p>'+X('codex-rs/core/src/exec_policy.rs',[(398,418),(445,458)])+'<p>审批策略：</p>'+X('codex-rs/protocol/src/protocol.rs',[(1097,1120)])+'<p>客户端的回答：</p>'+X('codex-rs/app-server-protocol/src/protocol/v2/item.rs',[(68,87)])+NOTE('<b>与 pi 对照</b>：pi 的 permission-gate 示例只是一个 tool_call 钩子（'+pi(15,'扩展系统：工具、命令与事件钩子')+'、'+pi(19,'信任边界：pi 刻意不做什么')+'）；Codex 把规则、审批、沙箱合成一条内置流水线。'))
S4=('真实输出','')
TERM=[['bash l13.sh','  ← 审批请求 item/commandExecution/requestApproval: /bin/bash -lc \'touch $HOME/outside.txt\'  理由=\'需要在家目录创建文件\'  → 我们回答 decline\n  命令 "/bin/bash -lc \'touch $HOME/outside.txt\'"    status=declined','']]
S5=('在你的电脑上练习',RUNNOTE+' 使用第 8 课的 <code>apc.py</code>。所有文件都在临时目录中；被拒绝的命令不会执行。')
PRAC=[('规则文件。',heredoc('rules.example'),''),('剧本：四条命令。',heredoc('s_approve.py'),''),('扮演用户的客户端与实验脚本。',heredoc('l13.py')+'\n'+heredoc('l13.sh')+'\ncd codex/scratch && bash l13.sh',None)]
CHAL=('记住这个决定','把客户端对 cp 的回答改为 <code>{"acceptWithExecpolicyAmendment": {"execpolicy_amendment": ["cp"]}}</code>，运行后查看 <code>$CODEX_HOME/rules/default.rules</code>，再用 <code>codex execpolicy check</code> 检查 <code>cp a b</code>。结果出乎意料吗？',
'<p>文件末尾被追加了一行 <code>prefix_rule(pattern=["cp"], decision="allow")</code>。但 check 的结果仍是 <code>"decision":"prompt"</code>：两条规则都匹配（prompt 与 allow），总决定取<b>最严格</b>的那个（Decision 枚举按 Allow &lt; Prompt &lt; Forbidden 排序）。所以“记住”只在没有更严格规则时生效——要真正放行，需要删掉我们手写的 prompt 规则。</p>')
QUIZ=[['规则 decision 有哪三种？',['allow / prompt / forbidden','yes / no / maybe','read / write / exec'],0,''],['approval=never 时遇到 prompt 规则？',['直接拒绝','询问','允许'],0,''],['allow 规则何时绕过沙箱？',['命令每一段都被 allow 规则匹配','总是','从不'],0,''],['decline 与 cancel 的区别？',['cancel 还会中断 turn','没有区别','decline 会中断'],0,''],['模型如何请求无沙箱执行？',['sandbox_permissions: require_escalated','sudo','改配置'],0,'']]
