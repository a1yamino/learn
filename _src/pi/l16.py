from common import *
L16='import { readFileSync } from "node:fs";\nimport { fauxAssistantMessage } from "@earendil-works/pi-ai/compat";\nimport { fauxSession } from "./faux-session.ts";\n\nconst ex = "packages/coding-agent/examples/extensions/plan-mode";\nconst { session } = await fauxSession(Array.from({ length: 6 }, () => fauxAssistantMessage("ok")), {\n  files: {\n    ".pi/prompts/review.md": "---\\ndescription: 审查改动\\nargument-hint: \\"[重点]\\"\\n---\\n审查暂存区的改动，重点关注 ${1:-正确性与安全}。其余参数：${@:2}\\n",\n    ".pi/prompts/fix.md": "修复 issue #$1：$ARGUMENTS\\n",\n    // 官方示例扩展：/plan 只读计划模式\n    ".pi/extensions/plan-mode/index.ts": readFileSync(`${ex}/index.ts`, "utf8"),\n    ".pi/extensions/plan-mode/utils.ts": readFileSync(`${ex}/utils.ts`, "utf8"),\n  },\n});\n\nconst lastUser = () => { const u = session.messages.filter((m) => m.role === "user").at(-1) as any; return u.content.map((c: any) => c.text).join(""); };\nfor (const input of ["/review", "/review 并发 \\"API 兼容性\\" 性能", "/fix 42 登录 超时", "/unknown 你好"]) {\n  await session.prompt(input);\n  console.log(`${input}\\n   → ${lastUser().trim()}`);\n}\n\nconsole.log("\\n/plan 之前的活动工具:", session.agent.state.tools.map((t) => t.name).join(", "));\nawait session.prompt("/plan");\nconsole.log("/plan 之后的活动工具:", session.agent.state.tools.map((t) => t.name).join(", "));\nsession.dispose();\n'
TITLE='斜杠命令与提示模板';MIN=45;NEXT='pi-tui：差分渲染的终端界面'
DESC='在 pi 的编辑器里输入 <code>/</code>，会出现四类命令：<b>内置命令</b>（/model、/tree、/compact……，由交互界面处理）、<b>扩展命令</b>、<b>技能</b>（/skill:name）和<b>提示模板</b>（Markdown 文件）。它们在不同的层被处理，顺序决定了谁能覆盖谁。本课还会加载 pi 官方示例中的 <code>plan-mode</code> 扩展：在 pi 里，“计划模式”不是内置功能，而是一个用工具切换实现的扩展。'
SUM=['<b>内置命令</b>：定义在 <code>core/slash-commands.ts</code>（settings、model、tree、fork、clone、compact、resume、new、reload、login、export、share、trust……），由 <code>interactive-mode.ts</code> 的编辑器提交处理器逐一匹配。它们属于 UI 层，print/RPC 模式有各自的对应方式。',
'<b>未被界面处理的输入</b>进入 <code>AgentSession.prompt</code>：扩展命令 → input 事件 → <code>/skill:</code> 展开 → 提示模板展开（第 2 课的顺序）。不认识的 <code>/xxx</code> 原样作为文本发给模型。',
'<b>提示模板</b>：<code>~/.pi/agent/prompts/*.md</code> 或项目 <code>.pi/prompts/*.md</code>，文件名就是命令名；frontmatter 可写 description、argument-hint。参数按类 shell 规则解析（引号内的空格保留）。',
'<b>占位符</b>：<code>$1</code>、<code>$2</code>…；<code>$@</code> / <code>$ARGUMENTS</code>（全部参数）；<code>${1:-默认}</code>；<code>${@:N}</code>、<code>${@:N:L}</code>（切片）。替换只做一层，参数中的 <code>$1</code> 不会被再次替换。',
'<b>模板 vs 技能 vs 扩展命令</b>：模板只是可复用的文字；技能是带资源文件、可被模型自主选用的说明书；扩展命令执行代码。',
'<b>计划模式是扩展</b>：示例 <code>plan-mode</code> 注册 <code>/plan</code> 命令和 <code>--plan</code> 标志，用 <code>setActiveTools</code> 去掉 edit/write、加入 grep/find/ls，并通过 tool_call 钩子用正则筛选看似只读的 bash 命令；这不是完整 shell 解析或安全边界，例如固定版本的 isSafeCommand("find . -delete") 仍返回 true（仅演示判断，不要实际执行删除）。计划中的步骤从 “Plan:” 段落提取，执行时用 <code>[DONE:n]</code> 标记进度。']
S1=('一条 / 输入的去向','')
A1=[('编辑器','用户输入 /review 并发。',[('e','/review 并发','sig',0,60,140)]),
('界面层','是内置命令吗？（/model、/compact…）不是。',[('e','/review 并发','',0,60,140),('ui','interactive-mode','sig',180,60,160)]),
('会话层','扩展命令？没有。input 事件。/skill:？不是。',[('ui','interactive-mode','',180,60,160),('s','AgentSession.prompt','sig',380,60,180)]),
('模板','找到 review.md：参数 ["并发"]，替换 ${1:-…}。',[('s','AgentSession.prompt','',380,60,180),('t','review.md','ok',380,140,180)]),
('发给模型','展开后的文本作为 user 消息。',[('t','审查暂存区的改动，重点关注 并发。','ok',200,140,360)])]
S2=('动手：这些输入展开成什么？','模板 review.md：<code>审查暂存区的改动，重点关注 ${1:-正确性与安全}。其余参数：${@:2}</code>；fix.md：<code>修复 issue #$1：$ARGUMENTS</code>')
CHI=[('/review','审查暂存区的改动，重点关注 正确性与安全。其余参数：','ok','使用默认值。'),
('/review 并发 "API 兼容性" 性能','审查暂存区的改动，重点关注 并发。其余参数：API 兼容性 性能','ok','引号内的空格属于同一个参数。'),
('/fix 42 登录 超时','修复 issue #42：42 登录 超时','sig','$ARGUMENTS 包含所有参数，也包括 $1。'),
('/unknown 你好','/unknown 你好（原样发给模型）','sig',''),
('/plan（加载 plan-mode 扩展后）','活动工具：read, bash, edit, write → read, bash, grep, find, ls','ok','扩展命令，不发消息给模型。')]
CHH='选择一个输入。'
S3=('读代码','','''<p>参数替换：</p>'''+X('packages/coding-agent/src/core/prompt-templates.ts',[(76,108)])+'''<p>模板展开：</p>'''+X('packages/coding-agent/src/core/prompt-templates.ts',[(309,325)])+'''<p>内置命令在界面层处理（节选）：</p>'''+X('packages/coding-agent/src/modes/interactive/interactive-mode.ts',[(3156,3160),(3261,3270)])+'''<p>示例扩展 plan-mode 的工具切换：</p>'''+X('packages/coding-agent/examples/extensions/plan-mode/index.ts',[(21,25),(90,95)])+NOTE('<b>与 Codex 对照</b>：Codex 的斜杠命令是一个 Rust 枚举（<code>SlashCommand</code>），/plan、/goal、/compact、/review 等都是<b>内置</b>功能，深度集成到协议与核心中。pi 选择把这些留给扩展。见 '+codex(18,'斜杠命令')+'、'+codex(19,'/plan 与 update_plan')+'。'))
S4=('真实输出','')
TERM=[['node scratch/l16.ts','/review 并发 "API 兼容性" 性能\n   → 审查暂存区的改动，重点关注 并发。其余参数：API 兼容性 性能\n…\n/plan 之前的活动工具: read, bash, edit, write\n/plan 之后的活动工具: read, bash, grep, find, ls','']]
S5=('在你的电脑上练习','本课每个命令块都从第 1 课的 <code>pi-mono</code> 仓库根目录执行；若上一课停在 scratch，先回到仓库根目录。需要已完成依赖安装和构建，并已有 <code>scratch/</code>；下面运行脚本不改变当前 shell 的目录。两个模板 + 官方 plan-mode 示例扩展（直接从 pi-mono 复制到临时项目）。')
PRAC=[('写脚本并运行。','cat > scratch/l16.ts <<\'EOF\'\n'+L16+'EOF\nnode scratch/l16.ts',None),
('看看 plan-mode 允许哪些 bash 命令：','grep -n -A12 "SAFE_PATTERNS = " packages/coding-agent/examples/extensions/plan-mode/utils.ts | head -16',None)]
CHAL=('写一个 /commit 模板','写 <code>.pi/prompts/commit.md</code>：让模型查看 <code>git diff --staged</code>，按 Conventional Commits 写提交信息；第一个参数是类型（默认 feat），其余参数是额外说明。然后回答：如果同时存在名为 commit 的扩展命令，<code>/commit</code> 会执行哪个？',
'<pre>---\ndescription: 根据暂存区生成提交信息并提交\nargument-hint: "[type] [说明…]"\n---\n运行 git diff --staged 查看改动，然后用 Conventional Commits 格式写提交信息并执行 git commit。\n类型：${1:-feat}\n额外说明：${@:2}</pre><p>扩展命令优先：<code>AgentSession.prompt</code> 首先尝试执行扩展命令（找到就直接执行并返回），模板展开在最后一步，根本不会被到达。内置命令更早——在界面层就被拦截，所以扩展也无法用同名覆盖 /model 之类的内置命令。</p>')
QUIZ=[['/compact 在哪一层被处理？',['交互界面层','AgentSession.prompt','模型'],0,''],
['模板文件 deploy.md 对应的命令？',['/deploy','/template:deploy','/prompt deploy'],0,''],
['${1:-x} 在没有参数时？',['x','空','$1'],0,''],
['同名的扩展命令与模板？',['扩展命令优先','模板优先','报错'],0,''],
['pi 的 /plan 来自？',['示例扩展 plan-mode','内置命令','模型'],0,'']]
