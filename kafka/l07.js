const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=150)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={c1:B('C1','P0 P1 P2'),c2:B('C2','P3 P4 P5'),c3:B('C3（新）','—'),eg:P('急切：所有人撤销全部分区 → 全组停顿 → 重新分配','bad'),co:P('协作：只撤销需要移动的 P2、P5；其他分区继续消费','ok')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'加入',p:'C3 加入组，需要重新分配。',set:{c1:[0,0],c2:[170,0],c3:[340,0]}},
 {t:'急切',p:'经典协议的急切模式：所有成员在 JoinGroup 前撤销全部分区，直到 SyncGroup 完成，没有任何分区在被消费。',d:4200,set:{c1:[0,0,B('C1','（全部撤销）','bad')],c2:[170,0,B('C2','（全部撤销）','bad')],c3:[340,0],eg:[0,70]}},
 {t:'协作：第一轮',p:'协作模式：第一轮算出新分配后，C1、C2 只撤销要交出的分区，保留其余分区继续消费。',d:4200,set:{c1:[0,0,B('C1','P0 P1（交出 P2）','sig')],c2:[170,0,B('C2','P3 P4（交出 P5）','sig')],c3:[340,0],co:[0,70]}},
 {t:'协作：第二轮',p:'第二轮把被释放的分区分给 C3。',d:3600,set:{c1:[0,0,B('C1','P0 P1','ok')],c2:[170,0,B('C2','P3 P4','ok')],c3:[340,0,B('C3（新）','P2 P5','ok')],co:[0,70]}}]});
const e2={gc:B('组协调器','计算目标分配','sig',170),m1:B('C1','epoch 5'),m2:B('C2','epoch 5'),m3:B('C3（新）','加入'),h:P('C3 心跳：订阅 jobs','sig'),t:P('新的目标分配（epoch 6）：C1 {0,1} C2 {3,4} C3 {2,5}','sig'),r:P('C1 心跳得知需交出 P2 → 撤销后确认','sig'),g:P('P2 释放后 C3 的心跳领取 P2；C2、P5 同理，各自独立进行','ok')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'加入',p:'没有 JoinGroup/SyncGroup。新成员只是发送心跳上报自己的订阅。',set:{gc:[170,0],m1:[0,100],m2:[170,100],m3:[340,100],h:[0,170]}},
 {t:'计算',p:'协调器用服务端分配器（uniform/range）计算新的目标分配，组 epoch 加 1。',d:3800,set:{gc:[170,0],m1:[0,100],m2:[170,100],m3:[340,100],t:[0,170]}},
 {t:'撤销',p:'每个成员在下一次心跳中得知自己的目标，只撤销需要交出的分区。',d:3800,set:{gc:[170,0],m1:[0,100,B('C1','P0 P1','sig')],m2:[170,100],m3:[340,100],r:[0,170]}},
 {t:'领取',p:'分区被前一个持有者释放后才会分给新成员，保证同一时刻只有一个成员处理它。其他成员的消费从未停顿。',d:4200,set:{gc:[170,0],m1:[0,100,B('C1','P0 P1 · epoch 6','ok')],m2:[170,100,B('C2','P3 P4 · epoch 6','ok')],m3:[340,100,B('C3','P2 P5 · epoch 6','ok')],g:[0,170]}}]});
(()=>{const S={'Range':[['C1: A0 A1  B0 B1','C2: A2  B2'],['C1: A0  B0','C2: A1  B1','C3: A2  B2'],'按主题分段，多主题时第一个成员分得多。加入 C3 时大部分分区换了主人（A1、B1 从 C1 移到 C2，A2、B2 从 C2 移到 C3）。','sig'],'RoundRobin':[['C1: A0 A2 B1','C2: A1 B0 B2'],['C1: A0 B0','C2: A1 B1','C3: A2 B2'],'更均匀，但重新分配时不考虑原来的归属，移动很多。','sig'],'CooperativeSticky':[['C1: A0 A2 B1','C2: A1 B0 B2'],['C1: A0 B1','C2: A1 B0','C3: A2 B2'],'尽量保留原分配，只移动 A2、B2，并以协作方式进行。','ok'],'uniform（KIP-848）':[['C1: A0 A2 B1','C2: A1 B0 B2'],['C1: A0 B1','C2: A1 B0','C3: A2 B2'],'服务端分配器，均匀且粘性；成员独立增量调整。','ok']};
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Object.keys(S).forEach(k=>{const b=document.createElement('button');b.className='btn';b.textContent=k;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));const s=S[k];p.textContent='两个消费者：\n  '+s[0].join('\n  ')+'\n加入 C3 后：\n  '+s[1].join('\n  ');m.className='msg '+s[3];m.innerHTML=s[2]});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择分配策略。'})();
Term(document.getElementById('t4'),[
['bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group n1 --state --verbose','GROUP COORDINATOR (ID) ASSIGNMENT-STRATEGY STATE GROUP-EPOCH TARGET-ASSIGNMENT-EPOCH #MEMBERS\nn1    localhost:9092 (1) uniform Stable 3 3 2','新协议组的 epoch。'],
['grep -i "revok\\|assign" app.log | tail -n 3','… Revoked partitions: [jobs-2]\n… Assigned partitions: [jobs-0, jobs-1]','在应用日志中观察 ConsumerRebalanceListener 的回调。'],
['bin/kafka-configs.sh --bootstrap-server localhost:9092 --entity-type groups --entity-name n1 --alter --add-config consumer.session.timeout.ms=60000','Completed updating config for group n1.','新协议下按组覆盖会话超时。'],
['bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --delete --group s1','Deletion of requested consumer groups (\'s1\') was successful.','删除没有活跃成员的组。']]);
Quiz(document.getElementById('qs'),[
['急切再平衡的主要问题？',['全组停止消费','分配不均','丢消息'],0,''],
['静态成员（group.instance.id）解决什么？',['重启时不触发再平衡','提升吞吐','保证顺序'],0,''],
['KIP-848 中分配在哪里计算？',['组 Leader 客户端','Broker 上的组协调器','控制器'],1,''],
['新协议用哪个配置开启？',['group.protocol=consumer','enable.kip848=true','partition.assignment.strategy=uniform'],0,''],
['协作再平衡分几轮完成移动？',['一轮','两轮','三轮'],1,'']]);
