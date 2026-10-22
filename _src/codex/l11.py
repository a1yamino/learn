from common import *
TITLE='沙箱：macOS Seatbelt';MIN=40;NEXT='沙箱：Linux（bubblewrap 与 seccomp）'
DESC='pi 第 19 课的结论是：pi 不内置沙箱，安全来自容器或扩展。Codex 则把操作系统沙箱做进内核——模型发出的每条命令，默认都在沙箱中运行。在 macOS 上，它使用系统自带的 <code>/usr/bin/sandbox-exec</code>（Seatbelt），把一段 SBPL 策略与参数交给它。本课阅读这些策略：从 <code>(deny default)</code> 开始，逐项放开进程、sysctl、读文件，再按配置放开可写根目录与网络。'
SUM=['<b>只信任 /usr/bin/sandbox-exec</b>：不在 PATH 中查找，防止攻击者注入假的 sandbox-exec（<code>MACOS_PATH_TO_SEATBELT_EXECUTABLE</code>）。',
'<b>默认拒绝</b>：<code>seatbelt_base_policy.sbpl</code>（116 行，参考 Chrome 渲染进程策略）第一条就是 <code>(deny default)</code>，然后允许 fork/exec、同沙箱内的信号、必要的 sysctl、伪终端等。',
'<b>可写根目录参数化</b>：<code>build_seatbelt_access_policy</code> 为每个可写根生成 <code>(subpath (param "WRITABLE_ROOT_0"))</code>，实际路径通过 <code>-DWRITABLE_ROOT_0=/path</code> 传入，避免把路径拼进策略文本带来的转义问题。最终命令：<code>sandbox-exec -p &lt;策略&gt; -D… -- 命令</code>。',
'<b>可写根之下的保护</b>：即使在可写目录中，顶层的 <code>.git</code>、<code>.agents</code>、<code>.codex</code>、<code>.aws</code> 仍受保护（<code>PROTECTED_METADATA_PATH_NAMES</code>）；可写根目录本身也不能被删除替换（“authority boundary”）。',
'<b>网络</b>：默认不放开；启用网络时追加 <code>seatbelt_network_policy.sbpl</code>（system-socket、相关 mach-lookup 等），还可以配合 Codex 的网络代理做按域名控制。',
'<b>沙箱模式</b>：<code>read-only</code>（默认）、<code>workspace-write</code>（工作目录与临时目录可写）、<code>danger-full-access</code>（不加沙箱）。第 13 课把它们与审批策略结合起来。']
S1=('一条命令如何被包起来','')
A1=[('命令','模型要执行 touch notes.txt。',[('c','touch notes.txt','',0,90,140)]),('策略','(deny default) + 放开项 + (allow file-write* (subpath (param "WRITABLE_ROOT_0")))',[('p','SBPL 策略','sig',0,90,120),('d','-DWRITABLE_ROOT_0=/work','',160,90,200)]),('执行','/usr/bin/sandbox-exec -p … -D… -- touch notes.txt',[('s','sandbox-exec','ok',0,90,130),('c','touch','ok',170,90,90)])]
S2=('动手：workspace-write 下能否成功？','')
CHI=[('在工作目录写文件','允许','ok',''),('写 ~/.ssh/config','拒绝：不在可写根中','bad',''),('修改工作目录下的 .git/config','拒绝：受保护的元数据目录','bad',''),('curl 访问网络（未启用网络）','拒绝','bad',''),('读 /etc/hosts','允许：读权限默认较宽','ok','')]
CHH='选择一个操作。'
S3=('读代码','',X('codex-rs/sandboxing/src/seatbelt_base_policy.sbpl',[(1,16)])+'<p>为什么只用 /usr/bin 下的 sandbox-exec：</p>'+X('codex-rs/sandboxing/src/seatbelt.rs',[(58,62)])+'<p>可写根的参数化与防替换：</p>'+X('codex-rs/sandboxing/src/seatbelt.rs',[(516,527)])+'<p>组装命令行：</p>'+X('codex-rs/sandboxing/src/seatbelt.rs',[(1095,1104)])+'<p>受保护的元数据目录：</p>'+X('codex-rs/protocol/src/permissions.rs',[(40,51)])+NOTE('<b>与 pi 对照</b>：'+pi(19,'信任边界：pi 刻意不做什么')+'。pi 的 sandbox 示例扩展同样使用 sandbox-exec / bubblewrap，但需要用户主动加载；Codex 默认就开。'))
S4=('真实输出','')
TERM=[['bash l11.sh','== 基础策略的第一条规则\n(deny default)','']]
S5=('在你的电脑上练习','第一步在任何系统上都能运行（只读源码）；第二步需要 macOS。<code>codex sandbox</code> 在 macOS 上使用 Seatbelt，在 Linux 上使用 Linux 沙箱（下一课）。')
PRAC=[('阅读策略。',heredoc('l11.sh')+'\ncd codex/scratch && bash l11.sh',None),
('（仅 macOS）在 Seatbelt 中运行命令：工作目录可写，家目录不可写。','cd "$(mktemp -d)"\ncodex sandbox -c sandbox_mode=\'"workspace-write"\' -- touch ok.txt && ls\ncodex sandbox -c sandbox_mode=\'"workspace-write"\' -- touch ~/codex-sandbox-test.txt','（此步骤需要在 macOS 上运行；本课程的输出在 Linux 上生成，因此这里不显示。第一条应成功并列出 ok.txt，第二条应以 Operation not permitted 失败。）')]
CHAL=('找出放开网络的条件','在 <code>seatbelt.rs</code> 中查找 <code>MACOS_SEATBELT_NETWORK_POLICY</code> 被追加到策略的条件，并说明 <code>[sandbox_workspace_write] network_access = true</code> 如何影响它。',
'<p>用 <code>rg -n "NETWORK_POLICY|network_sandbox_policy" codex/codex-rs/sandboxing/src/seatbelt.rs</code> 查找。网络沙箱策略（NetworkSandboxPolicy）为启用时追加网络策略段；配置中的 <code>network_access</code> 正是决定 workspace-write 模式下该策略取值的开关。此外 Codex 还有托管网络代理（<code>network-proxy</code> crate），可按域名放行；它与沙箱策略的组合方式见 <code>dynamic_network_policy</code>。</p>')
QUIZ=[['Seatbelt 策略的第一条？',['(deny default)','(allow default)','(allow file-read*)'],0,''],['为什么只用 /usr/bin/sandbox-exec？',['防止 PATH 注入假程序','更快','唯一可用'],0,''],['可写路径如何传入？',['-DWRITABLE_ROOT_n=路径 参数','拼接在策略文本中','环境变量'],0,''],['可写目录下仍受保护的是？',['.git .agents .codex .aws','node_modules','所有隐藏文件'],0,''],['默认沙箱模式？',['read-only','workspace-write','danger-full-access'],0,'']]
