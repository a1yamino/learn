from common import *
L17='import { Text, TuiMainScreen } from "@earendil-works/pi-tui";\nimport { VirtualTerminal } from "../packages/tui/test/virtual-terminal.ts";\n\nconst term = new VirtualTerminal(40, 10);\nlet written = "";\nconst origWrite = term.write.bind(term);\nterm.write = (d: string) => { written += d; origWrite(d); };\n\nconst tui = new TuiMainScreen(term);\nconst header = new Text("pi 课程：TUI 演示");\nconst status = new Text("状态：思考中");\nconst body = new Text("第 1 行\\n第 2 行\\n第 3 行");\ntui.addChild(header); tui.addChild(body); tui.addChild(status);\ntui.start();\n\nconst show = (label: string) => {\n  const esc = written.replace(/\\x1b\\[\\?2026[hl]/g, (m) => (m.endsWith("h") ? "⟦同步开始⟧" : "⟦同步结束⟧")).replace(/\\x1b/g, "ESC").replace(/\\r\\n/g, "↵");\n  console.log(`== ${label}：写入 ${Buffer.byteLength(written)} 字节\\n   ${esc.slice(0, 150)}${esc.length > 150 ? "…" : ""}`);\n  written = "";\n};\n\ntui.renderNow(); show("首次渲染（全部输出）");\nstatus.setText("状态：调用工具 read"); tui.renderNow(); show("只改最后一行");\ntui.renderNow(); show("没有变化");\nheader.setText("pi 课程：TUI 演示（已更新）"); tui.renderNow(); show("改第一行（只重绘变化的区间）");\n\nawait new Promise((r) => setTimeout(r, 50));\nconsole.log("\\n屏幕内容：\\n" + (await term.flushAndGetViewport()).map((l: string) => "  |" + l.trimEnd()).filter((l: string) => l !== "  |").join("\\n"));\ntui.stop();\n'
TITLE='pi-tui：差分渲染的终端界面';MIN=45;NEXT='运行模式：交互、print/JSON、RPC 与 SDK'
DESC='pi 的交互界面不使用 React/Ink 之类的框架，而是自己的 <code>pi-tui</code> 包（约 2 万行）。它的核心思想非常朴素：每个组件把自己渲染成<b>字符串数组</b>（每个字符串一行），TUI 把所有组件的行拼起来，与上一帧逐行比较，只把变化的那段重新写到终端，并用“同步输出”转义序列包起来，避免闪烁。流式输出时每秒几十次重绘，靠的就是这一点。'
SUM=['<b>Component 接口</b>：<code>render(width): string[]</code>，可选 <code>handleInput</code>、<code>handleMouse</code>、<code>invalidate</code>。组件必须保证每行可见宽度不超过 width（超过会直接报错并写崩溃日志），工具函数 <code>visibleWidth</code>、<code>truncateToWidth</code> 处理 ANSI 与 CJK 宽字符。',
'<b>两种渲染器</b>：<code>TuiMainScreen</code>（主屏幕，输出进入终端回滚历史，pi 默认）与 <code>TuiAltScreen</code>（备用屏幕，应用自己管理滚动）。',
'<b>差分</b>：<code>doRender</code> 计算新行，与 <code>previousLines</code> 比较得到 firstChanged/lastChanged，把光标移到第一处变化，清除并重写<b>只在该区间内</b>的行。没有变化就什么也不写。',
'<b>何时整屏重绘</b>：首次渲染、终端宽度变化（换行方式变了）、高度变化、内容缩短到需要清屏、变化发生在视口之上（已滚出屏幕的部分无法原地修改）。',
'<b>同步输出</b>：每次写入都包在 <code>ESC[?2026h … ESC[?2026l</code>（CSI 2026）之间，支持的终端会原子地显示整帧。',
'<b>其余</b>：编辑器组件（多行、历史、kill ring、撤销、自动补全斜杠命令与路径）、Markdown 渲染、覆盖层（选择器、对话框）、Kitty/iTerm2 内联图片、括号粘贴模式。']
S1=('一帧是怎么画出来的','')
A1=[('render','每个组件返回行数组；拼接成新帧。',[('c1','Text','',0,40,100),('c2','Markdown','',0,90,100),('c3','Editor','',0,140,100),('f','新帧 lines[]','sig',160,90,140)]),
('diff','与上一帧逐行比较：只有第 5 行不同。',[('f','新帧','',160,90,140),('p','上一帧','',320,90,120),('d','first=last=5','sig',240,170,140)]),
('写入','移动光标到第 5 行，清除该行，写新内容；全部包在 CSI 2026 中。',[('o','ESC[?2026h … ESC[?2026l','ok',160,90,260)])]
S2=('动手：这次更新写入多少？','真实测量（见练习）。')
CHI=[('首次渲染','603 字节：所有行全部输出','sig',''),('只改最后一行（状态栏）','82 字节：ESC[1A 上移一行、ESC[2K 清行、写新内容','ok',''),
('什么都没变','0 字节','ok',''),('改第一行','85 字节：上移 8 行，只重写这一行','ok','只渲染 firstChanged..lastChanged，而不是到末尾。'),
('终端宽度从 80 变成 60','整屏重绘（清屏、清回滚、重新输出所有行）','bad','换行方式变了，旧内容无法复用。')]
CHH='选择一种更新。'
S3=('读代码','','''<p>组件接口：</p>'''+X('packages/tui/src/tui.ts',[(117,129)])+'''<p>整屏重绘的条件：</p>'''+X('packages/tui/src/tui-main-screen.ts',[(331,345)])+'''<p>找出变化区间：</p>'''+X('packages/tui/src/tui-main-screen.ts',[(363,383)])+'''<p>只重写变化的行：</p>'''+X('packages/tui/src/tui-main-screen.ts',[(478,492)])+NOTE('<b>与 Codex 对照</b>：Codex 的终端界面用 Rust 的 ratatui 构建（<code>codex-rs/tui</code>），同样有底部输入框、历史单元、审批弹窗与斜杠命令弹出层。见 '+codex(22,'TUI 与配置')+'。'))
S4=('真实输出','')
TERM=[['node scratch/l17.ts','== 只改最后一行：写入 82 字节\n   ⟦同步开始⟧ESC[1AESC[2K 状态：调用工具 read  …⟦同步结束⟧\n== 没有变化：写入 0 字节','']]
S5=('在你的电脑上练习','本课每个命令块都从第 1 课的 <code>pi-mono</code> 仓库根目录执行；若上一课停在 scratch，先回到仓库根目录。需要已完成依赖安装和构建，并已有 <code>scratch/</code>；下面运行脚本不改变当前 shell 的目录。用 pi-tui 测试中的 <code>VirtualTerminal</code>（基于 xterm.js 的无头终端）运行 TUI，记录每次渲染写入终端的字节。')
PRAC=[('写脚本并运行。','cat > scratch/l17.ts <<\'EOF\'\n'+L17+'EOF\nnode scratch/l17.ts',None)]
CHAL=('一个自定义组件','写一个 <code>ProgressBar</code> 组件：<code>render(width)</code> 返回一行 <code>[#####-----] 50%</code>，进度条长度随 width 变化且永远不超过 width。把它加进上面的 TUI，每 100ms 更新一次进度，观察每次写入的字节数。',
'<pre>class ProgressBar {\n  pct: number;\n  constructor(pct = 0) { this.pct = pct; }\n  invalidate() {}\n  render(width: number): string[] {\n    const pct = Math.min(100, Math.max(0, Math.round(this.pct)));\n    width = Math.max(0, Math.floor(width));\n    const label = ` ${pct}%`;\n    if (width &lt; label.length + 2) return [`${pct}%`.slice(0, width)];\n    const inner = Math.max(0, width - 2 - label.length);\n    const done = Math.round((inner * pct) / 100);\n    return [`[${"#".repeat(done)}${"-".repeat(inner - done)}]${label}`];\n  }\n}\nconst bar = new ProgressBar(); tui.addChild(bar);\nfor (let p = 0; p &lt;= 100; p += 10) { bar.pct = p; tui.renderNow(); show(`${p}%`); await new Promise((r) => setTimeout(r, 100)); }</pre><p>每次更新只有进度条那一行变化，写入几十字节；与全屏重绘（几百到几千字节）相比，在慢速 SSH 连接上差别非常明显。注意宽度计算使用字符数仅在纯 ASCII 时成立，含中文时应使用 <code>visibleWidth</code>。</p>')
QUIZ=[['组件的 render 返回？',['字符串数组，每项一行','虚拟 DOM','HTML'],0,''],
['只改了一行时 TUI 会？',['只重写变化区间内的行','整屏重绘','重写到末尾'],0,''],
['CSI 2026 的作用？',['同步输出，原子显示一帧','改变颜色','开启鼠标'],0,''],
['终端宽度变化时？',['整屏重绘','差分渲染','不处理'],0,''],
['一行超过终端宽度时？',['报错并写崩溃日志','自动截断','自动换行'],0,'']]
