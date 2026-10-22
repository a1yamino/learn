set -e
cd /workspace/codex-course
sed -i 's/{n} 节课：数据系统/{n} 节课，已全部完成：数据系统/' index.py
for i in $(seq 1 24); do python3 build.py $(printf %02d $i); done; python3 index.py 24
cd /workspace/learn
python3 - <<'P'
import re
s=open('index.html').read()
i=s.find('codex/');j=s.find('更新中',i)
assert i>0 and j>0 and j-i<800,(i,j)
s=s[:j]+'已完成'+s[j+3:]
open('index.html','w').write(s)
r=open('README.md').read().replace('更新中（24 课）','已完成（24 课）');open('README.md','w').write(r)
P
bash /workspace/codex-course/sync.sh
git add -A
git status --porcelain | grep -E 'manifest.json|\.publish\.json' && exit 1 || true
git -c user.name=a1yamino -c user.email=a1yamino@users.noreply.github.com commit -qm "Codex CLI course complete" && (for t in 1 2 3 4; do (git pull -q --rebase --autostash || (git rebase --abort; false)) && git push -q && break; sleep 10; [ $t = 4 ] && exit 1; done) && git rev-parse --short HEAD
