from common import *
TITLE='系统提示与 AGENTS.md';MIN=40;NEXT='rollout：恢复与分叉'
DESC='pi 的系统提示由若干段落拼成，项目里的 AGENTS.md 会被加进去（第 12 课）。Codex 发给模型的“开场白”由四条消息组成：两条 <code>developer</code> 消息（模型的基础指令；开发者指令、技能说明、权限说明……）和两条 <code>user</code> 消息（AGENTS.md 指令与环境上下文；然后才是你的提示）。本课在一个有三层 AGENTS.md 的仓库子目录中运行 codex，拆开第一次请求逐条查看。'
SUM=['<b>基础指令</b>：来自模型元数据的 <code>model_messages.instructions_template</code>（gpt-5.5 以 “You are Codex, a coding agent based on GPT-5…” 开头，约 2 万字符）；本地未知模型回退到 <code>models-manager/prompt.md</code>。可用 <code>model_instructions_file</code> 替换。',
'<b>第二条 developer 消息</b>：<code>developer_instructions</code>（config.toml）、<code>&lt;skills_instructions&gt;</code>、<code>&lt;permissions instructions&gt;</code>（告诉模型当前沙箱与审批规则，以及如何请求提升）等。',
'<b>AGENTS.md 发现</b>（<code>core/src/agents_md.rs</code>）：向上找到项目根（默认标记 <code>.git</code>，可配 <code>project_root_markers</code>），从根到 cwd 收集每一层的 AGENTS.md（本地覆盖文件 <code>AGENTS.override.md</code> 优先），按顺序拼接；不越过项目根。',
'<b>全局与项目</b>：<code>$CODEX_HOME/AGENTS.md</code> 在前，用分隔符 <code>--- project-doc ---</code> 与项目文档相连，整体包在 <code>&lt;INSTRUCTIONS&gt;</code> 中，作为一条 user 消息发送，标题 “# AGENTS.md instructions for &lt;cwd&gt;”。',
'<b>大小上限</b>：<code>project_doc_max_bytes</code>，默认 32 KiB。',
'<b>环境上下文</b>：<code>&lt;environment_context&gt;</code> 包含 cwd、shell 等；当它们在会话中变化时，Codex 会发送差异更新（world state），而不是重写整个提示。']
S1=('开场的四条消息','')
A1=[('developer','基础指令（约 2 万字符）。',[('d1','developer：基础指令','sig',0,90,190)]),('developer','开发者指令 + 技能 + 权限说明。',[('d2','developer：指令/技能/权限','sig',0,90,230)]),('user','AGENTS.md（全局 → 根 → 子目录）+ 环境上下文。',[('u1','user：AGENTS.md','',0,40,160),('u2','user：environment_context','',0,140,230)]),('user','你的提示。',[('u3','user：你好','ok',0,90,110)])]
S2=('动手：会被包含吗？','cwd = repo/svc，repo 有 .git。')
CHI=[('$CODEX_HOME/AGENTS.md','包含，排在最前','ok',''),('repo/AGENTS.md','包含','ok',''),('repo/svc/AGENTS.md','包含，排在最后','ok',''),('repo 的父目录中的 AGENTS.md','不包含：不越过项目根','bad',''),('repo/other/AGENTS.md','不包含：不在根到 cwd 的路径上','bad','')]
CHH='选择一个文件。'
S3=('读代码','',X('codex-rs/core/src/agents_md.rs',[(1,18),(42,49)])+'<p>回退的基础指令：</p>'+X('codex-rs/models-manager/src/model_info.rs',[(16,16),(151,156)])+NOTE('<b>与 pi 对照</b>：'+pi(12,'系统提示、上下文文件与技能')+'。pi 把 AGENTS.md 放进系统提示；Codex 把它作为 user 消息发送，与基础指令分开。'))
S4=('真实输出','')
TERM=[['bash l14.sh','== 第 3 条 user：2 段，共 594 字符\n   · # AGENTS.md instructions for /tmp/…/svc\n       ↳ 全局规则：回答用中文。\n       ↳ 项目规则：测试用 pytest。\n       ↳ 子目录规则：svc 下禁止使用 print。','']]
S5=('在你的电脑上练习',RUNNOTE)
PRAC=[('一次性回答的剧本。',heredoc('s_once.py'),''),('三层 AGENTS.md。',heredoc('l14.sh')+'\ncd codex/scratch && bash l14.sh',None)]
CHAL=('本地覆盖','在 repo 根目录再放一个 <code>AGENTS.override.md</code>（内容“覆盖规则”）。重新运行，根目录这一层用的是哪个文件？',
'<p>同一目录中 <code>AGENTS.override.md</code> 优先于 <code>AGENTS.md</code>（LOCAL_AGENTS_MD_FILENAME 被称为 “Preferred local override”），因此根目录这一层变成“覆盖规则”，“项目规则”不再出现；全局与 svc 层不受影响。适合放不想提交到仓库的个人规则。</p>')
QUIZ=[['AGENTS.md 以什么角色发送？',['user','developer','system'],0,''],['项目根默认如何确定？',['向上找 .git','当前目录','家目录'],0,''],['全局与项目文档之间的分隔符？',['--- project-doc ---','###','<hr>'],0,''],['project_doc_max_bytes 默认？',['32 KiB','1 MiB','4 KiB'],0,''],['未知模型的基础指令来自？',['models-manager/prompt.md','AGENTS.md','空'],0,'']]
