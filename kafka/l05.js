const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=130)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={p:B('生产者',''),l:B('Leader','写入日志'),f1:B('Follower 1',''),f2:B('Follower 2',''),a0:P('acks=0：发出即算成功','bad'),a1:P('acks=1：Leader 写入后确认','sig'),aa:P('acks=all：ISR 全部写入后确认','ok')};
const N={p:[0,60],l:[180,60],f1:[360,0],f2:[360,120]};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'acks=0',p:'不等待任何响应。连网络错误都无法感知。',set:{...N,a0:[0,190]}},
 {t:'acks=1',p:'Leader 写入本地日志（页缓存）就返回。Follower 复制前 Leader 宕机，新 Leader 上没有这条消息。',d:4000,set:{...N,l:[180,60,B('Leader','已写入','ok')],a1:[0,190]}},
 {t:'acks=all',p:'Follower 拉取并写入后，Leader 的高水位前进，才返回成功。',d:4200,set:{...N,l:[180,60,B('Leader','已写入','ok')],f1:[360,0,B('Follower 1','已复制','ok')],f2:[360,120,B('Follower 2','已复制','ok')],aa:[0,190]}}]});
(()=>{let acks='all',mir=2,down=0;const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 const upd=()=>{const isr=3-down;let r,c;if(acks==='all'){if(isr<mir){r='写入失败：NotEnoughReplicas（ISR '+isr+' < '+mir+'）';c='bad'}else{r='写入成功，消息至少在 '+Math.max(isr,1)+' 个副本上（保证至少 '+mir+' 个）';c='ok'}}else{r=isr>0?'写入成功，但确认时只保证在 Leader 上；Leader 磁盘损坏就会丢失':'无可用 Leader，写入失败';c=isr>0?'sig':'bad'}
 p.textContent=`acks=${acks}  min.insync.replicas=${mir}\n故障 Broker：${down}，ISR 大小：${isr}\n→ ${r}`;m.className='msg '+c;m.innerHTML=acks==='all'?`可写入的最大故障数：${3-mir}；已确认的消息可以承受 ${mir-1} 个副本丢失。`:'acks=1 时 min.insync.replicas 不起作用。';q.querySelectorAll('.btn').forEach(b=>b.classList.toggle('pri',[ 'a'+acks,'m'+mir,'d'+down].includes(b.dataset.k)))};
 [['acks=1','a1',()=>acks='1'],['acks=all','aall',()=>acks='all'],['min.insync 1','m1',()=>mir=1],['min.insync 2','m2',()=>mir=2],['min.insync 3','m3',()=>mir=3],['0 个故障','d0',()=>down=0],['1 个故障','d1',()=>down=1],['2 个故障','d2',()=>down=2]].forEach(([t,k,f])=>{const b=document.createElement('button');b.className='btn';b.dataset.k=k;b.textContent=t;b.addEventListener('click',()=>{f();upd()});q.appendChild(b)});upd()})();
const e2={p:B('生产者','PID 1000'),b:B('Broker','P0 已有 seq 0–4'),s:P('发送批次 seq 5','sig'),x:P('Broker 写入成功，但响应在网络中丢失','bad'),r:P('超时 → 重发 seq 5','sig'),d1:P('无幂等：再写一次 → 重复','bad'),d2:P('幂等：seq 5 已存在 → 直接返回成功，不再写','ok'),o:P('seq 7 到达而期望 6 → OutOfOrderSequence，等待重试','sig')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'发送',p:'每个批次带有 PID 和该分区内递增的序列号。',set:{p:[0,0],b:[300,0],s:[0,70]}},
 {t:'响应丢失',p:'Broker 已写入，但生产者没收到确认。',d:3200,set:{p:[0,0],b:[300,0,B('Broker','P0 已有 seq 0–5','ok')],s:[0,70],x:[0,110]}},
 {t:'重试',p:'生产者重发同一批次。',d:3000,set:{p:[0,0],b:[300,0,B('Broker','P0 已有 seq 0–5','ok')],r:[0,70]}},
 {t:'去重',p:'Broker 记得每个 PID+分区最近 5 个批次的序列号，识别出重复。',d:4000,set:{p:[0,0],b:[300,0,B('Broker','P0 已有 seq 0–5','ok')],r:[0,70],d1:[0,110],d2:[0,150]}},
 {t:'顺序',p:'跳号的批次被拒绝，保证在途请求重试时也不乱序。',d:3600,set:{p:[0,0],b:[300,0],o:[0,70]}}]});
Term(document.getElementById('t4'),[
['bin/kafka-configs.sh $B --entity-type brokers --entity-default --alter --add-config min.insync.replicas=2','Completed updating default config for brokers in the cluster.','集群默认值，主题级配置优先。'],
['bin/kafka-configs.sh $B --entity-type topics --entity-name pay --describe','Dynamic configs for topic pay are:\n  min.insync.replicas=2 …','查看主题配置。'],
['bin/kafka-console-producer.sh $B --topic pay --producer-property enable.idempotence=false --producer-property acks=1','>','关闭幂等（不推荐，演示用）。'],
['bin/kafka-transactions.sh $B describe-producers --topic pay --partition 0','ProducerId ProducerEpoch LatestCoordinatorEpoch LastSequence LastTimestamp …\n1000       0             -1                     0            1761124900123','Broker 为每个 PID 保存的序列号状态。']]);
Quiz(document.getElementById('qs'),[
['副本因子 3、min.insync.replicas=2、acks=all，能容忍几个副本故障仍可写？',['0','1','2'],1,''],
['acks=1 的风险？',['写入慢','Leader 在复制前宕机会丢失','乱序'],1,''],
['幂等生产者在 Broker 端靠什么去重？',['消息内容哈希','PID + 分区 + 序列号','key'],1,''],
['应用重启后重发同一条业务消息，幂等能去重吗？',['能','不能，PID 变了','只在同一分区能'],1,''],
['delivery.timeout.ms 控制什么？',['单次请求超时','从 send() 到最终成功或失败的总时间','重试间隔'],1,'']]);
