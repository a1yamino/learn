# 剧本：每个回合先调 update_plan；看到工具输出后，Plan 模式下给出 <proposed_plan>，否则普通回答
import json
def reply(n, body):
    dev = " ".join(c.get("text", "") for i in body["input"] if i.get("role") == "developer" for c in i["content"])
    plan_mode = "Plan Mode (Conversational)" in dev
    last = body["input"][-1]
    if last.get("type") != "function_call_output":
        return [call("update_plan", {"plan": [{"step": "读代码", "status": "completed"},
                                             {"step": "写测试", "status": "in_progress"}]}, f"p{n}")]
    print(f"[mock] req{n:02d} Plan 模式={plan_mode}  update_plan 的输出：{last['output'][:60]!r}", flush=True)
    if plan_mode:
        return [msg("<proposed_plan>\n1. 为 parse() 补测试\n2. 修复空输入\n</proposed_plan>")]
    return [msg("已更新清单")]
