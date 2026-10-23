# One-off: rebuild lNN.py data modules from the published HTML so sources match main exactly.
import re,sys,os
H=os.path.dirname(os.path.abspath(__file__));D=os.path.join(H,'..','..','docker')
for n in range(2,26):
    s=open(f'{D}/l{n:02d}.html').read()
    title=re.search(r'<h1>(.*?)</h1>',s).group(1)
    m=re.search(r'</h1>\n<p>(.*)约 (\d+) 分钟。</p>',s);desc,mins=m.group(1),int(m.group(2))
    secs=re.findall(r'\n<section class="mis" id="s\d+"><div class="mh"><div><div class="k">0\d</div><h2>(.*?)</h2><div class="goal">(.*?)</div></div></div>\n(.*?)\n</section>\n',s,re.S)
    summ=re.findall(r'<li>(.*?)</li>',re.search(r'<ol class="sum">(.*?)</ol>',s,re.S).group(1),re.S)
    nx=re.search(r'<a class="big" href="l\d+\.html">(.*?) →</a>',s);nxt=nx.group(1) if nx else None
    jv=re.search(r'<script src="l\d+\.js(\?[^"]*)"',s).group(1) if re.search(r'l\d+\.js\?',s) else ''
    open(f'{H}/l{n:02d}.py','w').write(f'TITLE={title!r}\nDESC={desc!r}\nNEXT={nxt!r}\nMIN={mins}\nSUM={summ!r}\nSECS={secs!r}\nJSV={jv!r}\ndef secs(prac,E): return SECS\n')
