#!/bin/bash
for N in $(seq ${START:-1} 28); do N=$(printf %02d $N); while [ ! -f /tmp/dready$N ]; do sleep 5; done
 ./pub.sh $N > /tmp/dpub$N.log 2>&1 || echo FAIL >> /tmp/dpub$N.log; done
