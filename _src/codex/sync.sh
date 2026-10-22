#!/bin/bash
# copy course sources to repo _src/codex and the persistent store, then commit+push _src
set -e
S=/workspace/codex-course; R=/workspace/learn/_src/codex; B=/cursor/stores/store-c8ce1fd0-7a1f-4906-b5c2-3226ea6c13e6/backup/codex-course
mkdir -p $R
cp $S/*.py $S/*.sh $R/; cp $S/*.json $R/ 2>/dev/null || true; cp $S/test/kt.js $R/; mkdir -p $R/scratch; cp /workspace/src/codex/scratch/*.* $R/scratch/
timeout 60 bash -c "mkdir -p $B/test; cp $S/*.py $S/*.sh $S/*.json $B/ 2>/dev/null; mkdir -p $B/scratch; cp /workspace/src/codex/scratch/*.* $B/scratch/; cp $S/test/kt.js $B/test/; true" || echo STOREFAIL >> /tmp/kstore.log
cd /workspace/learn && git add _src && (git diff --cached --quiet || git -c user.name=a1yamino -c user.email=a1yamino@users.noreply.github.com commit -qm "${1:-sync sources}") && (git pull -q --rebase --autostash || (git rebase --abort; false)) && git push -q && git log --oneline -1
