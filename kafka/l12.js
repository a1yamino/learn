const P=(t,c='sig')=>({cls:'pill '+c,html:t});
const R=(o,k,v,c='')=>({w:66,h:52,cls:'blk '+c,html:`<span style="font-size:11px;opacity:.7">${o}</span><br>${k}:${v}`});
const rows=[[0,'p1',100],[1,'p2',50],[2,'p1',120],[3,'p3',9],[4,'p2',55],[5,'p1',99],[6,'p3','null']];
const e={};rows.forEach(([o,k,v])=>e['r'+o]=R(o,k,v));e.t=P('清理前：7 条记录','sig');e.m=P('key → 最新偏移量：p1→5，p2→4，p3→6（墓碑）','sig');e.a=P('清理后：偏移量 4、5、6 保留（6 是墓碑，delete.retention.ms 后也被删除）','ok');
const L={};rows.forEach(([o],i)=>L['r'+o]=[i*72,40]);
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'清理前',p:'同一个 key 有多个版本。',set:{...L,t:[0,0]}},
 {t:'建立映射',p:'清理线程扫描，记录每个 key 最后出现的偏移量。',d:3800,set:{...L,r4:[288,40,R(4,'p2',55,'ok')],r5:[360,40,R(5,'p1',99,'ok')],r6:[432,40,R(6,'p3','null','sig')],m:[0,0]}},
 {t:'重写',p:'只保留每个 key 的最新记录，偏移量不变，中间出现空洞。',d:4000,set:{r4:[288,40,R(4,'p2',55,'ok')],r5:[360,40,R(5,'p1',99,'ok')],r6:[432,40,R(6,'p3','null','sig')],a:[0,110]}}]});
(()=>{let log=[];let off=0;const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');let cleaned=false;
 const show=(t,c='sig')=>{p.textContent=log.length?log.map(r=>`${r.o}:${r.k}=${r.v===null?'(墓碑)':r.v}`).join('  '):'（空）';m.className='msg '+c;m.innerHTML=t};
 const put=(k,v)=>{log.push({o:off++,k,v});show(`写入 ${k}=${v===null?'null':v}，偏移量 ${off-1}`)};
 [['p1=100',()=>put('p1',100)],['p2=50',()=>put('p2',50)],['p1=120',()=>put('p1',120)],['删除 p2',()=>put('p2',null)],['p3=7',()=>put('p3',7)],['运行清理',()=>{const last={};log.forEach((r,i)=>last[r.k]=i);const before=log.length;log=log.filter((r,i)=>last[r.k]===i);cleaned=true;show(`清理：${before} 条 → ${log.length} 条。墓碑暂时保留。`,'ok')}],['墓碑过期',()=>{const n=log.length;log=log.filter(r=>r.v!==null);show(`delete.retention.ms 之后墓碑被移除（${n-log.length} 条）。`,'ok')}]].forEach(([t,f])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',f);q.appendChild(b)});
 show('依次写入，再运行清理。（演示中把所有记录视为 tail；真实环境中活跃段不会被清理。）')})();
const B=(t,s,c='',w=150)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e2={b:B('Broker 本地磁盘','最近 1 天','sig',170),s3:B('对象存储','1 天 – 1 年','',170),up:P('段关闭后由 RemoteLogManager 上传','sig'),dl:P('local.retention.ms 到期：删除本地副本（远程仍在）','sig'),rd:P('消费者读旧数据：Broker 从远程拉取并返回，对客户端透明','ok')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'上传',p:'活跃段之外的段会被复制到远程存储。',set:{b:[0,0],s3:[260,0],up:[0,70]}},
 {t:'本地清理',p:'本地只保留 local.retention.ms；总保留时间由 retention.ms 决定。',d:3600,set:{b:[0,0],s3:[260,0],up:[0,70],dl:[0,110]}},
 {t:'读取',p:'读取近期数据走本地页缓存；回放历史时从对象存储读取，延迟更高。扩容和替换 Broker 时也只需复制本地的少量数据。',d:4200,set:{b:[0,0],s3:[260,0],rd:[0,70]}}]});
Term(document.getElementById('t4'),[
['bin/kafka-configs.sh $B --entity-type topics --entity-name prices --describe --all | grep -E "cleanup|compaction|delete.retention"','cleanup.policy=compact …\ndelete.retention.ms=10000 …\nmax.compaction.lag.ms=9223372036854775807 …\nmin.compaction.lag.ms=0 …','压缩相关配置。'],
['bin/kafka-configs.sh $B --entity-type topics --entity-name page-views --alter --add-config retention.ms=259200000','Completed updating config for topic page-views.','保留 3 天。'],
['bin/kafka-configs.sh $B --entity-type topics --entity-name audit-log --alter --add-config remote.storage.enable=true,local.retention.ms=2592000000','Completed updating config for topic audit-log.','开启分层存储（需要 Broker 端已配置远程存储插件）。'],
['bin/kafka-delete-records.sh $B --offset-json-file del.json','Records delete operation completed:\npartition: jobs-0\tlow_watermark: 5000','把分区的起始位置（log start offset）推进到 5000，之前的数据不可再读。']]);
Quiz(document.getElementById('qs'),[
['压缩主题对每个 key 保留？',['最早一条','最新一条','全部'],1,''],
['压缩后偏移量会怎样？',['重新编号','保持不变，出现空洞','全部清零'],1,''],
['如何在压缩主题中删除一个 key？',['发送 value 为 null 的墓碑','删除分区','调用 delete API'],0,''],
['活跃段会被压缩吗？',['会','不会','只在重启时'],1,''],
['分层存储中 local.retention.ms 控制？',['总保留时间','本地磁盘保留时间','压缩频率'],1,'']]);
