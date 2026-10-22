#!/bin/bash
# copy course sources to repo _src/cleancode and the persistent store, then commit+push _src
set -e
S=/workspace/cleancode-course; R=/workspace/learn/_src/cleancode; B=/cursor/stores/store-c8ce1fd0-7a1f-4906-b5c2-3226ea6c13e6/backup/cleancode-course
mkdir -p $R
cp $S/*.py $S/*.sh $R/; cp $S/*.json $R/ 2>/dev/null || true; cp $S/test/kt.js $R/
timeout 60 bash -c "mkdir -p $B/test; cp $S/*.py $S/*.sh $B/; cp $S/*.json $B/ 2>/dev/null; true; cp $S/test/kt.js $B/test/" || echo STOREFAIL >> /tmp/kstore.log
cd /workspace/learn && git add _src && (git diff --cached --quiet || git -c user.name=a1yamino -c user.email=a1yamino@users.noreply.github.com commit -qm "${1:-sync sources}") && (git pull -q --rebase --autostash || (git rebase --abort; false)) && git push -q && git log --oneline -1
