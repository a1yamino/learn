import sys;sys.path.insert(0,'/workspace/pg-course');from page import page
from html import escape as E
def prac(steps,chal=None):
    h='<div class="prac">'
    for i,(p,c,o) in enumerate(steps):
        h+=f'<div class="st"><span class="n">{i+1:02d}</span><div><p>{p}</p>'+(f'<pre class="cmd">{E(c)}</pre>' if c else '')+(f'<pre class="out">{E(o)}</pre>' if o else '')+'</div></div>'
    h+='</div>'
    if chal:t,d,a=chal;h+=f'<div class="task2"><div class="k">挑战</div><h3>{t}</h3><p>{d}</p><details><summary>查看参考答案</summary><div>{a}</div></details></div>'
    return h
import importlib
for n in sys.argv[1:]:
    m=importlib.import_module(f'l{int(n):02d}')
    open(f'/workspace/learn/postgres/l{int(n):02d}.html','w').write(page(int(n),m.TITLE,m.DESC,m.secs(prac,E),m.SUM,m.NEXT,m.MIN))
