#!/usr/bin/env python3
"""课程练习用的假 Responses API 服务器（离线，无需 API key）。
用法：python3 mock.py <剧本.py> <端口> <日志目录>
剧本里定义 reply(n, body) -> list[dict]：第 n 次请求（从 1 开始）要返回的输出项。
每次请求的完整 JSON 保存为 <日志目录>/reqNN.json，便于查看 Codex 实际发送了什么。"""
import json, sys, os, importlib.util, itertools
sys.dont_write_bytecode = True
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

spec = importlib.util.spec_from_file_location("script", sys.argv[1]); script = importlib.util.module_from_spec(spec); spec.loader.exec_module(script)
PORT, LOG = int(sys.argv[2]), sys.argv[3]; os.makedirs(LOG, exist_ok=True)
counter = itertools.count(1)

def msg(text):  # 便捷构造：助手文本消息
    return {"type": "message", "role": "assistant", "content": [{"type": "output_text", "text": text}]}
def call(name, args, cid=None):  # 便捷构造：函数调用
    return {"type": "function_call", "name": name, "arguments": json.dumps(args, ensure_ascii=False), "call_id": cid or f"call_{name}"}
script.msg, script.call = msg, call

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_GET(self):
        self.send_response(200); self.send_header("content-type", "application/json"); self.end_headers()
        self.wfile.write(b'{"object":"list","data":[],"models":[]}')
    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers.get("content-length", 0))) or b"{}")
        n = next(counter)
        json.dump({"path": self.path, "body": body}, open(f"{LOG}/req{n:02d}.json", "w"), ensure_ascii=False, indent=1)
        items = script.reply(n, body)
        self.send_response(200); self.send_header("content-type", "text/event-stream"); self.end_headers()
        def ev(d): self.wfile.write(f"event: {d['type']}\ndata: {json.dumps(d, ensure_ascii=False)}\n\n".encode())
        rid = f"resp_{n}"
        ev({"type": "response.created", "response": {"id": rid}})
        for i, it in enumerate(items):
            it = {"id": f"item_{n}_{i}", **it}
            if it["type"] == "message":
                ev({"type": "response.output_item.added", "output_index": i, "item": {**it, "content": []}})
                ev({"type": "response.output_text.delta", "output_index": i, "item_id": it["id"], "delta": it["content"][0]["text"]})
            ev({"type": "response.output_item.done", "output_index": i, "item": it})
        ev({"type": "response.completed", "response": {"id": rid, "usage": {"input_tokens": 1000 * n, "input_tokens_details": {"cached_tokens": 0},
            "output_tokens": 50, "output_tokens_details": {"reasoning_tokens": 0}, "total_tokens": 1000 * n + 50}}})

ThreadingHTTPServer(("127.0.0.1", PORT), H).serve_forever()
