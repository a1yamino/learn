#!/bin/bash
# pub.sh N : build lesson N, update index, local test, sync sources, push site, verify live
set -e
N=$1; cd /workspace/kafka-course
python3 build.py $N; python3 index.py $((10#$N))
timeout 30 cp /workspace/learn/kafka/l$N.js /cursor/stores/store-c8ce1fd0-7a1f-4906-b5c2-3226ea6c13e6/backup/kafka-course/ || echo STOREFAIL $N >> /tmp/kstore.log
cd /workspace/learn; (python3 -m http.server 8765 >/dev/null 2>&1 &); sleep 1
cd /workspace/kafka-course/test; for t in 1 2 3 4 5 6; do r=$(timeout 250 node kt.js http://localhost:8765/ $N 2>&1|tail -1); [[ $r == errors* ]] && break; sleep 3; done
pkill -f "http.server 8765" || true; echo "LOCAL $r"; [[ $r == 'errors []' ]] || exit 1
/workspace/kafka-course/sync.sh "Kafka l$N sources"
cd /workspace/learn; if git status --short | grep -i 'manifest\|publish\|managekey'; then echo SECRET; exit 1; fi
git add -A; git diff --cached --quiet || git -c user.name=a1yamino -c user.email=a1yamino@users.noreply.github.com commit -qm "Kafka lesson $N"; git push -q
SHA=$(git rev-parse --short=7 HEAD); sleep 45
for i in $(seq 1 20); do s=$(gh api repos/a1yamino/learn/pages/builds/latest --jq '.status+" "+.commit[0:7]'); [[ $s == "built $SHA" ]] && break; sleep 15; done; echo "PAGES $s"; sleep 90
echo "CURL $(curl -s https://a1yamino.github.io/learn/kafka/l$N.html | grep -c 'id="p1"')"
cd /workspace/kafka-course/test; for t in 1 2 3 4 5 6 7 8; do r=$(timeout 250 node kt.js https://a1yamino.github.io/learn/ $N 2>&1|tail -1); [[ $r == errors* ]] && break; sleep 5; done; echo "LIVE $N $r"
