const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=120)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const cell=(i,c='')=>({w:46,h:40,cls:'blk '+c,html:String(i)});
const e={p:B('生产者','追加'),c0:cell(0),c1:cell(1),c2:cell(2),c3:cell(3),c4:cell(4),c5:cell(5,'sig'),a:B('消费者组 A','offset 2','',130),b:B('消费者组 B','offset 5','',130),n:P('','sig')};
const L={c0:[0,60],c1:[50,60],c2:[100,60],c3:[150,60],c4:[200,60]};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'日志',p:'一个分区就是一条只追加的日志，每条记录有递增的偏移量。',set:{...L}},
 {t:'追加',p:'生产者只能写到末尾，新记录得到偏移量 5。',d:3200,set:{...L,p:[300,0],c5:[250,60]}},
 {t:'各自的进度',p:'两个消费者组各自记录读到哪里，互不影响。',d:3600,set:{...L,c5:[250,60],a:[60,130],b:[220,130]}},
 {t:'不删除',p:'读过的记录仍然保留，可以重置偏移量重新读取；按保留策略过期后才删除。',d:3600,set:{...L,c5:[250,60],a:[0,130,B('消费者组 A','重置到 0','ok',130)],b:[220,130],n:[0,190,P('消费 ≠ 删除','ok')]}}]});
const e2={t:{w:460,h:180,cls:'frame',html:'<i>主题 orders</i>'},p0:B('分区 0','0 1 2 3','',140),p1:B('分区 1','0 1 2','',140),p2:B('分区 2','0 1 2 3 4','',140),c1:B('消费者 1','组 billing','ok',130),c2:B('消费者 2','组 billing','ok',130),d:B('消费者 X','组 dwh','sig',130)};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'分区',p:'主题由多个分区组成，各自独立编号。',set:{t:[0,0],p0:[20,30],p1:[20,80],p2:[20,130]}},
 {t:'组内分摊',p:'billing 组的两个消费者分摊三个分区：消费者 1 读分区 0、1，消费者 2 读分区 2。',d:4000,set:{t:[0,0],p0:[20,30],p1:[20,80],p2:[20,130],c1:[480,50],c2:[480,130]}},
 {t:'组间独立',p:'dwh 组的消费者独自读取全部三个分区。',d:3600,set:{t:[0,0],p0:[20,30],p1:[20,80],p2:[20,130],c1:[480,50],c2:[480,130],d:[220,200]}}]});
(()=>{const parts=[[],[],[]];const h=s=>{let x=0;for(const c of s)x=(x*31+c.charCodeAt(0))>>>0;return x%3};const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');let n=0;
 const show=()=>{p.textContent=parts.map((a,i)=>`分区 ${i}: `+a.map((v,j)=>`[${j}] ${v}`).join('  ')).join('\n')};
 const send=(k,v)=>{const i=k?h(k):n%3;n++;parts[i].push((k||'null')+':'+v);show();m.className='msg ok';m.innerHTML=k?`key=${k} → 分区 ${i}（相同 key 总是同一个分区）`:'没有 key：粘性分区器把一批消息发到同一个分区，再换下一个。'};
 [['o1 created',()=>send('o1','created')],['o2 created',()=>send('o2','created')],['o1 paid',()=>send('o1','paid')],['o3 created',()=>send('o3','created')],['o1 shipped',()=>send('o1','shipped')],['无 key',()=>send(null,'ping')]].forEach(([t,f])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',f);q.appendChild(b)});
 show();m.className='msg';m.innerHTML='演示用简单哈希；Kafka 默认分区器用 murmur2(key) % 分区数。'})();
Term(document.getElementById('t4'),[
['bin/kafka-topics.sh --bootstrap-server localhost:9092 --list','__consumer_offsets\norders','内部主题 __consumer_offsets 保存消费者组的偏移量。'],
['bin/kafka-topics.sh --bootstrap-server localhost:9092 --describe --topic orders','Topic: orders\tTopicId: 3vQ…\tPartitionCount: 3\tReplicationFactor: 1\tConfigs: \n\tTopic: orders\tPartition: 0\tLeader: 1\tReplicas: 1\tIsr: 1\n\tTopic: orders\tPartition: 1\tLeader: 1\tReplicas: 1\tIsr: 1\n\tTopic: orders\tPartition: 2\tLeader: 1\tReplicas: 1\tIsr: 1','每个分区的 Leader、副本和同步副本（ISR）。'],
['bin/kafka-get-offsets.sh --bootstrap-server localhost:9092 --topic orders','orders:0:1\norders:1:0\norders:2:2','每个分区的末尾偏移量（下一条消息将得到的编号）。'],
['bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --list','console-consumer-48213','控制台消费者每次会创建一个临时组。'],
['bin/kafka-metadata-quorum.sh --bootstrap-server localhost:9092 describe --status','ClusterId: 5L6g3nShT-eMCtK--X86sw\nLeaderId: 1\nLeaderEpoch: 1\n…\nCurrentVoters: [{"id": 1, …}]','KRaft 控制器的状态：单节点时它既是 Broker 也是控制器。']]);
Quiz(document.getElementById('qs'),[
['Kafka 保证顺序的范围？',['整个主题','单个分区内','整个集群'],1,''],
['两个不同的消费者组读同一主题？',['平分消息','各自读到全部消息','只有一个能读'],1,''],
['组内消费者多于分区数时？',['多出的消费者空闲','自动增加分区','报错'],0,''],
['消息被消费后会怎样？',['立即删除','保留到按策略过期','移到死信'],1,''],
['Kafka 4.x 的元数据管理方式？',['ZooKeeper','KRaft','etcd'],1,'']]);
