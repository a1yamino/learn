# Lesson page generator (lesson-1 style). page(n, title, desc, sections, summary, next)
def page(n,title,desc,secs,summ,nxt,mins=20):
    toc=''.join(f'<li><a href="#s{i+1}"><span class="n">0{i+1}</span><span class="t">{s[0]}</span></a></li>' for i,s in enumerate(secs))
    body=''.join(f'\n<section class="mis" id="s{i+1}"><div class="mh"><div><div class="k">0{i+1}</div><h2>{s[0]}</h2><div class="goal">{s[1]}</div></div></div>\n{s[2]}\n</section>\n' for i,s in enumerate(secs))
    nn=n+1;nav=f'<a class="big" href="l{nn:02d}.html">{nxt} →</a>' if nxt else '<a class="big" href="index.html">课程目录 →</a>'
    return f'''<!DOCTYPE html><html lang="zh-CN" data-theme="dark"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Kafka 第 {n} 课 · {title}</title>
<script>(function(){{var t;try{{t=localStorage.getItem('learn.theme')}}catch(e){{}}document.documentElement.dataset.theme=t==='light'?'light':'dark'}})()</script>
<link rel="icon" href="data:,"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&family=Noto+Sans+SC:wght@400;500;700;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/play.css"></head><body>
<div class="top"><a href="../index.html"><span class="dot"></span>学习</a><a class="crumb" href="index.html">Kafka</a><span class="crumb">第 {n} 课</span><span class="sp"></span>{f'<a href="l{n-1:02d}.html">← 第 {n-1} 课</a>' if n>1 else ''}<button class="btn" data-theme-btn aria-label="切换主题">浅色</button></div><div class="prog"></div>
<main class="wrap">
<section class="lede"><div class="k">Kafka · 第 {n} 课</div><h1>{title}</h1>
<p>{desc}约 {mins} 分钟。</p>
<ol class="ms">{toc}</ol></section>
{body}
<section class="mis" id="sum"><div class="mh"><div><div class="k">小结</div><h2>记住这几点</h2></div></div>
<ol class="sum">{''.join(f'<li>{x}</li>' for x in summ)}</ol></section>
<footer class="endnav"><div class="k">{("下一课 · %02d" % nn) if nxt else "课程完成"}</div>{nav}<div class="meta"><a href="index.html">← 课程目录</a><a href="../index.html">学习</a></div></footer>
</main>
<script src="../assets/play.js"></script>
<script src="l{n:02d}.js"></script>
</body></html>
'''
