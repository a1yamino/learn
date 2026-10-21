#!/bin/bash
# copy course sources to repo _src/postgres and the persistent store, then commit+push _src
set -e
S=/workspace/pg-course; R=/workspace/learn/_src/postgres; B=/cursor/stores/store-c8ce1fd0-7a1f-4906-b5c2-3226ea6c13e6/backup/postgres-course
mkdir -p $R $B
cp $S/*.py $S/sync.sh $R/; cp $S/test/kt.js $R/
cp $S/*.py $S/sync.sh $B/; mkdir -p $B/test; cp $S/test/kt.js $B/test/
cd /workspace/learn && git add _src && (git diff --cached --quiet || git -c user.name=a1yamino -c user.email=a1yamino@users.noreply.github.com commit -qm "${1:-sync sources}") && git push -q && git log --oneline -1
