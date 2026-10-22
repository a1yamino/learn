#!/bin/bash
for N in $(seq ${START:-1} 24); do N=$(printf %02d $N); while [ ! -f /tmp/xready$N ]; do sleep 5; done
 ./pub.sh $N > /tmp/xpub$N.log 2>&1 || echo FAIL >> /tmp/xpub$N.log; done
