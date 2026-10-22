# 剧本：第 1 次请求执行一条慢命令；之后的请求只回答文字
def reply(n, body):
    last_user = [i for i in body["input"] if i.get("role") == "user"][-1]["content"][0]["text"]
    if n == 1 or last_user == "第二个任务":
        return [call("exec_command", {"cmd": "sleep 2; echo 慢命令完成", "yield_time_ms": 10000}, f"slow{n}")]
    return [msg(f"收到（最后一条用户消息：{last_user}）")]
