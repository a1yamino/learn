# 剧本：回显“模型看到了几条用户消息”，便于观察恢复/分叉后历史是否保留
def reply(n, body):
    users = [i["content"][0]["text"] for i in body["input"] if i.get("role") == "user"
             and not i["content"][0]["text"].startswith(("<", "#"))]
    return [msg(f"我看到的用户消息：{' / '.join(users)}")]
