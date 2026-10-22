from common import *
L12='import { fauxAssistantMessage } from "@earendil-works/pi-ai/compat";\nimport { fauxSession } from "./faux-session.ts";\n\nconst { session, faux } = await fauxSession([fauxAssistantMessage("好的")], {\n  files: {\n    "AGENTS.md": "# 项目约定\\n- 用 pnpm，不要用 npm\\n- 测试命令：pnpm test\\n",\n    ".pi-agent/AGENTS.md": "全局：回答使用中文。\\n",\n    ".pi/skills/pdf-tools/SKILL.md": "---\\nname: pdf-tools\\ndescription: 从 PDF 中提取文本与表格。处理 PDF 文件时使用。\\n---\\n# PDF 工具\\n运行 scripts/extract.py <文件>\\n",\n  },\n});\nawait session.prompt("/skill:pdf-tools 提取 report.pdf 第 3 页");\nconst sys = session.messages[0] as any;\nconsole.log("sections:", Object.keys(sys.sections).join(", "));\nfor (const name of ["project_context", "skills"]) console.log(`\\n---- ${name} ----\\n` + (sys.sections[name] ?? "(无)").replace(session.sessionManager.getCwd(), "<cwd>").replaceAll(session.sessionManager.getCwd(), "<cwd>"));\n\nconst u = session.messages.find((m) => m.role === "user") as any;\nconsole.log("\\n---- /skill 展开后的用户消息 ----\\n" + u.content.map((c: any) => c.text).join("").replaceAll(session.sessionManager.getCwd(), "<cwd>"));\nsession.dispose();\n\n// 不信任项目目录时：项目的 .pi/skills 不会被加载（AGENTS.md 仍然加载）\nconst { SettingsManager } = await import("@earendil-works/pi-coding-agent");\nconst s2 = await fauxSession([fauxAssistantMessage("好的")], {\n  files: { "AGENTS.md": "x", ".pi/skills/pdf-tools/SKILL.md": "---\\nname: pdf-tools\\ndescription: d\\n---\\n" },\n  extra: { settingsManager: SettingsManager.inMemory({}, { projectTrusted: false }) },\n});\nawait s2.session.prompt("hi");\nconst sys2 = s2.session.messages[0] as any;\nconsole.log("\\n不信任项目时 sections:", Object.keys(sys2.sections).join(", "));\ns2.session.dispose();\n'
TITLE='系统提示、上下文文件与技能';MIN=50;NEXT='会话：JSONL 树、分支与恢复'
DESC='模型对你的项目一无所知，它知道的一切都来自上下文。pi 的系统提示由 <code>core/system-prompt.ts</code> 拼装成若干<b>命名段落</b>：preamble、tools、rules、docs、addendum、project_context、skills、cwd。本课阅读它的构造方式，看 AGENTS.md 如何从全局目录和祖先目录逐级收集，以及“技能”如何做到<b>渐进披露</b>：系统提示里只放名字和描述，完整说明在需要时才被读取。'
SUM=['<b>分段的系统提示</b>：<code>buildSystemPromptSections</code> 返回有序的段落；除 preamble 外每段都用同名标签包裹（如 <code>&lt;rules&gt;…&lt;/rules&gt;</code>），这样后续的 system 消息可以按名字替换某一段（第 3 课的 sections 机制），模型也能把更新对应到原文。',
'<b>tools 与 rules</b>：tools 段列出每个工具的 <code>promptSnippet</code>；rules 段合并各工具的 <code>promptGuidelines</code>、扩展提供的规则，以及固定的“Be concise…”等，去重。只有 bash 而没有 grep/find/ls 时，会加上“Use bash for file operations like ls, rg, find”。',
'<b>替换与追加</b>：<code>.pi/SYSTEM.md</code> 或全局 <code>SYSTEM.md</code> 替换默认的 preamble、tools、rules、docs 四段（project_context、skills、cwd 仍然保留）；<code>APPEND_SYSTEM.md</code> 作为 addendum 追加。扩展可以强制给出完整的系统提示。',
'<b>上下文文件</b>：先加载全局目录（<code>~/.pi/agent</code>）中的，再从 cwd 一直向上到根目录，每个目录取第一个存在的 <code>AGENTS.override.md / AGENTS.md / CLAUDE.md</code>，越靠近根的越靠前。每个文件包在 <code>&lt;project_instructions path=…&gt;</code> 中。处理了 git worktree 嵌套时的重复。',
'<b>技能</b>：遵循 Agent Skills 规范的 <code>SKILL.md</code>（frontmatter 必须有 name 与 description）。系统提示只列出 name、description、location，并告诉模型“任务匹配时用 read 加载”。来源：全局与项目的 <code>skills/</code>、<code>~/.agents/skills</code> 与项目祖先目录的 <code>.agents/skills</code>、pi 包。<code>disable-model-invocation: true</code> 的技能不出现在提示中，用户可显式调用；这不是访问控制。',
'<b>/skill:name</b>：用户显式调用时，AgentSession 读取 SKILL.md 正文，包装成 <code>&lt;skill name location&gt;References are relative to …</code> 块放进用户消息。',
'<b>信任</b>：项目目录中的 <code>.pi/</code> 资源（技能、扩展、设置、SYSTEM.md）只在项目被信任时加载；交互模式首次进入一个项目时会询问。SDK 默认信任。']
S1=('系统提示的组装','')
A1=[('preamble','默认的身份描述，或 SYSTEM.md 的内容。',[('p','preamble','sig',0,40,160)]),
('tools / rules / docs','工具片段、规则、pi 文档位置。',[('p','preamble','',0,40,160),('t','&lt;tools&gt; &lt;rules&gt; &lt;docs&gt;','sig',0,90,220)]),
('project_context','全局 AGENTS.md，然后从根到 cwd 的各级 AGENTS.md。',[('t','&lt;tools&gt; &lt;rules&gt; &lt;docs&gt;','',0,90,220),('c','&lt;project_context&gt;','sig',0,140,220)]),
('skills','只有名字、描述、位置。',[('c','&lt;project_context&gt;','',0,140,220),('s','&lt;skills&gt;','sig',0,190,220)]),
('cwd','最后是工作目录。全部段落成为转录中第一条 system 消息的 sections。',[('s','&lt;skills&gt;','',0,190,220),('w','&lt;cwd&gt;','ok',0,240,220)])]
S2=('动手：这个文件会进入上下文吗？','')
CHI=[('~/.pi/agent/AGENTS.md','会，排在最前（全局）。','ok',''),
('/home/me/AGENTS.md，cwd 是 /home/me/proj/app','会：从 cwd 向上的每一级都检查。','ok',''),
('同一目录既有 AGENTS.md 又有 CLAUDE.md','只取第一个存在的：AGENTS.override.md → AGENTS.md → AGENTS.MD → CLAUDE.md → CLAUDE.MD','sig',''),
('.pi/skills/x/SKILL.md，项目未被信任','不会。AGENTS.md 仍然加载。','bad',''),
('SKILL.md 带 disable-model-invocation: true','不出现在系统提示中；用户可 /skill:name 显式调用；不是访问控制','sig','')]
CHH='选择一个文件。'
S3=('读代码','','''<p>分段构造：</p>'''+X('packages/coding-agent/src/core/system-prompt.ts',[(150,161),(172,192)])+'''<p>收集上下文文件：</p>'''+X('packages/coding-agent/src/core/resource-loader.ts',[(184,186),(233,272)])+'''<p>技能在提示中的形式：</p>'''+X('packages/coding-agent/src/core/skills.ts',[(358,388)])+'''<p>/skill 的展开：</p>'''+X('packages/coding-agent/src/core/agent-session.ts',[(2211,2225)])+NOTE('<b>与 Codex 对照</b>：Codex 同样读取 AGENTS.md（从仓库根到 cwd 逐级合并），并有自己的基础指令文件与技能机制；它还在系统层面注入沙箱与审批策略的说明，让模型知道哪些操作会被拦截。见 '+codex(14,'系统提示与 AGENTS.md')+' 与 '+codex(21,'hooks、技能与插件')+'。'))
S4=('真实输出','')
TERM=[['HOME=$(mktemp -d) node scratch/l12.ts','sections: preamble, tools, rules, docs, project_context, skills, cwd\n…\n不信任项目时 sections: preamble, tools, rules, docs, project_context, cwd','不信任时 skills 段消失。']]
S5=('在你的电脑上练习','本课每个命令块都从第 1 课的 <code>pi-mono</code> 仓库根目录执行；若上一课停在 scratch，先回到仓库根目录。需要已完成依赖安装和构建，并已有 <code>scratch/</code>；下面运行脚本不改变当前 shell 的目录。在临时项目中放置全局与项目 AGENTS.md、一个项目技能，查看生成的段落。把 HOME 指向空目录，避免你自己 <code>~/.agents/skills</code> 中的技能混入输出。')
PRAC=[('写脚本并运行。','cat > scratch/l12.ts <<\'EOF\'\n'+L12+'EOF\nHOME=$(mktemp -d) node scratch/l12.ts',None)]
CHAL=('估算上下文成本','一个项目有 40 个技能，平均描述 300 字符。①它们在每次请求中大约占多少 token（按 4 字符/token 粗算，加上标签）？②为什么 pi 不把技能正文直接放进系统提示？③如果你有一个只想手动触发的危险技能（例如“发布到生产”），应该怎么配置？',
'<p>① 每个技能的 name+description+location+标签约 450–500 字符 → 约 120 token；40 个约 5000 token，每次请求都要付出（提示缓存可以降低成本但不能降低占用）。</p><p>② 渐进披露：正文可能有数千 token，且大多数任务用不上；只放描述，让模型在需要时用 read 加载，成本只在使用时发生。这也是描述必须写清楚“何时使用”的原因。</p><p>③ 在 frontmatter 中设置 <code>disable-model-invocation: true</code>：它不会出现在系统提示里，这只影响技能目录的可见性，用户仍可用 <code>/skill:deploy-prod</code> 显式展开；模型若通过其他途径获得路径，仍可能读取正文或执行其中命令。危险操作还需要独立授权与隔离，不能把这个标记当权限控制。</p>')
QUIZ=[['系统提示段落为什么用标签包裹？',['后续 system 消息可按名字替换，模型能对应更新','为了美观','API 要求'],0,''],
['上下文文件的顺序？',['全局在前，然后从根目录到 cwd','cwd 在前','字母序'],0,''],
['系统提示中的技能包含？',['名字、描述、位置','完整正文','只有名字'],0,''],
[".pi/SYSTEM.md 的作用？",["替换默认的 preamble/tools/rules/docs",'追加到末尾','被忽略'],0,''],
['项目未被信任时？',['不加载 .pi/ 下的技能、扩展等','什么都不加载','照常加载'],0,'']]
