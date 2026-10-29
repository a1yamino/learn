"""Build the Docker principle-first course from course/uNN.json."""

import argparse
from html import escape as e
import json
import os
from pathlib import Path

SOURCE = Path(__file__).parent / "course"
DEFAULT_OUT = Path(__file__).resolve().parents[2] / "docker"
STAGES = [
    ("start", "快速上手", 1, 1),
    ("runtime", "进程、镜像与数据", 2, 8),
    ("paths", "网络与构建", 9, 12),
    ("control", "编排与安全边界", 13, 15),
    ("delivery", "交付、排障与面试", 16, 18),
]


def load(number):
    path = SOURCE / f"u{number:02d}.json"
    data = json.loads(path.read_text())
    required = ("number", "title", "summary", "minutes", "environment", "sources",
                "objectives", "question", "model", "diagram", "lab", "transfer",
                "interview", "takeaways", "references")
    for key in required:
        if key not in data or data[key] in (None, "", []):
            raise ValueError(f"{path.name}: missing {key}")
    if data["number"] != number:
        raise ValueError(f"{path.name}: number mismatch")
    if len(data["model"]) < 3 or len(data["lab"]["steps"]) < 3:
        raise ValueError(f"{path.name}: needs a complete model and observable experiment")
    nodes = data["diagram"]["nodes"]
    ids = [n["id"] for n in nodes]
    if len(ids) != len(set(ids)):
        raise ValueError(f"{path.name}: duplicate diagram node")
    for edge in data["diagram"]["edges"]:
        if edge["from"] not in ids or edge["to"] not in ids:
            raise ValueError(f"{path.name}: missing edge endpoint")
    for step in data["diagram"]["steps"]:
        if not set(step["focus"]).issubset(ids):
            raise ValueError(f"{path.name}: unknown focus node")
    for question in data["interview"]:
        if len(question["followups"]) < 3:
            raise ValueError(f"{path.name}: interview needs at least three follow-ups")
    return data


def paragraphs(values):
    return "\n".join("<p>" + e(value) + "</p>" for value in values)


def bullets(values, ordered=False):
    tag = "ol" if ordered else "ul"
    return f"<{tag}>" + "".join("<li>" + e(value) + "</li>" for value in values) + f"</{tag}>"


def code(value):
    return '<pre class="cmd"><code>' + e(value) + "</code></pre>" if value else ""


def shell(title, content, crumb="Docker", scripts=""):
    return f'''<!DOCTYPE html>
<html lang="zh-CN" data-theme="dark">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)} · Docker 原理与实战</title>
<script>(function(){{var t;try{{t=localStorage.getItem('learn.theme')}}catch(e){{}}document.documentElement.dataset.theme=t==='light'?'light':'dark'}})()</script>
<link rel="icon" href="data:,">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&family=Noto+Sans+SC:wght@400;500;700;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/play.css"><link rel="stylesheet" href="layout.css"><link rel="stylesheet" href="course.css">
</head>
<body class="unit-course">
<div class="top"><a href="../index.html"><span class="dot"></span>学习</a><a href="index.html">Docker</a><span class="crumb">{e(crumb)}</span><span class="sp"></span><button class="btn" data-theme-btn aria-label="切换主题">浅色</button></div>
<div class="prog"></div>
<main class="wrap">{content}</main>
<script src="../assets/play.js"></script><script src="motion.js"></script><script src="course.js"></script>{scripts}
</body></html>
'''


def section(id, label, title, body):
    return f'<section class="mis unit-section" id="{id}"><div class="mh"><div><div class="k">{label}</div><h2>{e(title)}</h2></div></div>{body}</section>'


