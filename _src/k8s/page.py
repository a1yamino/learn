# Lesson page generator for /k8s/ (rebuilt from live HTML of l18). No secrets.
import html,sys
E=lambda s:html.escape(s,quote=True)
HEAD='''<!DOCTYPE html><html lang="zh-CN" data-theme="dark"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Kubernetes 第 {n} 课 · {title}</title>
<script>(function(){{var t;try{{t=localStorage.getItem('learn.theme')}}catch(e){{}}document.documentElement.dataset.theme=t==='light'?'light':'dark'}})()</script>
<link rel="icon" href="data:,"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&family=Noto+Sans+SC:wght@400;500;700;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/play.css"></head><body>
<div class="top"><a href="../index.html"><span class="dot"></span>学习</a><a class="crumb" href="index.html">Kubernetes</a><span class="crumb">第 {n} 课</span><span class="sp"></span><a href="l{p:02d}.html">← 第 {p} 课</a><button class="btn" data-theme-btn aria-label="切换主题">浅色</button></div><div class="prog"></div>
<main class="wrap">
'''
def prac(steps,chal):
    h='<div class="prac">'+''.join(f'<div class="st"><span class="n">{i+1:02d}</span><div><p>{t}</p><pre class="cmd">{E(c)}</pre><pre class="out">{E(o)}</pre></div></div>' for i,(t,c,o) in enumerate(steps))+'</div>'
    t,q,a=chal
    return h+f'<div class="task2"><div class="k">挑战</div><h3>{t}</h3><p>{q}</p><details><summary>查看参考答案</summary><div>{a}</div></details></div>'
def page(n,title,desc,secs,summ,nxt,mins):
    h=HEAD.format(n=n,title=title,p=n-1)
    h+=f'<section class="lede"><div class="k">Kubernetes · 第 {n} 课</div><h1>{title}</h1>\n<p>{desc}约 {mins} 分钟。</p>\n<ol class="ms">'+''.join(f'<li><a href="#s{i+1}"><span class="n">{i+1:02d}</span><span class="t">{s[0]}</span></a></li>' for i,s in enumerate(secs))+'</ol></section>\n\n'
    for i,(t,g,b) in enumerate(secs):
        h+=f'<section class="mis" id="s{i+1}"><div class="mh"><div><div class="k">{i+1:02d}</div><h2>{t}</h2><div class="goal">{g}</div></div></div>\n{b}\n</section>\n\n'
    h+='<section class="mis" id="sum"><div class="mh"><div><div class="k">小结</div><h2>记住这几点</h2></div></div>\n<ol class="sum">'+''.join(f'<li>{x}</li>' for x in summ)+'</ol></section>\n'
    if nxt: h+=f'<footer class="endnav"><div class="k">下一课 · {n+1:02d}</div><a class="big" href="l{n+1:02d}.html">{nxt} →</a><div class="meta"><a href="index.html">← 课程目录</a><a href="../index.html">学习</a></div></footer>\n'
    h+=f'</main>\n<script src="../assets/play.js"></script>\n<script src="l{n:02d}.js"></script>\n</body></html>\n'
    return h
