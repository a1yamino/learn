# 剧本：先 echo，再 rm；把每次的工具输出报告出来
def reply(n, body):
    outs = [i["output"] for i in body["input"] if i.get("type") == "function_call_output"]
    if n > 1: print(f"[mock] 工具输出：{str(outs[-1])[:80]!r}", flush=True)
    if n == 1: return [call("exec_command", {"cmd": "echo hi"}, "c1")]
    if n == 2: return [call("exec_command", {"cmd": "rm -rf data"}, "c2")]
    return [msg("好的")]
