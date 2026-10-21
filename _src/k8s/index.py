# python3 index.py LIVE : enable lessons <= LIVE in /workspace/learn/k8s/index.html
import re,sys
L=int(sys.argv[1]);p='/workspace/learn/k8s/index.html';s=open(p).read()
def f(m):
    n=int(m.group(1))
    return m.group(0).replace(' class="off"','').replace('<span class="s">未上线</span>','<span class="s"></span>') if n<=L else m.group(0)
s=re.sub(r'<li><a href="l(\d\d)\.html"[^>]*>.*?</a></li>',f,s);open(p,'w').write(s)
