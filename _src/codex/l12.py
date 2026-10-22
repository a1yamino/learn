from common import *
TITLE='沙箱：Linux（bubblewrap 与 seccomp）';MIN=45;NEXT='审批与执行策略'
DESC='在 Linux 上，Codex 通过一个辅助程序 <code>codex-linux-sandbox</code> 运行命令：文件系统隔离交给 <b>bubblewrap</b>（只读绑定整个根目录，再把可写根重新以读写方式绑定；新的用户、PID、IPC 命名空间，按需断网），进程内再加上 <code>no_new_privs</code> 与 <b>seccomp</b> 过滤网络相关系统调用。旧的 Landlock 文件系统实现仍保留，但已是“legacy”模式。本课用 <code>codex sandbox</code> 直接在沙箱中运行命令，逐项验证这些限制。'
SUM=['<b>两层</b>（<code>linux-sandbox/src/lib.rs</code>）：进程内限制（no_new_privs + seccomp）与 bubblewrap 文件系统隔离。Landlock 只在 legacy 模式使用。',
'<b>bwrap 参数</b>（<code>bwrap.rs</code>）：<code>--new-session --die-with-parent</code>、文件系统参数（<code>--ro-bind / /</code> 加可写根的 <code>--bind</code>）、<code>--unshare-user</code>（即使以 root 运行也显式请求）、<code>--unshare-pid</code>、<code>--unshare-ipc</code>、按需 <code>--unshare-net</code>、新的 <code>/proc</code>。',
'<b>实验结果</b>：read-only 下可以读 /etc，不能写工作目录；workspace-write 下可写工作目录与 /tmp，不能写 $HOME，也不能改 <code>.git/config</code>（受保护的元数据，与 macOS 相同）；网络不可用；沙箱内只看得到 5 个进程（宿主有一百多个）。',
'<b>seccomp 网络过滤</b>（<code>seccomp.rs</code>）：禁止 connect 等调用，<code>socket</code>/<code>socketpair</code> 只允许 AF_UNIX；启用托管代理时只放行到代理的路由。',
'<b>错误信息</b>：被拒绝的写入表现为 “Read-only file system”——这正是 bind 挂载为只读的结果。unified exec 用 <code>is_likely_sandbox_denied</code> 识别这类失败，按策略决定是否询问用户以无沙箱重试（下一课）。',
'<b>codex sandbox</b>：调试用子命令，不经过模型直接在当前平台的沙箱中运行命令，可用 <code>-c sandbox_mode=…</code> 或 <code>-P</code> 权限配置文件选择策略。']
S1=('bwrap 视角下的文件系统','')
A1=[('只读根','--ro-bind / /：整个系统只读可见。',[('r','/ （只读）','',0,90,120)]),('可写根','--bind /work /work、/tmp：重新以读写方式挂载。',[('r','/ （只读）','',0,90,120),('w','/work（读写）','ok',160,40,130),('t','/tmp（读写）','ok',160,140,130)]),('保护','/work/.git 再次以只读挂回。',[('w','/work（读写）','ok',0,90,130),('g','/work/.git（只读）','bad',170,90,160)])]
S2=('动手：预测结果','')
CHI=[('read-only：touch a.txt','失败：Read-only file system','bad',''),('workspace-write：touch a.txt','成功','ok',''),('workspace-write：写 $HOME','失败','bad',''),('workspace-write：改 .git/config','失败（受保护元数据）','bad',''),('workspace-write：curl 外网','失败（网络隔离）','bad',''),('沙箱内 ps -e','只看到沙箱内几个进程','ok','--unshare-pid + 新 /proc。')]
CHH='选择一条命令。'
S3=('读代码','',X('codex-rs/linux-sandbox/src/lib.rs',[(1,5)])+'<p>bubblewrap 命名空间参数：</p>'+X('codex-rs/linux-sandbox/src/bwrap.rs',[(339,372)])+'<p>seccomp 的职责：</p>'+X('codex-rs/linux-sandbox/src/seccomp.rs',[(36,43)])+NOTE('<b>与 pi 对照</b>：pi 的 sandbox 示例扩展同样基于 bubblewrap，但只包裹 bash 工具且需手动启用（'+pi(19,'信任边界：pi 刻意不做什么')+'）。'))
S4=('真实输出','')
TERM=[['bash l12.sh','== workspace-write\n  workspace-write  touch a.txt          → 成功\n  workspace-write  echo x >> .git/config → 失败： line 1: .git/config: Read-only file system','']]
S5=('在你的电脑上练习','本课只需要 Linux 与第 1 课构建好的 codex（它自带 bubblewrap，也可使用系统的 bwrap）。<code>codex sandbox</code> 不调用模型。所有写入都发生在临时目录中。')
PRAC=[('沙箱实验。',heredoc('l12.sh')+'\ncd codex/scratch && bash l12.sh',None)]
CHAL=('允许网络','在 workspace-write 下让 curl 成功：查找配置项 <code>[sandbox_workspace_write] network_access</code>，用 <code>-c</code> 打开它再试。此时 bwrap 参数会有什么变化？',
'<pre style="white-space:pre-wrap">codex sandbox -c sandbox_mode=\'"workspace-write"\' -c sandbox_workspace_write.network_access=true -- curl -sS -m 5 https://example.com -o /dev/null &amp;&amp; echo ok</pre><p>打开 network_access 后网络沙箱策略变为启用，<code>should_unshare_network()</code> 为假，bwrap 不再加 <code>--unshare-net</code>，seccomp 也不再安装网络过滤；如果你的机器本身能访问外网，命令会输出 ok。</p>')
QUIZ=[['Linux 上文件系统隔离靠？',['bubblewrap','chroot','Docker'],0,''],['seccomp 在这里主要限制？',['网络相关系统调用','文件读取','CPU'],0,''],['写入被拒绝时的错误？',['Read-only file system','Permission denied by Codex','Segmentation fault'],0,''],['为什么沙箱里进程很少？',['--unshare-pid 与新 /proc','进程被杀','ps 被替换'],0,''],['Landlock 在当前实现中？',['只在 legacy 模式使用','默认使用','已删除'],0,'']]
