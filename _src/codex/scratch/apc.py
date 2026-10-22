#!/usr/bin/env python3
"""apc.py：极简 app-server 客户端（JSON-RPC over stdio，每行一条 JSON）。
用法：在课程脚本中 from apc import AppServer"""
import json, subprocess, threading, queue, os, sys, time

class AppServer:
    def __init__(self, args=(), cwd=None, env=None):
        self.p = subprocess.Popen(["codex", "app-server", *args], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                  stderr=subprocess.DEVNULL, text=True, cwd=cwd, env=env, bufsize=1)
        self.next_id, self.pending, self.events = 1, {}, queue.Queue()
        self.on_request = None  # 服务器发来的请求（如审批）的处理函数：(method, params) -> result
        threading.Thread(target=self._reader, daemon=True).start()

    def _reader(self):
        for line in self.p.stdout:
            m = json.loads(line)
            if "id" in m and "method" in m:          # 服务器 → 客户端的请求
                result = self.on_request(m["method"], m["params"]) if self.on_request else {}
                self._send({"id": m["id"], "result": result})
            elif "id" in m:                          # 对我们请求的响应
                self.pending.pop(m["id"]).put(m)
            else:                                    # 通知
                self.events.put(m)

    def _send(self, m):
        self.p.stdin.write(json.dumps(m, ensure_ascii=False) + "\n"); self.p.stdin.flush()

    def request(self, method, params):
        i = self.next_id; self.next_id += 1; q = queue.Queue(); self.pending[i] = q
        self._send({"id": i, "method": method, "params": params})
        m = q.get(timeout=60)
        if "error" in m: raise RuntimeError(f"{method}: {m['error']}")
        return m["result"]

    def notify(self, method, params=None):
        self._send({"method": method, **({"params": params} if params is not None else {})})

    def wait(self, method, timeout=60, show=None):
        """等待某个通知；show(m) 用于打印途中的通知"""
        end = time.time() + timeout
        while True:
            m = self.events.get(timeout=max(0.1, end - time.time()))
            if show: show(m)
            if m["method"] == method: return m["params"]

    def start(self, cwd):
        self.request("initialize", {"clientInfo": {"name": "course", "title": None, "version": "0"}})
        self.notify("initialized")
        return self.request("thread/start", {"cwd": cwd})["thread"]["id"]

    def close(self):
        self.p.stdin.close(); self.p.wait(timeout=10)

def text(t): return [{"type": "text", "text": t, "text_elements": []}]
