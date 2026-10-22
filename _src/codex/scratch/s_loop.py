# 剧本：用环境变量 SCEN 选择场景
import os
S = os.environ.get("SCEN", "a")
def reply(n, body):
    if S == "a":  # 只回答文字：1 次请求就结束
        return [msg("直接回答，不用工具")]
    if S == "b":  # 文字 + 工具调用在同一个响应里：仍需继续
        if n == 1: return [msg("我先看看目录"), call("exec_command", {"cmd": "ls"}, "c1")]
        return [msg("看完了")]
    if S == "c":  # 一个响应里两个工具调用
        if n == 1: return [call("exec_command", {"cmd": "echo A"}, "c1"), call("exec_command", {"cmd": "echo B"}, "c2")]
        return [msg("两个都执行了")]
