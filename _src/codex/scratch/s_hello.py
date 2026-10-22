# 剧本：第 1 次请求让模型调用 exec_command，第 2 次给出最终回答
def reply(n, body):
    if n == 1:
        return [call("exec_command", {"cmd": "echo 你好，codex"})]
    return [msg("命令输出了：你好，codex")]
