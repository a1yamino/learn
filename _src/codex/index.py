import sys;sys.path.insert(0,'/workspace/coursekit');from idx import run
G=[('第一部分 · 全景',['Codex 全景：仓库地图与 crate 分层','一次 turn 的生命周期']),
('第二部分 · 与模型对话',['协议：Op、Event 与 ResponseItem','模型提供方与认证','模型客户端：SSE、WebSocket 与重试']),
('第三部分 · 循环与工具',['run_turn 循环','工具规格、路由与并行','会话线程、中断与转向','shell 与 unified exec','apply_patch：补丁格式与解析']),
('第四部分 · 安全边界',['沙箱：macOS Seatbelt','沙箱：Linux（bubblewrap 与 seccomp）','审批与执行策略']),
('第五部分 · 上下文与会话',['系统提示与 AGENTS.md','rollout：恢复与分叉','压缩与 /compact']),
('第六部分 · 扩展与交互',['MCP 客户端与服务端','斜杠命令','/plan 与 update_plan','/goal：长时间运行的目标','hooks、技能与插件','TUI 与配置','非交互与 app-server']),
('综合项目',['毕业项目：在 Codex 上搭一个可审计的修复流程'])]
run('codex','Codex CLI 源码精读',G,'：读 <a href="https://github.com/openai/codex/tree/c260087efe8cc6dcc0526e7018ae9e0e3fc134e3">openai/codex</a>（固定在提交 c260087）的 Rust 代码，看一个生产级编码 agent 如何在 <a href="../pi/index.html">pi</a> 的内核之上加入沙箱、审批、执行策略、计划与目标。每课对照 pi 的对应课程，并附带离线练习：用一个假的 Responses API 服务器驱动从源码构建的真实 codex。',int(sys.argv[1]) if len(sys.argv)>1 else 0)
