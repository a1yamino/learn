# 剧本：一次调用不存在的工具，一次参数错误，一次正常
def reply(n, body):
    if n == 1:
        return [call("no_such_tool", {}, "c1"),
                call("exec_command", {"command": "ls"}, "c2"),   # 参数名应为 cmd
                call("exec_command", {"cmd": "echo ok"}, "c3")]
    return [msg("完成")]
