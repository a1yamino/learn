set -e
cd /workspace/cleancode-course
sed -i "s/'：命名/'，已全部完成：命名/" index.py
for i in $(seq 1 20); do python3 build.py $(printf %02d $i); done; python3 index.py 20
cd /workspace/learn
python3 - <<'P'
import re
s=open('index.html').read()
i=s.find('cleancode/');j=s.find('更新中',i)
assert i>0 and j>0 and j-i<800,(i,j)
s=s[:j]+'已完成'+s[j+3:]
open('index.html','w').write(s)
r=open('README.md').read().replace('更新中（20 课）','已完成（20 课）');open('README.md','w').write(r)
P
bash /workspace/cleancode-course/sync.sh
git add -A
git status --porcelain | grep -E 'manifest.json|\.publish\.json' && exit 1 || true
git -c user.name=a1yamino -c user.email=a1yamino@users.noreply.github.com commit -qm "Clean Code course complete" && git push -q && git rev-parse --short HEAD
