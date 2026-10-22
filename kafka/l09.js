const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=160)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={l:B('Leader','LEO 10'),f1:B('Follower 1','LEO 10'),f2:B('Follower 2','LEO 10'),hw:P('HW = min(LEO of ISR) = 10','sig'),p:P('生产者写入 10–14（acks=all）','sig'),c:P('消费者只能读到 HW 之前','sig'),ok:P('HW 前进到 15 → 向生产者确认','ok')};
const N={l:[0,0],f1:[0,60],f2:[0,120]};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'初始',p:'三个副本的 LEO 相同，HW = 10。',set:{...N,hw:[200,60]}},
 {t:'写入 Leader',p:'Leader 追加 5 条，LEO = 15；HW 仍是 10，消费者看不到新消息，生产者在等待。',d:3800,set:{...N,l:[0,0,B('Leader','LEO 15','sig')],hw:[200,60],p:[200,0],c:[200,120]}},
 {t:'Follower 拉取',p:'Follower 1 拉取后 LEO = 15；Follower 2 只拉到 13。HW = min(15,15,13) = 13。',d:4000,set:{...N,l:[0,0,B('Leader','LEO 15','sig')],f1:[0,60,B('Follower 1','LEO 15','sig')],f2:[0,120,B('Follower 2','LEO 13','sig')],hw:[200,60,P('HW = 13','sig')]}},
 {t:'提交',p:'Follower 2 也追上，HW = 15，Leader 向生产者确认，消费者可以读到 10–14。',d:3800,set:{...N,l:[0,0,B('Leader','LEO 15','ok')],f1:[0,60,B('Follower 1','LEO 15','ok')],f2:[0,120,B('Follower 2','LEO 15','ok')],ok:[200,60]}}]});
(()=>{let leo=[100,100,100],isr=[1,1,1],alive=[1,1,1],lead=0;const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 const hw=()=>Math.min(...leo.filter((_,i)=>isr[i]));
 const show=(t,c='sig')=>{p.textContent=[0,1,2].map(i=>`副本 ${i+1}${i===lead?'（Leader）':''}: LEO ${leo[i]} ${alive[i]?'':'宕机'} ${isr[i]?'∈ ISR':''}`).join('\n')+`\nISR = {${[0,1,2].filter(i=>isr[i]).map(i=>i+1).join(',')}}  HW = ${hw()}`;m.className='msg '+c;m.innerHTML=t};
 const A=[['写入 10 条',()=>{if(isr.filter(x=>x).length<2)return show('ISR 小于 min.insync.replicas=2，acks=all 写入被拒绝','bad');leo[lead]+=10;show('Leader LEO 前进；HW 要等 ISR 中的 Follower 追上。')}],
 ['Follower 拉取',()=>{for(let i=0;i<3;i++)if(i!==lead&&alive[i])leo[i]=leo[lead];[0,1,2].forEach(i=>{if(alive[i]&&leo[i]===leo[lead])isr[i]=1});show('存活的 Follower 追上 Leader，HW 前进。','ok')}],
 ['副本 3 变慢（超过 30 秒）',()=>{if(lead===2)return show('副本 3 是 Leader');isr[2]=0;show('副本 3 被移出 ISR，HW 不再等它。','sig')}],
 ['Leader 宕机',()=>{alive[lead]=0;isr[lead]=0;const c=[0,1,2].find(i=>alive[i]&&isr[i]);if(c===undefined)return show('ISR 中没有存活副本：分区不可用（unclean 选举关闭）','bad');lead=c;show(`控制器从 ISR 中选出副本 ${c+1} 为新 Leader。HW 之前的数据都在它上面。`,'ok')}],
 ['全部恢复',()=>{alive=[1,1,1];for(let i=0;i<3;i++)leo[i]=leo[lead];isr=[1,1,1];show('恢复的副本截断多余部分、追上数据后回到 ISR。','ok')}]];
 A.forEach(([t,f])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',f);q.appendChild(b)});show('点击事件。')})();
const e2={a:B('副本 A（旧 Leader）','epoch 1：0–11','',200),b:B('副本 B','epoch 1：0–9','',200),x:P('A 写入了 10、11，B 还没复制，A 宕机','bad'),nb:P('B 成为 Leader，epoch 2 从偏移量 10 开始，写入新的 10、11、12','sig'),q:P('A 恢复：询问 B “epoch 1 在你那里结束于？” → 10','sig'),t:P('A 截断到 10，再从 B 复制新的 10–12：两个副本一致','ok')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'分歧',p:'A 的 10、11 尚未被复制（未超过 HW，生产者没有收到确认）。',set:{a:[0,0],b:[240,0],x:[0,60]}},
 {t:'新 Leader',p:'B 当选，epoch 变为 2，并记录 epoch 2 的起始偏移量 10。',d:3800,set:{a:[0,0,B('副本 A','宕机','bad',200)],b:[240,0,B('副本 B（Leader）','epoch 2：10–12','ok',200)],nb:[0,60]}},
 {t:'询问',p:'A 以 Follower 身份恢复，发送 OffsetsForLeaderEpoch 请求。',d:3600,set:{a:[0,0],b:[240,0,B('副本 B（Leader）','epoch 2：10–12','ok',200)],q:[0,60]}},
 {t:'截断',p:'A 删除自己的 10、11（从未被确认），从 B 复制。没有已提交数据丢失，也没有不一致。',d:3800,set:{a:[0,0,B('副本 A','0–9 + epoch 2：10–12','ok',200)],b:[240,0,B('副本 B（Leader）','epoch 2：10–12','ok',200)],t:[0,60]}}]});
Term(document.getElementById('t4'),[
['bin/kafka-topics.sh $B --describe --under-replicated-partitions','（ISR 小于副本数的分区）','最重要的健康指标之一（UnderReplicatedPartitions）。'],
['bin/kafka-topics.sh $B --describe --at-min-isr-partitions','（ISR 恰好等于 min.insync.replicas 的分区）','再失去一个副本就无法写入。'],
['bin/kafka-configs.sh $B --entity-type topics --entity-name rep --alter --add-config unclean.leader.election.enable=true','Completed updating config for topic rep.','仅在接受丢数据换取可用性时使用。'],
['bin/kafka-get-offsets.sh $B --topic rep --time -1','rep:0:11000','返回的末尾偏移量是 Leader 的高水位，而不是 LEO。'],
['bin/kafka-run-class.sh org.apache.kafka.tools.JmxTool --object-name kafka.server:type=ReplicaManager,name=IsrShrinksPerSec --jmx-url service:jmx:rmi:///jndi/rmi://k1:9999/jmxrmi','…','ISR 收缩速率（需开启 JMX）。']]);
Quiz(document.getElementById('qs'),[
['高水位 HW 的定义？',['Leader 的 LEO','ISR 中所有副本 LEO 的最小值','所有副本 LEO 的最大值'],1,''],
['消费者为什么只能读到 HW 之前？',['性能','保证 Leader 切换后读到的消息不会消失','节省带宽'],1,''],
['Follower 何时被移出 ISR？',['超过 replica.lag.time.max.ms 没有追上','落后 1 条','重启时'],0,''],
['Leader epoch 用于？',['选举投票','故障恢复时正确截断日志','计算 HW'],1,''],
['unclean.leader.election.enable=true 的代价？',['延迟增加','可能丢失已提交的消息','无法读取'],1,'']]);
