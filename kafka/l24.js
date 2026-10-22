const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=130)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={os:B('订单服务','Outbox + Debezium'),oe:B('order-events','key = 订单号','ok',140),inv:B('库存服务','Streams EOS'),ie:B('inventory-events','','ok',140),pay:B('支付服务',''),pe:B('payment-events','','ok',140),st:B('order-state','压缩主题','sig',140),no:B('通知服务','只读'),mx:B('指标','Streams 窗口'),dl:B('*-dlt','死信','bad',100)};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'订单事件',p:'订单服务通过 Outbox 发布事件。',set:{os:[0,0],oe:[160,0]}},
 {t:'库存与支付',p:'库存和支付服务消费订单事件，发布各自的事件。',d:3400,set:{os:[0,0],oe:[160,0],inv:[330,0],ie:[330,70],pay:[0,140],pe:[160,140]}},
 {t:'状态与只读消费者',p:'订单服务汇总事件更新 order-state；通知和指标只读。',d:3600,set:{os:[0,0],oe:[160,0],inv:[330,0],ie:[330,70],pay:[0,140],pe:[160,140],st:[0,70],no:[330,140],mx:[160,210]}},
 {t:'错误',p:'每个消费者组都有自己的死信主题。',d:3200,set:{os:[0,0],oe:[160,0],inv:[330,0],ie:[330,70],pay:[0,140],pe:[160,140],st:[0,70],no:[330,140],mx:[160,210],dl:[330,210]}}]});
const s=(t,c='')=>B(t,'',c,120);
const e2={a:s('OrderCreated'),b:s('StockReserved'),c:s('PaymentSucceeded'),d:s('OrderPaid'),x:s('StockRejected'),y:s('OrderCancelled')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'下单',p:'订单服务发布 OrderCreated。',set:{a:[0,40]}},
 {t:'预留库存',p:'库存服务预留成功。',d:2800,set:{a:[0,40,s('OrderCreated','ok')],b:[140,0]}},
 {t:'支付',p:'支付服务收款成功。',d:2800,set:{a:[0,40,s('OrderCreated','ok')],b:[140,0,s('StockReserved','ok')],c:[280,0]}},
 {t:'完成',p:'订单服务把订单标记为已支付。',d:2800,set:{a:[0,40,s('OrderCreated','ok')],b:[140,0,s('StockReserved','ok')],c:[280,0,s('PaymentSucceeded','ok')],d:[420,0,s('OrderPaid','ok')]}},
 {t:'另一条路径',p:'库存不足：库存服务发布拒绝事件，订单服务取消订单（补偿）。',d:3600,set:{a:[0,40,s('OrderCreated','ok')],b:[140,0,s('StockReserved','ok')],c:[280,0,s('PaymentSucceeded','ok')],d:[420,0,s('OrderPaid','ok')],x:[140,90,s('StockRejected','bad')],y:[280,90,s('OrderCancelled','bad')]}}]});
(()=>{const C=[['RF=3, min.insync.replicas=2','第 9 课'],['生产者 acks=all + 幂等','第 5 课'],['订单事件以订单号为 key；库存扣减用条件更新/行锁（或按 SKU 重分区）','第 4 课'],['消费者处理后提交 + 按事件 ID 幂等','第 8 课'],['库存服务 exactly_once_v2','第 11、16 课'],['Outbox + CDC，而不是双写','第 21 课'],['每个组都有 DLQ 并告警','第 23 课'],['Schema Registry 兼容性 BACKWARD','第 13 课'],['lag、URP、控制器告警','第 18 课'],['SASL_SSL + ACL 最小权限','第 19 课']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');const on=new Set();
 const draw=()=>{p.textContent=C.map(([t,l],i)=>(on.has(i)?'[x] ':'[ ] ')+t+'  ('+l+')').join('\n');const n=on.size;m.className='msg '+(n===C.length?'ok':'sig');m.innerHTML=n===C.length?'教材检查项已勾选；仍需完成容量压测、故障演练与业务验收。':`已完成 ${n}/${C.length}。`};
 C.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=t.split(' ')[0].slice(0,14);b.title=t;b.addEventListener('click',()=>{on.has(i)?on.delete(i):on.add(i);b.classList.toggle('pri',on.has(i));draw()});q.appendChild(b)});draw()})();
Term(document.getElementById('t4'),[
['bin/kafka-topics.sh $B --create --topic order-events --partitions 12 --replication-factor 3 --config min.insync.replicas=2 --config retention.ms=604800000','Created topic order-events.','事件主题。'],
['acks=all\nenable.idempotence=true\ncompression.type=zstd\nlinger.ms=10','（生产者配置）','可靠且高效。'],
['group.protocol=consumer\nenable.auto.commit=false\nisolation.level=read_committed\nmax.poll.records=200','（消费者配置）','新再平衡协议；只读已提交的事务数据。'],
['processing.guarantee=exactly_once_v2\nreplication.factor=3\nnum.standby.replicas=1','（Streams 配置）','精确一次 + 备用副本加快故障恢复。']]);
Quiz(document.getElementById('qs'),[
['为什么所有订单相关事件用订单号作 key？',['负载均衡','各主题内同一订单有序，跨主题由订单状态机校验','压缩更好'],1,''],
['订单服务应如何发布事件？',['事务提交后直接 send','Outbox + CDC','定时全表扫描'],1,''],
['库存服务防止重启后重复预留？',['exactly_once_v2 / 事务','acks=1','增加分区'],0,''],
['分区数主要由什么决定？',['broker 数','目标吞吐与消费并行度','副本数'],1,''],
['库存不足时订单如何回退？',['分布式事务回滚','发布补偿事件取消订单','删除消息'],1,'']]);
