# 剧本：四条命令，分别落在“沙箱内直接运行 / 请求提升权限 / 规则禁止 / 规则要求询问”
CMDS = [
    {"cmd": "touch inside.txt"},
    {"cmd": "touch $HOME/outside.txt", "sandbox_permissions": "require_escalated",
     "justification": "需要在家目录创建文件"},
    {"cmd": "git reset --hard"},
    {"cmd": "cp inside.txt copy.txt"},
]
def reply(n, body):
    if n <= len(CMDS): return [call("exec_command", CMDS[n - 1], f"c{n}")]
    return [msg("完成")]