def unit(data, all_units):
    n = data["number"]
    toc = [("model", "原理模型"), ("diagram", "分步图解"), ("lab", "预测与实验"),
           ("transfer", "独立推理"), ("interview", "面试追问"), ("summary", "本课验收")]
    content = f'<section class="lede"><div class="k">Docker · 主线 {n:02d} / 18</div><h1>{e(data["title"])}</h1><p>{e(data["summary"])}</p><p class="unit-duration">建议 {data["minutes"]} 分钟，含实验；按观察结果调整进度。</p>'
    content += '<div class="unit-question"><span>先想一想</span><p>' + e(data["question"]) + "</p></div>"
    content += bullets(data["objectives"])
    content += '<aside class="unit-environment"><strong>实验前提</strong><p>' + e(data["environment"]) + '</p><p><a href="labs/README.md">共用应用与接口说明</a> · <a href="labs/app.py" download>应用源码</a></p></aside>'
    content += '<nav class="course-jumps" aria-label="本课章节">' + "".join(f'<a href="#{id}">{e(title)}</a>' for id, title in toc) + '</nav></section>'
    model = ""
    for part in data["model"]:
        model += '<article class="unit-concept"><h3>' + e(part["title"]) + '</h3>' + paragraphs(part["body"]) + code(part.get("code", "")) + '</article>'
    content += section("model", "01 · MODEL", "建立因果模型", model)
    content += section("diagram", "02 · DIAGRAM", data["diagram"]["label"], '<p class="unit-caption">默认停在第一步。先解释当前状态，再点下一步；播放用于复习。图解是教学模型。</p><div id="unit-player"></div>')
    lab = data["lab"]
    body = '<p>' + e(lab["environment"]) + '</p><div class="unit-predict"><strong>运行之前，先预测</strong><p>' + e(lab["predict"]) + '</p><label for="prediction">记录判断与理由</label><textarea id="prediction" data-draft="prediction" rows="3" placeholder="我预测……，因为……；如果结果不同，我会检查……"></textarea></div>'
    for i, step in enumerate(lab["steps"], 1):
        body += '<article class="unit-lab-step"><h3>' + f'{i:02d} · ' + e(step["title"]) + '</h3>' + code(step["code"]) + '<p><strong>观察：</strong>' + e(step["expect"]) + '</p><p><strong>解释：</strong>' + e(step["why"]) + '</p></article>'
    body += '<details><summary>本实验的清理范围与命令</summary>' + code(lab.get("cleanup", "")) + '</details>'
    content += section("lab", "03 · EXPERIMENT", lab["title"], body)
    transfer = data["transfer"]
    body = '<p>' + e(transfer["question"]) + '</p><h3>提交这些证据</h3>' + bullets(transfer["evidence"]) + '<label for="reasoning">先写假设、观测和排除理由</label><textarea id="reasoning" data-draft="reasoning" rows="5" placeholder="现象 → 假设 → 能区分假设的证据 → 最小修复 → 复验"></textarea><details><summary>对照参考推理</summary>' + paragraphs(transfer["answer"]) + '</details>'
    content += section("transfer", "04 · TRANSFER", "换一个条件，还能解释吗", body)
    body = '<p>先用自己的话回答，再打开参考。回答按“结论 → 机制 → 边界 → 证据”组织；追问用来检验理解。</p>'
    for i, question in enumerate(data["interview"], 1):
        body += '<article class="unit-interview"><h3>' + f'{i:02d} · ' + e(question["question"]) + '</h3><details><summary>查看参考回答与递进追问</summary><p>' + e(question["answer"]) + '</p>'
        for j, followup in enumerate(question["followups"], 1):
            body += '<h4>' + f'追问 {j}：' + e(followup["question"]) + '</h4><p>' + e(followup["answer"]) + '</p>'
        body += '<p class="unit-misconception"><strong>容易混淆：</strong>' + e(question["misconception"]) + '</p></details></article>'
    content += section("interview", "05 · INTERVIEW", "面试中讲清原理", body)
    body = bullets(data["takeaways"], True)
    body += '<div class="unit-completion"><label><input type="checkbox" data-completion="lab"> 我已完成实操，并保存可复核的证据</label><label><input type="checkbox" data-completion="interview"> 我能脱离答案口述，并回答递进追问</label><p class="unit-caption" id="save-state" aria-live="polite">自记进度与草稿只保存在本机浏览器；勾选不代表自动验收。</p></div>'
    if data.get("references"):
        body += '<h3>核对原始依据</h3><ul>' + ''.join('<li><a href="' + e(r["url"], quote=True) + '">' + e(r["title"]) + '</a></li>' for r in data["references"]) + '</ul>'
    body += '<details><summary>进一步阅读：原课程相关资料</summary><ul>' + ''.join(f'<li><a href="l{s:02d}.html">原第 {s} 课</a></li>' for s in data["sources"]) + '</ul></details>'
    content += section("summary", "06 · EVIDENCE", "用证据判断是否掌握", body)
    content += '<footer class="endnav"><div class="unit-next">'
    if n > 1:
        content += f'<a href="u{n-1:02d}.html">← 上一课</a>'
    content += '<a href="index.html">课程目录</a></div>'
    if n < 18:
        next_title = all_units.get(n + 1, {}).get("title", f"主线第 {n+1} 课")
        content += f'<div class="k">下一课 · {n+1:02d}</div><a class="big" href="u{n+1:02d}.html">{e(next_title)} →</a>'
    else:
        content += '<div class="k">继续验证</div><a class="big" href="index.html#graduation">毕业验收与选修 →</a>'
    content += '</footer>'
    payload = {"number": n, "diagram": data["diagram"]}
    raw = json.dumps(payload, ensure_ascii=False).replace("<", "\\u003c").replace("&", "\\u0026")
    return shell(data["title"], content, f"主线第 {n} 课", '<script type="application/json" id="lesson-data">' + raw + '</script><script>DockerCourse.initLesson()</script>')


