# Shared generator: lesson module data -> HTML (via course page.py) + JS
import json,sys,importlib
from html import escape as E
J=lambda x:json.dumps(x,ensure_ascii=False)
def prac(steps,chal=None):
    h='<div class="prac">'
    for i,(p,c,o) in enumerate(steps):
        h+=f'<div class="st"><span class="n">{i+1:02d}</span><div><p>{p}</p>'+(f'<pre class="cmd">{E(c)}</pre>' if c else '')+(f'<pre class="out">{E(o)}</pre>' if o else '')+'</div></div>'
    h+='</div>'
    if chal:t,d,a=chal;h+=f'<div class="task2"><div class="k">挑战</div><h3>{t}</h3><p>{d}</p><details><summary>查看参考答案</summary><div>{a}</div></details></div>'
    return h
def code(src,url,label,lang=''):
    "real code excerpt with source link"
    return f'<p class="src" style="font:500 12px var(--m);margin:14px 0 6px"><a href="{url}" target="_blank" rel="noopener">{E(label)} ↗</a></p><pre class="cmd" style="overflow-x:auto;white-space:pre">{E(src)}</pre>'
def anim_js(id,scenes):
    # scenes: [(title,text,[(key,label,cls,x,y,w)])]
    els={};
    for _,_,bx in scenes:
        for b in bx:
            k,l,c,x,y=b[:5];w=b[5] if len(b)>5 else 120
            if k not in els: els[k]={'w':w,'h':44,'cls':'blk','html':l}
    sc=[]
    for i,(t,p,bx) in enumerate(scenes):
        st={}
        for b in bx:
            k,l,c,x,y=b[:5];w=b[5] if len(b)>5 else 120
            st[k]=[x,y,{'w':w,'h':44,'cls':'blk '+c,'html':l}]
        d={'t':t,'p':p,'set':st}
        if i:d['d']=3400
        sc.append(d)
    return f"Player(document.getElementById('{id}'),{{els:{J(els)},scenes:{J(sc)}}});\n"
def chal_js(items,hint):
    # items: [(button,log,msgclass,msg)]
    return "(()=>{const Q="+J(items)+";const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');Q.forEach(([t,r,c,n])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));p.textContent=r;m.className='msg '+c;m.innerHTML=n});q.appendChild(b)});m.className='msg';m.innerHTML="+J(hint)+"})();\n"
CH='<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:120px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'
def capture(cfg,n,steps):
    import os,subprocess,shutil
    cf=f"{cfg['dir']}/l{n:02d}.out.json";cache=json.load(open(cf)) if os.path.exists(cf) else {}
    if any(o is None and c not in cache for p,c,o in steps):
        wd=f"/workspace/run/{cfg['slug']}/l{n:02d}";shutil.rmtree(wd,ignore_errors=True);os.makedirs(wd);cache={}
        for p,c,o in steps:
            if o is None:
                r=subprocess.run(['bash','-c',c],cwd=wd,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,timeout=600,env={**os.environ,'PYTHONUNBUFFERED':'1','HOME':wd if cfg.get('home') else os.environ['HOME']})
                cache[c]=r.stdout.replace(wd+'/','').rstrip('\n')
            else: subprocess.run(['bash','-c',c],cwd=wd,timeout=600) if cfg.get('runall') else None
        json.dump(cache,open(cf,'w'),ensure_ascii=False,indent=0)
    return [(p,c,cache[c] if o is None else o) for p,c,o in steps]
def build(cfg,n):
    sys.path.insert(0,cfg['dir']);m=importlib.import_module(f'l{n:02d}');m.PRAC=capture(cfg,n,m.PRAC)
    from page import page
    secs=[(m.S1[0],m.S1[1],'<div id="p1"></div>'),(m.S2[0],m.S2[1],CH),(m.S3[0],m.S3[1],m.S3[2]+('<div id="p2"></div>' if getattr(m,'A2',None) else '')),(m.S4[0],m.S4[1],'<div id="t4"></div>'),(m.S5[0],m.S5[1],prac(m.PRAC,m.CHAL)),('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
    open(f"/workspace/learn/{cfg['slug']}/l{n:02d}.html",'w').write(page(n,m.TITLE,m.DESC,secs,m.SUM,m.NEXT,m.MIN))
    js=anim_js('p1',m.A1)+(anim_js('p2',m.A2) if getattr(m,'A2',None) else '')+chal_js(m.CHI,m.CHH)+f"Term(document.getElementById('t4'),{J(m.TERM)});\nQuiz(document.getElementById('qs'),{J(m.QUIZ)});\n"
    open(f"/workspace/learn/{cfg['slug']}/l{n:02d}.js",'w').write(js)

def excerpt(root,base,path,ranges,note=''):
    "real source lines from a pinned checkout; ranges=[(a,b),...] 1-indexed inclusive"
    import textwrap
    L=open(f'{root}/{path}',encoding='utf-8').read().split('\n')
    parts=[]
    for a,b in ranges:
        parts.append(textwrap.dedent('\n'.join(L[a-1:b]).replace('\t','  ')))
    src='\n  // …\n'.join(parts)
    a,b=ranges[0]
    label=path+'  '+', '.join(f'L{x}–{y}' if x!=y else f'L{x}' for x,y in ranges)
    return f'<p class="src" style="font:500 12px var(--m);margin:16px 0 6px"><a href="{base}{path}#L{a}-L{b}" target="_blank" rel="noopener">{E(label)} ↗</a>{(" · "+note) if note else ""}</p><pre class="cmd" style="overflow-x:auto;white-space:pre">{E(src)}</pre>'
