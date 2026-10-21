import sys,importlib;sys.path.insert(0,__file__.rsplit('/',1)[0])
from page import page,prac,E
OUT='/workspace/learn/k8s'
for n in sys.argv[1:]:
    m=importlib.import_module(f'l{int(n):02d}')
    open(f'{OUT}/l{int(n):02d}.html','w').write(page(int(n),m.TITLE,m.DESC,m.secs(prac,E),m.SUM,m.NEXT,m.MIN))
    print('ok',n)
