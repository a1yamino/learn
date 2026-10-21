#!/bin/bash
while pgrep -f "pub.sh 0[78]" >/dev/null; do sleep 5; done
for N in $(seq -w 9 26); do N=$(printf %02d $((10#$N))); while [ ! -f /tmp/ready$N ]; do sleep 5; done
 ./pub.sh $N > /tmp/pub$N.log 2>&1 || echo FAIL >> /tmp/pub$N.log; done
