from common import *
L9=open('/workspace/src/pi-mono/scratch/l09.ts').read()
TITLE='编码工具集：read、write、ls、grep、find';MIN=50;NEXT='edit 工具：精确替换、diff 与文件修改队列'
DESC='pi 默认只给模型四个工具：read、bash、edit、write；另有只读的 grep、find、ls 可按需启用。每个工具都是一个普通的 <code>ToolDefinition</code>：TypeBox 参数、写给模型看的描述、一个 <code>execute</code>。真正的工程细节在于<b>输出给模型的文字</b>：截断规则、“如何继续”的提示、错误信息——它们决定了模型能否高效地自己往下走。本课阅读 read、write、grep、find、ls 的实现并逐个调用它们。'
SUM=['<b>工具集</b>：<code>createCodingTools</code> = read、bash、edit、write（默认）；<code>createReadOnlyTools</code> = read、grep、find、ls；所有工具都可以指定 cwd，并可替换底层 <code>operations</code>（例如通过 SSH 操作远程机器）。',
'<b>read</b>：参数 path、offset（从 1 开始）、limit。文本输出最多 2000 行或 50KB；被截断时附上 <code>[Showing lines 1-2000 of 2500. Use offset=2001 to continue.]</code>；单行超过 50KB 时建议改用 bash 的 sed。图片作为附件返回，可自动缩放；当前模型不支持图片时会附注说明。',
'<b>write</b>：自动创建父目录；通过 <code>withFileMutationQueue</code> 对同一文件（按 realpath）的修改串行化，不同文件仍并行——并行工具执行（第 7 课）不会让两次写入交错。',
'<b>grep</b>：调用 ripgrep（<code>--json --hidden --no-config</code>），默认最多 100 条匹配，长行截断到 500 字符，结果附“如何获取更多”的提示。遵守 .gitignore（ripgrep 只在 git 仓库内应用 .gitignore）。',
'<b>find</b>：调用 fd 按 glob 查找，默认最多 1000 条。<b>ls</b>：列目录，目录名带 <code>/</code>，包含点文件。',
'<b>外部二进制</b>：<code>ensureTool("rg"|"fd")</code> 先找系统中的，找不到就下载到 <code>~/.pi/agent/bin</code>；离线模式下跳过下载。',
'<b>系统提示贡献</b>：每个工具都带 <code>promptSnippet</code> 与 <code>promptGuidelines</code>（如“Use read to examine files instead of cat or sed.”），被拼进系统提示的 tools 段（第 12 课）。']
S1=('read 的截断与续读','让模型能自己翻页。')
A1=[('第一次读取','read(big.txt)：2500 行，超过 2000 行上限。',[('f','big.txt 2500 行','sig',0,60,160)]),
('截断','返回 1–2000 行，并附上提示：Use offset=2001 to continue.',[('f','big.txt','',0,60,160),('o','1–2000 + 提示','ok',200,60,180)]),
('续读','模型按提示调用 read(offset=2001)。',[('o','read(offset=2001)','sig',200,60,180),('r','2001–2500','ok',420,60,140)])]
S2=('动手：这次调用返回什么？','')
CHI=[('read(big.txt)，2500 行','line 1 … line 2000\n\n[Showing lines 1-2000 of 2500. Use offset=2001 to continue.]','ok',''),
('read(big.txt, offset=10, limit=3)','line 10\nline 11\nline 12\n\n[2488 more lines in file. Use offset=13 to continue.]','ok',''),
('read(nope.txt)','抛出 ENOENT → 循环把它转成 isError 结果','bad',''),
('write("src/util/math.ts", …)','父目录自动创建\nSuccessfully wrote to src/util/math.ts','ok',''),
('grep("add")，非 git 目录','build/out.js 也出现在结果中——.gitignore 只在 git 仓库内生效','sig','git init 之后 build/ 被忽略。')]
CHH='选择一次调用。'
S3=('读代码','','''<p>read 的参数与截断逻辑：</p>'''+X('packages/coding-agent/src/core/tools/read.ts',[(14,18),(176,203)])+'''<p>限制常量：</p>'''+X('packages/coding-agent/src/core/tools/truncate.ts',[(11,13)])+'''<p>write：在文件修改队列中创建目录并写入：</p>'''+X('packages/coding-agent/src/core/tools/write.ts',[(65,89)])+'''<p>同一文件的修改串行化：</p>'''+X('packages/coding-agent/src/core/tools/file-mutation-queue.ts',[(28,61)])+'''<p>grep 调用 ripgrep 的参数：</p>'''+X('packages/coding-agent/src/core/tools/grep.ts',[(162,170)])+NOTE('<b>与 Codex 对照</b>：Codex 没有独立的 read/grep/find 工具，而是让模型通过 shell 运行 <code>cat</code>、<code>rg</code> 等命令，由沙箱保证安全；文件修改统一走 <code>apply_patch</code>。见 '+codex(9,'shell 与 unified exec')+'。'))
S4=('真实输出','')
TERM=[['node l09.ts','> ls({"path":"."})\n  .gitignore\n  big.txt\n  build/\n  src/\n> find({"pattern":"**/*.ts"})\n  src/util/math.ts','ls 包含点文件，目录带斜杠。']]
S5=('在你的电脑上练习','直接创建工具并调用 <code>execute</code>，观察模型实际看到的文字。首次运行 find 时若系统没有 fd，pi 会把它下载到 <code>~/.pi/agent/bin</code>。')
PRAC=[('写脚本并运行。','cat > pi-mono/scratch/l09.ts <<\'EOF\'\n'+L9+'EOF\ncd pi-mono/scratch && node l09.ts 2>&1 | sed -E "s#/tmp/l09-[A-Za-z0-9]+#/tmp/l09-XXXX#"',None)]
CHAL=('远程 read','<code>ReadOperations</code> 允许替换底层文件访问。实现一个“内存文件系统”版本的 read 工具：<code>readFile</code> 从一个 <code>Map&lt;string,string&gt;</code> 返回内容，<code>access</code> 在不存在时抛错。验证截断提示仍然生效。',
'<pre>const files = new Map([["/virt/a.txt", Array.from({length: 3000}, (_, i) => `x${i}`).join("\\n")]]);\nconst memRead = createReadTool("/virt", { operations: {\n  readFile: async (p) => Buffer.from(files.get(p)!),\n  access: async (p) => { if (!files.has(p)) throw new Error(`ENOENT: ${p}`); },\n  detectImageMimeType: async () => null,\n}});\nconst r = await memRead.execute("1", { path: "a.txt" });\n// …\n// [Showing lines 1-2000 of 3000. Use offset=2001 to continue.]</pre><p>截断、续读提示、offset/limit 都在 operations 之上实现，所以换了存储也照常工作。pi 正是用这种方式让同一套工具在 SSH、容器等环境中运行（见 <code>docs/containerization.md</code>）。</p>')
QUIZ=[['read 文本输出的上限？',['2000 行或 50KB，先到为准','100 行','无限制'],0,''],
['被截断时 read 会？',['附上 Use offset=N to continue 提示','静默截断','报错'],0,''],
['两个并行的 write 写同一文件？',['文件修改队列使其串行','交错写入','第二个失败'],0,''],
['grep 底层使用？',['ripgrep','grep','JS 正则遍历'],0,''],
['默认启用的工具是？',['read、bash、edit、write','全部 8 个','read、grep、find、ls'],0,'']]
