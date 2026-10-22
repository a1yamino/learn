#!/bin/bash
for N in $(seq ${START:-1} 20); do N=$(printf %02d $N); while [ ! -f /tmp/cready$N ]; do sleep 5; done
 ./pub.sh $N > /tmp/cpub$N.log 2>&1 || echo FAIL >> /tmp/cpub$N.log; done
