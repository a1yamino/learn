# 剧本：启动一个等待输入的进程 → 用 write_stdin 交互 → 一条超长输出被截断
import re
def last_output(body):
    return [i for i in body["input"] if i["type"] == "function_call_output"][-1]["output"]
def reply(n, body):
    if n == 1:
        return [call("exec_command", {"cmd": "read -p '名字? ' x; echo 你好, $x", "tty": True, "yield_time_ms": 500}, "c1")]
    if n == 2:
        sid = int(re.search(r"session ID (\d+)", last_output(body)).group(1))
        return [call("write_stdin", {"session_id": sid, "chars": "codex\n", "yield_time_ms": 500}, "c2")]
    if n == 3:
        return [call("exec_command", {"cmd": "seq 1 100000", "max_output_tokens": 200}, "c3")]
    return [msg("完成")]
