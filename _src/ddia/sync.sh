#!/bin/bash
# copy course sources to repo _src/ddia and the persistent store, then commit+push _src
set -e
S=/workspace/ddia-course; R=/workspace/learn/_src/ddia; B=/cursor/stores/store-c8ce1fd0-7a1f-4906-b5c2-3226ea6c13e6/backup/ddia-course
mkdir -p $R
cp $S/*.py $S/*.sh $R/; cp $S/test/kt.js $R/
timeout 60 bash -c "mkdir -p $B/test; cp $S/*.py $S/*.sh $B/; cp $S/test/kt.js $B/test/" || echo STOREFAIL >> /tmp/kstore.log
cd /workspace/learn && git add _src && (git diff --cached --quiet || git -c user.name=a1yamino -c user.email=a1yamino@users.noreply.github.com commit -qm "${1:-sync sources}") && git push -q && git log --oneline -1
