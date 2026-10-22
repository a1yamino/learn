const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=150)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={t:B('任务 1_0','count()'),db:B('RocksDB','a=2','',130),cl:B('changelog 主题','压缩','sig',150),in:P('输入 a','sig'),up:P('读本地值 2 → 写 3 → 同时发送 a=3 到 changelog','sig'),x:P('实例宕机，本地磁盘丢失','bad'),rs:P('新实例从 changelog 恢复 RocksDB，再继续处理','ok'),sb:P('有备用副本时：备用实例一直在追 changelog，接管几乎无需恢复','ok')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'本地状态',p:'任务的计数保存在本地 RocksDB。',set:{t:[0,0],db:[180,0],in:[0,70]}},
 {t:'写入',p:'更新本地状态的同时写入变更日志主题。',d:3600,set:{t:[0,0],db:[180,0,B('RocksDB','a=3','ok',130)],cl:[330,0],up:[0,70]}},
 {t:'故障',p:'任务迁移到另一个实例。',d:3000,set:{t:[0,0,B('任务 1_0','宕机','bad')],cl:[330,0],x:[0,70]}},
 {t:'恢复',p:'从变更日志读取，重建本地状态。状态越大恢复越慢。',d:3600,set:{t:[0,0,B('任务 1_0','新实例','ok')],db:[180,0,B('RocksDB','恢复中…','sig',130)],cl:[330,0],rs:[0,70],sb:[0,110]}}]});
(()=>{const ev=[['12:00:10',0],['12:00:40',0],['12:01:05',1],['12:00:50（迟到）',0],['12:02:10',2],['12:01:20（迟到）',1],['12:00:55（迟到太久）',0]];let n=0,st=-1;const cnt={},drop=[];const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 const tsec=s=>{const [h,mi,se]=s.slice(0,8).split(':').map(Number);return mi*60+se};
 const show=()=>{p.textContent=Object.keys(cnt).sort().map(w=>`窗口 [12:0${w}:00, 12:0${+w+1}:00)  计数 ${cnt[w]}  ${(st>=(+w+1)*60+30)?'已关闭':'开放'}`).join('\n')+`\n流时间：${st<0?'—':'12:0'+Math.floor(st/60)+':'+String(st%60).padStart(2,'0')}\n丢弃：${drop.join(', ')||'无'}`};
 const next=()=>{if(n>=ev.length)return;const [s,w]=ev[n++];const t=tsec(s);st=Math.max(st,t);const closeAt=(w+1)*60+30;if(st>=closeAt&&t<(w+1)*60+30&&st>t&&st>=closeAt&&s.includes('迟到')&&st>=closeAt){drop.push(s);show();m.className='msg bad';m.innerHTML=`${s}：流时间已超过窗口结束 + 宽限期，记录被丢弃。`;return}cnt[w]=(cnt[w]||0)+1;show();m.className='msg '+(s.includes('迟到')?'sig':'ok');m.innerHTML=s.includes('迟到')?`${s}：迟到但仍在宽限期内，计入窗口 ${w}。`:`${s} 计入窗口 ${w}。`};
 [['下一个事件',next],['重置',()=>{n=0;st=-1;for(const k in cnt)delete cnt[k];drop.length=0;show();m.className='msg';m.innerHTML='流时间 = 已见过的最大事件时间。'}]].forEach(([t,f])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',f);q.appendChild(b)});
 show();m.className='msg';m.innerHTML='流时间 = 已见过的最大事件时间。'})();
const e2={ss:B('KStream–KStream','订单 ⋈ 支付，5 分钟窗口','',220),st:B('KStream–KTable','订单 + 用户当前等级','',220),tt:B('KTable–KTable','用户 ⋈ 账户，结果是表','',220),n1:P('两边都是事件：必须有时间窗口，两边都缓存在窗口存储中','sig'),n2:P('只有流的记录触发输出；表的更新不触发，只改变以后的关联结果','sig'),n3:P('任一边更新都会产生新的结果行','sig'),cp:P('共分区：两边 key 相同、分区数相同（GlobalKTable 例外）','ok')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'流—流',p:'例如订单与支付在 5 分钟内匹配。',set:{ss:[0,0],n1:[240,10]}},
 {t:'流—表',p:'例如订单流补充用户等级：查的是订单到达那一刻的表值。',d:3800,set:{ss:[0,0],n1:[240,10],st:[0,60],n2:[240,70]}},
 {t:'表—表',p:'两个状态的关联，结果随任一边变化。',d:3600,set:{ss:[0,0],n1:[240,10],st:[0,60],n2:[240,70],tt:[0,120],n3:[240,130]}},
 {t:'共分区',p:'连接在任务内进行，同一个 key 的两边数据必须在同一个任务里。',d:3400,set:{ss:[0,0],st:[0,60],tt:[0,120],cp:[0,190]}}]});
Term(document.getElementById('t4'),[
['stream.groupByKey().count(Materialized.as("counts"))','KTable<String, Long>','按 key 计数，状态存储名为 counts。'],
['stream.groupByKey().windowedBy(TimeWindows.ofSizeAndGrace(Duration.ofMinutes(1), Duration.ofSeconds(30))).count()','KTable<Windowed<String>, Long>','滚动窗口计数。'],
['stream.groupByKey().windowedBy(SessionWindows.ofInactivityGapWithNoGrace(Duration.ofMinutes(30))).count()','KTable<Windowed<String>, Long>','会话窗口。'],
['orders.join(users, (o, u) -> o.withLevel(u.level))','KStream<String, EnrichedOrder>','流—表连接（KTable users）。'],
['streams.store(StoreQueryParameters.fromNameAndType("counts", QueryableStoreTypes.keyValueStore())).get("a")','3','交互式查询本地状态。'],
['props.put(StreamsConfig.NUM_STANDBY_REPLICAS_CONFIG, 1)','（配置）','备用副本。']]);
Quiz(document.getElementById('qs'),[
['状态存储如何在故障后恢复？',['从输入主题重算','从变更日志主题恢复','无法恢复'],1,''],
['num.standby.replicas 的作用？',['增加并行度','缩短故障接管时的恢复时间','提高吞吐'],1,''],
['窗口何时关闭？',['窗口结束时','流时间超过窗口结束 + grace','永不关闭'],1,''],
['KStream–KStream 连接需要？',['时间窗口','GlobalKTable','压缩主题'],0,''],
['共分区的含义？',['两边 key 相同、分区数相同','在同一个 Broker 上','相同副本因子'],0,'']]);
