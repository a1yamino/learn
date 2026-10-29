"""Docker 主线（第二版）生成器：读取 flow_a/b/c.py，输出 docker/u01–u18.html 与 docker/index.html。

用法：python3 _src/docker/v2/build_v2.py [--check]
课程流程：先想一想 → 原理 → 图解 → 推演 → 迁移 → 面试 → 小结。
"""
import json, sys, importlib.util
from html import escape as e
from pathlib import Path

HERE = Path(__file__).parent
OUT = HERE.parents[2] / "docker"
STAGES = [("快速上手", 1, 1), ("进程、镜像与数据", 2, 8), ("网络与构建", 9, 12),
          ("编排与安全边界", 13, 15), ("交付、排障与毕业", 16, 18)]
SECTIONS = [("model", "原理"), ("diagram", "图解"), ("predict", "推演"),
            ("transfer", "迁移"), ("interview", "面试"), ("summary", "小结")]

def load():
    out = []
    for name in ("flow_a", "flow_b", "flow_c"):
        spec = importlib.util.spec_from_file_location(name, HERE / f"{name}.py")
        m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
        out += m.L
    out.sort(key=lambda d: d["n"])
    assert [d["n"] for d in out] == list(range(1, 19))
    for d in out:
        ids = {x[0] for x in d["diagram"]["nodes"]}
        for a, b, _ in d["diagram"]["edges"]:
            assert a in ids and b in ids, (d["n"], a, b)
        for s in d["diagram"]["steps"]:
            assert set(s[2]) <= ids, (d["n"], s)
    return out

HEAD = '''<!DOCTYPE html>
<html lang="zh-CN" data-theme="dark">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<script>(function(){{var t;try{{t=localStorage.getItem('learn.theme')}}catch(e){{}}document.documentElement.dataset.theme=t==='light'?'light':'dark'}})()</script>
<link rel="icon" href="data:,">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&family=Noto+Sans+SC:wght@400;500;700;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/play.css"><link rel="stylesheet" href="layout.css"><link rel="stylesheet" href="unit.css">
</head>
<body class="u2{bodycls}">
<div class="top"><a href="../index.html"><span class="dot"></span>学习</a>{crumbs}<span class="sp"></span><button class="btn" data-theme-btn aria-label="切换主题">浅色</button></div>
<div class="prog"></div>
'''
FOOT = '''<script src="../assets/play.js"></script><script src="unit.js"></script>
</body></html>
'''

def stage_of(n):
    for i, (name, a, b) in enumerate(STAGES):
        if a <= n <= b: return i, name

def sec(id_, idx, label, title, body):
    return (f'<section class="u2-sec" id="{id_}" aria-labelledby="{id_}-h"><header class="u2-sh">'
            f'<span class="u2-idx">{idx:02d}</span><span class="u2-lab">{label}</span>'
            f'<h2 id="{id_}-h">{e(title)}</h2></header>{body}</section>')

def lesson(d, prev, nxt):
    n = d["n"]; _, stage = stage_of(n)
    ps = lambda xs: "".join(f"<p>{e(x)}</p>" for x in xs)
    model = "".join(f'<article class="u2-concept"><h3>{e(t)}</h3>{ps(b)}</article>' for t, b in d["model"])
    dg = d["diagram"]
    data = {"label": dg["label"],
            "nodes": [dict(id=a, t=b, d=c, c=x, r=y) for a, b, c, x, y in dg["nodes"]],
            "edges": [dict(f=a, to=b, l=c) for a, b, c in dg["edges"]],
            "steps": [dict(t=a, b=b, f=c) for a, b, c in dg["steps"]]}
    diagram = (f'<figure class="u2-fig" data-diagram=\'{e(json.dumps(data, ensure_ascii=False), quote=True)}\' '
               f'aria-label="{e(dg["label"])}"><div class="u2-stage"></div>'
               f'<figcaption class="u2-cap" aria-live="polite"></figcaption>'
               f'<div class="u2-ctl"><div class="u2-ticks" role="tablist" aria-label="步骤"></div>'
               f'<div class="u2-btns"><button class="u2-b" data-act="prev" aria-label="上一步">←</button>'
               f'<button class="u2-b" data-act="next" aria-label="下一步">→</button>'
               f'<button class="u2-b u2-replay" data-act="replay">重播</button></div></div></figure>')
    p = d["predict"]
    opts = "".join(f'<button class="u2-opt" data-i="{i}"><span class="u2-key">{"ABC"[i]}</span><span>{e(o)}</span></button>'
                   for i, o in enumerate(p["options"]))
    predict = (f'<p class="u2-q">{e(p["q"])}</p><div class="u2-opts" data-answer="{p["answer"]}">{opts}</div>'
               f'<div class="u2-reveal" hidden><div><p class="u2-verdict"></p><p>{e(p["explain"])}</p>'
               f'<div class="u2-term" aria-label="示例输出"><div class="u2-term-h"><span></span><span></span><span></span>'
               f'<em>示例输出 · 只读</em></div><pre><code>{e(p["out"])}</code></pre></div></div></div>')
    t = d["transfer"]
    transfer = (f'<p class="u2-q">{e(t["q"])}</p><p class="u2-hint">先在心里走一遍：现象说明了什么，哪条证据能区分你的几个猜测。</p>'
                f'<details class="u2-det"><summary>展开推理</summary><div class="u2-det-b">{ps(t["a"])}</div></details>')
    iv = d["interview"]
    fol = "".join(f'<details class="u2-det u2-sub"><summary>追问：{e(q)}</summary><div class="u2-det-b"><p>{e(a)}</p></div></details>'
                  for q, a in iv["follow"])
    interview = (f'<p class="u2-q">{e(iv["q"])}</p><p class="u2-hint">先用自己的话说一遍，大约一两分钟，再对照参考。</p>'
                 f'<details class="u2-det"><summary>参考回答</summary><div class="u2-det-b"><p>{e(iv["a"])}</p></div></details>{fol}')
    refs = "".join(f'<li><a href="{e(u)}" rel="noopener" target="_blank">{e(x)}</a></li>' for x, u in d["refs"])
    summary = (f'<ol class="u2-take">{"".join(f"<li>{e(x)}</li>" for x in d["takeaways"])}</ol>'
               f'<div class="u2-refs"><span>延伸阅读</span><ul>{refs}</ul></div>')
    titles = {"model": "原理", "diagram": dg["label"], "predict": "先猜，再看结果", "transfer": "换个场景",
              "interview": "讲给面试官听", "summary": "带走这几句"}
    bodies = {"model": model, "diagram": diagram, "predict": predict, "transfer": transfer,
              "interview": interview, "summary": summary}
    secs = "".join(sec(k, i + 1, lab, titles[k], bodies[k]) for i, (k, lab) in enumerate(SECTIONS))
    jumps = "".join(f'<a href="#{k}">{lab}</a>' for k, lab in SECTIONS)
    nav = '<footer class="endnav u2-end">'
    if nxt:
        nav += f'<div class="k">下一课 · {nxt["n"]:02d}</div><a class="big" href="u{nxt["n"]:02d}.html">{e(nxt["title"])}</a>'
    else:
        nav += '<div class="k">全部完成</div><a class="big" href="index.html">回到课程目录</a>'
    nav += '<div class="meta">' + (f'<a href="u{prev["n"]:02d}.html">← {e(prev["title"])}</a>' if prev else '<span></span>') + '<a href="index.html">目录</a></div></footer>'
    body = (f'<main class="wrap u2-wrap"><section class="lede u2-lede"><div class="k">Docker · {stage} · {n:02d} / 18</div>'
            f'<h1>{e(d["title"])}</h1><p class="u2-sum">{e(d["summary"])}</p>'
            f'<aside class="u2-ask"><span>先想一想</span><p>{e(d["question"])}</p></aside>'
            f'<nav class="u2-jumps" aria-label="本课章节">{jumps}</nav></section>{secs}{nav}</main>\n')
    crumbs = f'<a href="index.html">Docker</a><span class="crumb">{n:02d}</span>'
    return HEAD.format(title=f'{e(d["title"])} · Docker', desc=e(d["summary"]), bodycls="", crumbs=crumbs) + body + FOOT

