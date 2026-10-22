# 剧本：第 1 次请求返回 HTTP 500；第 2 次流到一半断开；第 3 次正常
def reply(n, body):
    if n == 1: return {"http_status": 500, "message": "upstream overloaded"}
    if n == 2: return [msg("这段文字会被丢弃"), {"type": "__drop__"}]
    return [msg("第 3 次请求终于成功")]
