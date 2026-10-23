from common import *
TITLE='TUI 与配置';MIN=40;NEXT='非交互与 app-server'
DESC='pi 自己写了一个差分渲染的终端库 pi-tui（第 17 课）；Codex 的 TUI 基于 ratatui，并在其上加了一层自己的终端封装（<code>tui/src/custom_terminal.rs</code>、<code>tui.rs</code>）。本课前半看终端层实际向终端发出了什么（来自第 18 课 <code>tui.py</code> 捕获的原始字节）；后半看配置：同一个键在多个<b>配置层</b>中出现时谁赢，项目配置为什么要先信任，以及新的 profile 文件写法。'
SUM=['<b>启动握手</b>（实测原始字节）：开启括号粘贴 <code>ESC[?2004h</code>、键盘增强 <code>ESC[&gt;7u</code>、焦点事件 <code>ESC[?1004h</code>；查询光标位置 <code>ESC[6n</code>、前景/背景色 <code>OSC 10/11 ?</code>（用于选择主题）、键盘协议 <code>ESC[?u</code>、设备属性 <code>ESC[c</code>。终端窗口大小为 0 时什么也不画——这是作者写 <code>tui.py</code> 时踩到的坑。',
'<b>画面</b>：进入备用屏幕 <code>ESC[?1049h</code>（<code>tui.rs</code> 中 <code>alt_screen_enabled</code> 可关闭），开启鼠标上报，每帧用同步更新 <code>ESC[?2026h … ESC[?2026l</code> 包裹，避免闪烁。',
'<b>配置层</b>（<code>config/src/config_layer_source.rs</code>）：PackagedDefaults、MDM、System、EnterpriseManaged、User（<code>$CODEX_HOME/config.toml</code>，可叠加 profile）、Project（<code>.codex/</code>）、SessionFlags（<code>-c</code> 与命令行参数）以及旧的托管配置。高优先级覆盖低优先级：实验中 -c &gt; 项目 &gt; 用户。',
'<b>项目层需要信任</b>：<code>.codex/config.toml</code> 只在项目 <code>trust_level = "trusted"</code> 时生效（实验 2 与 3 的差别）——仓库里的配置可以改模型、provider、沙箱，不能让克隆下来的仓库自动生效。',
'<b>profile 新写法</b>：<code>--profile fast</code> 读取 <code>$CODEX_HOME/fast.config.toml</code>；config.toml 中旧的 <code>[profiles.fast]</code> 表会让加载直接报错并给出迁移提示（<code>config/src/loader/mod.rs</code>）。',
'<b>特性开关</b>：<code>codex features list</code> 列出每个特性的阶段（under development / experimental / stable / removed）与是否开启；<code>--enable/--disable</code> 或 <code>[features]</code> 表修改。']
S1=('谁赢？','')
A1=[('用户层','config.toml：gpt-5.5。',[('u','User','sig',0,130,100)]),('项目层（已信任）','.codex/config.toml：proj-model。',[('u','User','',0,130,100),('p','Project','sig',0,80,100)]),('会话层','-c model=cli-model。',[('u','User','',0,130,100),('p','Project','',0,80,100),('s','SessionFlags','ok',0,30,120)])]
S2=('动手：请求中的 model 是？','用户层 gpt-5.5，项目层 proj-model。')
CHI=[('项目未信任','gpt-5.5：项目层被忽略','bad',''),('项目已信任','proj-model','ok',''),('已信任 + -c model=cli-model','cli-model','ok',''),('config.toml 中写了 [profiles.fast] 并用 --profile fast','报错：要求迁移到 fast.config.toml','bad','')]
CHH='选择一种组合。'
S3=('读代码','',X('codex-rs/config/src/config_layer_source.rs',[(4,28)])+X('codex-rs/config/src/loader/mod.rs',[(318,322)])+X('codex-rs/tui/src/tui.rs',[(679,690)])+NOTE('<b>与 pi 对照</b>：'+pi(17,'pi-tui：差分渲染的终端界面')+'。'))
S4=('真实输出','')
TERM=[['bash l22.sh','== 2. 项目层 .codex/config.toml（项目未被信任）\n   → 请求中的 model = gpt-5.5\n== 3. 同上，项目被信任\n   → 请求中的 model = proj-model\n== 4. 再加命令行 -c model=cli-model\n   → 请求中的 model = cli-model\n== 5. --profile fast：读取 $CODEX_HOME/fast.config.toml\n   → 请求中的 model = profile-model','']]
S5=('在你的电脑上练习',RUNNOTE)
PRAC=[('六个配置实验与特性列表。',heredoc('l22.sh')+'\ncd codex/scratch && bash l22.sh',None)]
CHAL=('profile 与 -c 谁赢','同时使用 <code>--profile fast</code>（fast.config.toml 中 model=profile-model）和 <code>-c model=cli-model</code>，请求里是哪个？用层次结构解释。',
'<p>是 cli-model。profile 只是叠加在 <b>User</b> 层上（<code>ConfigLayerSource::User { profile }</code>），而 <code>-c</code> 属于更高的 <b>SessionFlags</b> 层。在 l22.sh 最后加一行 <code>ask --profile fast -c model=cli-model</code> 即可验证。</p>')
QUIZ=[['项目 .codex/config.toml 何时生效？',['项目被信任时','总是','从不'],0,''],['-c 属于哪一层？',['SessionFlags','User','Project'],0,''],['新 profile 文件？',['$CODEX_HOME/名字.config.toml','[profiles.名字]','~/.profile'],0,''],['每帧的 ESC[?2026h 用途？',['同步更新防闪烁','清屏','开鼠标'],0,''],['OSC 10/11 查询用于？',['得到终端前景/背景色以选主题','查询大小','查询字体'],0,'']]