OLD = ["为什么需要 Docker","容器生命周期与核心命令","Dockerfile 与构建缓存","实战：把后端 API 打包成镜像","多阶段构建与镜像瘦身"]

def index(ls, old_titles):
    groups = ""
    for i, (name, a, b) in enumerate(STAGES):
        rng = f"{a:02d}" if a == b else f"{a:02d}–{b:02d}"
        items = "".join(f'<li><a href="u{d["n"]:02d}.html"><span class="n">{d["n"]:02d}</span><span><div class="t">{e(d["title"])}</div>'
                        f'<div class="d">{e(d["summary"])}</div></span><span class="s"></span><span class="ar">→</span></a></li>'
                        for d in ls if a <= d["n"] <= b)
        groups += f'<li class="grp" id="s{i+1}"><span>{rng}</span>{e(name)}</li>{items}'
    jumps = "".join(f'<a href="#s{i+1}"><span class="range">{a:02d}{"" if a==b else "–"+format(b,"02d")}</span>{e(nm)}</a>' for i, (nm, a, b) in enumerate(STAGES))
    old = "".join(f'<li><a href="l{i:02d}.html"><span class="n">{i:02d}</span><span><div class="t">{e(t)}</div></span><span class="s"></span><span class="ar">→</span></a></li>'
                  for i, t in old_titles)
    body = (f'<main class="wrap course-index u2-index"><section class="lede u2-lede"><div class="k">课程</div><h1>Docker</h1>'
            f'<p class="u2-sum">18 课，先建立原理，再走到交付与排障。每课按同一条路线展开：先想一想，读原理，看图解，猜结果，换场景，讲给面试官听。</p>'
            f'<nav class="course-jumps" aria-label="课程阶段">{jumps}</nav></section>'
            f'<ul class="list" style="border-top:0">{groups}</ul>'
            f'<details class="u2-old"><summary>第一版 25 课（旧版，保留作参考）</summary><ul class="list">{old}</ul></details></main>\n')
    return HEAD.format(title="Docker · 课程目录", desc="Docker 原理与实战，18 课。", bodycls=" u2-idxpage",
                       crumbs='<span class="crumb">Docker</span>') + body + FOOT

def old_titles():
    import re
    res = []
    for i in range(1, 26):
        html = (OUT / f"l{i:02d}.html").read_text()
        m = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.S)
        t = re.sub(r"<[^>]+>", "", m.group(1)).strip() if m else f"第 {i} 课"
        import html as H; res.append((i, H.unescape(t)))
    return res

def main():
    ls = load()
    files = {}
    for i, d in enumerate(ls):
        files[f"u{d['n']:02d}.html"] = lesson(d, ls[i-1] if i else None, ls[i+1] if i + 1 < len(ls) else None)
    files["index.html"] = index(ls, old_titles())
    bad = []
    for name, text in files.items():
        p = OUT / name
        if "--check" in sys.argv:
            if not p.exists() or p.read_text() != text: bad.append(name)
        else:
            p.write_text(text)
    if bad: print("out of date:", bad); sys.exit(1)
    print("ok", len(files))

if __name__ == "__main__":
    main()
