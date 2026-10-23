import re, sys
sys.argv=['x']; src=open('/workspace/codex-course/index.py').read()
G=eval(src[src.index('G=')+2:src.index("\nrun(")])
U='https://a1yamino.github.io/learn/codex/'
p='/workspace/learn/README.md'; r=open(p).read()
if '/learn/codex/' in r: print('already'); sys.exit()
row='| [Codex CLI 源码精读：生产级编码 agent]('+U+') | turn 循环、工具、沙箱与审批、执行策略、压缩、MCP、/plan 与 /goal | 学完 pi 源码精读；能阅读 Rust 代码 | 24 / 24 |\n'
pirow=[l for l in r.splitlines(True) if l.startswith('| [pi 源码精读')][0]
r=r.replace(pirow,pirow+row,1)
r=r.replace('目前共开放 **194 课**','目前共开放 **218 课**')
pil=[l for l in r.splitlines(True) if l.startswith('- **理解编码 agent**')][0]
r=r.replace(pil,pil+'- **深入生产级 agent**：pi → Codex。学完 pi 的内核后，读 Codex CLI 的 Rust 实现：沙箱、审批、执行策略、/plan 与 /goal，每课对照 pi 的对应课程，并用假模型服务器驱动从源码构建的真实 codex 做离线练习。\n',1)
r=r.replace('pi/              pi 源码精读课件\n','pi/              pi 源码精读课件\ncodex/            Codex CLI 源码精读课件\n',1)
out=['<details>','<summary><strong>Codex CLI 源码精读</strong> · 24 课</summary>','',f'[进入课程目录]({U})','',
 '阅读 [openai/codex](https://github.com/openai/codex/tree/c260087efe8cc6dcc0526e7018ae9e0e3fc134e3) 在提交 c260087 的 Rust 源码；代码摘录均链接到该提交。以 pi 源码精读为基础，每课链接 pi 的对应课程。','']
n=1
for name,ts in G:
    a,b=n,n+len(ts)-1
    out.append(f'**{name} · 第 {a:02d}–{b:02d} 课**' if a!=b else f'**{name} · 第 {a:02d} 课**'); out.append('')
    for t in ts: out.append(f'- **{n:02d}** [{t}]({U}l{n:02d}.html)'); n+=1
    out.append('')
out.append('</details>')
blk='\n'.join(out)+'\n'
i=r.index('<summary><strong>pi 源码精读</strong>'); j=r.index('</details>',i)+len('</details>\n')
r=r[:j]+'\n'+blk+r[j:]
open(p,'w').write(r); print('ok',n-1)
