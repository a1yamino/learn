# 剧本：压缩请求回一段摘要；普通请求：先调两次工具，再回答
import json
def reply(n, body):
    if "CONTEXT CHECKPOINT COMPACTION" in json.dumps(body, ensure_ascii=False):
        return [msg("摘要：用户要数文件；已执行 ls 与 echo；下一步给出结论。")]
    if "Another language model" in json.dumps(body, ensure_ascii=False):
        return [msg("根据摘要继续：完成，目录里没有文件")]
    outs = [i for i in body["input"] if i.get("type") == "function_call_output"]
    if len(outs) == 0: return [call("exec_command", {"cmd": "ls"}, "c1")]
    if len(outs) == 1: return [call("exec_command", {"cmd": "echo hi"}, "c2")]
    return [msg("完成：目录里没有文件")]
