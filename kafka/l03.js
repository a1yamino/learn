const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=150)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={s0:B('…000000.log','offset 0–1999'),s1:B('…002000.log','offset 2000–4999'),s2:B('…005000.log','活跃段','sig'),q:P('读取 offset 2357','sig'),f:P('① 按文件名二分：2000 ≤ 2357 < 5000 → 第 2 个段','sig'),ix:P('② 索引二分：最近项 2300 → position 30200','sig'),sc:P('③ 从 30200 顺序扫描到 2357 所在批次','ok')};
const N={s0:[0,40],s1:[170,40],s2:[340,40]};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'段',p:'分区由多个段组成，文件名是段的起始偏移量。只有最后一个段可写。',set:N},
 {t:'找段',p:'消费者请求偏移量 2357。',d:3200,set:{...N,q:[0,0],f:[0,100]}},
 {t:'查索引',p:'在该段的稀疏索引中二分查找，得到不大于目标的最近一项及其文件位置。',d:3600,set:{...N,s1:[170,40,B('…002000.log','offset 2000–4999','ok')],q:[0,0],f:[0,100],ix:[0,140]}},
 {t:'顺序读',p:'从该位置向后读，最多跨过约 4 KB 的数据就能找到目标批次。',d:3600,set:{...N,s1:[170,40,B('…002000.log','offset 2000–4999','ok')],q:[0,0],f:[0,100],ix:[0,140],sc:[0,180]}}]});
(()=>{const idx=[];for(let o=2000;o<3000;o+=100)idx.push([o,(o-2000)*130]);const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 const look=t=>{if(t<2000||t>2999){p.textContent='偏移量 '+t+' 不在这个段（2000–2999）中';m.className='msg bad';m.innerHTML='先按段文件名二分选出正确的段。';return}let lo=0,hi=idx.length-1,steps=[];while(lo<hi){const mid=(lo+hi+1)>>1;steps.push(`比较索引项 ${idx[mid][0]}`);if(idx[mid][0]<=t)lo=mid;else hi=mid-1}const [o,pos]=idx[lo];p.textContent=`索引（相对偏移量 → 位置）共 ${idx.length} 项\n`+steps.join(' → ')+`\n命中：offset ${o} → position ${pos}\n从 ${pos} 开始顺序扫描 ${t-o} 条记录`;m.className='msg ok';m.innerHTML=`二分 ${steps.length} 次 + 顺序扫描 ${t-o} 条。`};
 [2000,2050,2357,2999,3500].forEach(v=>{const b=document.createElement('button');b.className='btn';b.textContent='查找 '+v;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));look(v)});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择一个偏移量。'})();
const e2={a:B('段 0','最新消息 4 天前','',130),b:B('段 1','最新消息 2 天前','',130),c:B('段 2','活跃段','sig',130),r:P('retention.ms = 3 天','sig'),d:P('段 0 整体过期 → 删除（先改名 .deleted，稍后物理删除）','ok'),k:P('段 1 中最旧的消息已超过 3 天，但段内最新的未过期 → 保留','sig'),n:B('段 3','新的活跃段','sig',130)};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'检查',p:'日志清理线程定期（log.retention.check.interval.ms，默认 5 分钟）检查每个段中最大的时间戳。',set:{a:[0,0],b:[150,0],c:[300,0],r:[0,60]}},
 {t:'删除',p:'整个段都超过保留时间才会被删除。',d:3600,set:{a:[0,0,B('段 0','已删除','bad',130)],b:[150,0],c:[300,0],r:[0,60],d:[0,100],k:[0,140]}},
 {t:'滚动',p:'活跃段达到 segment.bytes 或 segment.ms 后关闭，新建一个活跃段。',d:3600,set:{b:[150,0],c:[300,0,B('段 2','已关闭','',130)],n:[450,0],r:[0,60]}}]});
Term(document.getElementById('t4'),[
['bin/kafka-dump-log.sh --files …/00000000000000000903.log --print-data-log | head -n 3','baseOffset: 903 lastOffset: 1054 count: 152 …\n| offset: 903 CreateTime: 1761124800456 keySize: -1 valueSize: 100 sequence: 903 headerKeys: [] payload: SSXVNJHPDQDXVCRASTVY…','--print-data-log 显示每条记录。'],
['bin/kafka-dump-log.sh --files …/00000000000000000000.timeindex | head -n 3','timestamp: 1761124800140 offset: 151\ntimestamp: 1761124800151 offset: 303\n…','时间索引。'],
['bin/kafka-log-dirs.sh --bootstrap-server localhost:9092 --describe --topic-list seg','{"brokers":[{"broker":1,"logDirs":[{"logDir":"/tmp/kraft-combined-logs","partitions":[{"partition":"seg-0","size":541234,"offsetLag":0,"isFuture":false}]}]}]}','每个副本占用的磁盘大小。'],
['bin/kafka-configs.sh --bootstrap-server localhost:9092 --entity-type topics --entity-name seg --describe --all | grep segment','segment.bytes=102400 sensitive=false synonyms={DYNAMIC_TOPIC_CONFIG:segment.bytes=102400, DEFAULT_CONFIG:log.segment.bytes=1073741824}\nsegment.ms=604800000 …','主题配置及其来源。']]);
Quiz(document.getElementById('qs'),[
['段文件名代表什么？',['创建时间','段中第一条记录的偏移量','段的序号'],1,''],
['偏移量索引为什么是稀疏的？',['节省空间，能整体放入内存','写入更快','Kafka 不支持密集索引'],0,''],
['保留策略删除数据的单位？',['单条消息','整个段','整个分区'],1,''],
['压缩的单位是？',['单条记录','RecordBatch','段'],1,''],
['Kafka 读写快的重要原因？',['自己实现的内存缓存','顺序 I/O + 操作系统页缓存','每次写都 fsync'],1,'']]);
