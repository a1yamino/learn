# 剧本：每次被“继续目标”提示唤醒就做一步；第 3 步完成后调用 update_goal(complete)
import json
step = 0
def reply(n, body):
    global step
    last = body["input"][-1]
    if last.get("type") == "function_call_output":
        return [msg(f"第 {step} 步完成")] if step < 3 else [msg("目标达成，已标记 complete")]
    texts = [c.get("text", "") for i in body["input"] if i.get("type") == "message" for c in i["content"]]
    cont = sum("Continue working toward the active thread goal" in t for t in texts)
    step += 1
    print(f"[mock] req{n:02d} 历史中的继续提示 {cont} 条 → 第 {step} 步", flush=True)
    if step < 3: return [call("exec_command", {"cmd": f"echo step{step} >> log.txt"}, f"s{step}")]
    return [call("update_goal", {"status": "complete"}, "done")]
