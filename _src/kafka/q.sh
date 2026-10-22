#!/bin/bash
for N in $(seq ${START:-1} 24); do N=$(printf %02d $N); while [ ! -f /tmp/kready$N ]; do sleep 5; done
 ./pub.sh $N > /tmp/kpub$N.log 2>&1 || echo FAIL >> /tmp/kpub$N.log; done