def index(units):
    body = '''<section class="lede"><div class="k">DOCKER · 原理与实战</div><h1>从会运行，到能解释</h1><p>18 课主线，从一个可运行的 API 出发，理解进程、文件、网络与构建；用独立交付和 Docker 专项面试共同验收。</p><div class="unit-index-start"><a class="btn pri" href="u01.html">从快速上手开始 →</a><a class="btn" href="u02.html">已有基础，直接学原理</a></div><nav class="course-jumps" aria-label="课程阶段">'''
    body += ''.join(f'<a href="#{id}"><span class="range">{lo:02d}–{hi:02d}</span>{e(title)}</a>' for id, title, lo, hi in STAGES)
    body += '</nav></section><section class="unit-intro"><h2>怎样使用这门课</h2><p>每课先建立模型、写下预测，再执行实验。遇到不同结果，记录证据并修正解释。最后用陌生场景和连续追问检查能否独立迁移。</p><p>实验代码位于 <a href="labs/README.md">docker/labs</a>，已提供 API、数据库与反向代理。页面图解不会操作 Docker。Linux 专属命令、权限和环境前提会在课内标明。</p><p class="unit-caption">目录完成状态来自你在本机勾选的实操和面试记录，不是自动评分。</p></section><ul class="list unit-list">'
    for id, title, lo, hi in STAGES:
        body += f'<li class="grp" id="{id}">{e(title)}</li>'
        for n in range(lo, hi + 1):
            lesson = units[n]
            body += f'<li><a href="u{n:02d}.html" data-unit-link="{n}"><span class="n">{n:02d}</span><span><div class="t">{e(lesson["title"])}</div><div class="d">{e(lesson["summary"])}</div></span><span class="s" data-unit-status="{n}">待学习</span><span class="ar">→</span></a></li>'
    body += '''</ul><section class="mis" id="graduation"><div class="mh"><div><div class="k">毕业标准</div><h2>实战与面试，都有证据</h2></div></div><p>毕业项目从提供的应用开始。先完成干净环境部署、数据恢复、故障诊断和兼容回滚，再用 45–60 分钟 Docker 专项模拟面试检验表达、追问、画图和工程取舍。</p><p><a href="u18.html">查看毕业任务与通过条件 →</a></p><h3>选修：跨主机网络与 Swarm</h3><p>需要进一步理解 VXLAN、服务调度和控制平面时，阅读 <a href="l24.html">overlay 与 Swarm</a>。它是跨主机编排的桥梁。</p><details><summary>原课程 25 课补充资料</summary><p>原链接继续有效；新主线已重新组织原理和实验，旧课可用于查询更多用法与示例。</p><ul>'''
    body += ''.join(f'<li><a href="l{n:02d}.html">原第 {n:02d} 课</a></li>' for n in range(1, 26))
    body += '</ul></details></section><footer class="foot"><a href="../index.html">← 学习中心</a><span>代码 MIT · 内容 CC BY 4.0</span></footer>'
    return shell("课程目录", body, "18 课主线 + 1 课选修", '<script>DockerCourse.initIndex()</script>')


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("numbers", nargs="*", type=int)
    parser.add_argument("--out", type=Path, default=Path(os.environ.get("OUT", DEFAULT_OUT)))
    parser.add_argument("--check", action="store_true", help="compare generated files without writing")
    args = parser.parse_args()
    numbers = args.numbers or list(range(1, 19))
    if any(n < 1 or n > 18 for n in numbers):
        parser.error("lesson numbers must be 1–18")
    units = {n: load(n) for n in range(1, 19) if (SOURCE / f"u{n:02d}.json").exists()}
    missing = sorted(set(numbers) - set(units))
    if missing:
        parser.error("missing lesson sources: " + ", ".join(map(str, missing)))
    files = {f"u{n:02d}.html": unit(units[n], units) for n in numbers}
    if len(units) == 18:
        files["index.html"] = index(units)
    errors = []
    if not args.check:
        args.out.mkdir(parents=True, exist_ok=True)
    for name, content in files.items():
        target = args.out / name
        if args.check:
            if not target.exists() or target.read_text() != content:
                errors.append(name)
        else:
            target.write_text(content)
    if errors:
        parser.error("generated files differ: " + ", ".join(errors))
    print(f"{'Verified' if args.check else 'Generated'} {len(files)} pages; {len(units)} lesson sources loaded.")
