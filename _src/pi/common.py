import sys;sys.path.insert(0,'/workspace/coursekit')
from gen import excerpt
SHA='db774055e3ecae05ab6eae8656454cde98e36780'
ROOT='/workspace/src/pi-mono'
BASE=f'https://github.com/badlogic/pi-mono/blob/{SHA}/'
def X(path,ranges,note=''): return excerpt(ROOT,BASE,path,ranges,note)
def codex(n,title): return f'<a href="../codex/l{n:02d}.html">Codex 第 {n} 课 · {title}</a>'
def NOTE(html): return f'<div class="card" style="margin:16px 0;font-size:15px;line-height:1.7">{html}</div>'
