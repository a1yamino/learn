#!/bin/bash
for N in $(seq 1 24); do N=$(printf %02d $N); while [ ! -f /tmp/rready$N ]; do sleep 5; done
 ./pub.sh $N > /tmp/rpub$N.log 2>&1 || echo FAIL >> /tmp/rpub$N.log; done
