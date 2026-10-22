const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=150)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={rq:B('请求','',''),rc:B('Redis',''),db:B('数据库','',''),t:P('','sig')};const N={rq:[0,60],rc:[200,0],db:[200,120]};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'正常',p:'绝大多数请求在缓存命中，少量回源。',set:{...N,rc:[200,0,B('Redis','命中 99%','ok')],db:[200,120,B('数据库','200 QPS','ok')]}},
 {t:'穿透',p:'请求不存在的 ID：缓存没有，数据库也没有，每次都穿过缓存。',d:3800,set:{...N,rq:[0,60,B('请求','id=-1, 98765432…','bad')],rc:[200,0,B('Redis','未命中')],db:[200,120,B('数据库','查空 × N','bad')],t:[380,60,P('缓存空值 / 布隆过滤器 / 参数校验','ok')]}},
 {t:'击穿',p:'一个热点键过期，瞬间所有并发请求同时回源。',d:3800,set:{...N,rq:[0,60,B('请求','同一个热点键 × 5000','sig')],rc:[200,0,B('Redis','热点键刚过期','sig')],db:[200,120,B('数据库','同一查询 × 5000','bad')],t:[380,60,P('互斥重建 / 逻辑过期 / singleflight','ok')]}},
 {t:'雪崩',p:'大量键同时过期，或者 Redis 整体宕机。',d:3800,set:{...N,rc:[200,0,B('Redis','大量失效 / 宕机','bad')],db:[200,120,B('数据库','全部流量','bad')],t:[380,60,P('TTL 抖动 / 高可用 / 限流熔断 / 降级','ok')]}}]});
(()=>{const S=[['不做处理','前 200 ms 内所有请求都未命中：5000 × 0.2 = 1000 次相同的数据库查询','bad'],['互斥重建（其他请求等待 50 ms 重试）','1 次数据库查询；等待的请求延迟增加最多约 200 ms','ok'],['互斥重建（拿不到锁返回旧值/默认值）','1 次数据库查询；需要保留旧值（例如逻辑过期）','ok'],['逻辑过期 + 后台刷新','1 次数据库查询；所有请求立即返回（刷新完成前是旧值）','ok'],['进程内 singleflight（20 个应用实例）','每个实例 1 次，共 20 次数据库查询','sig']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 S.forEach(([t,r,c])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent=t+'\n→ '+r;m.className='msg '+c;m.innerHTML=c==='bad'?'数据库瞬间收到大量相同查询。':'只有少量请求回源。'});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择防护方式。'})();
const bits=a=>({w:400,h:36,cls:'frame',html:'<span style="font-family:monospace;letter-spacing:6px">'+a+'</span>'});
const e2={b:bits('0000000000000000'),x:P('ADD 1001：h1=2 h2=7 h3=11 → 置 1','sig'),y:P('EXISTS 5555：h=3,7,14 → 位 3 为 0 → 一定不存在','ok'),z:P('EXISTS 7777：h=2,7,11 → 全为 1 → “可能存在”（误判）','sig')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'加入',p:'对元素计算 k 个哈希，把对应位设为 1。',set:{b:[0,0,bits('0010000100010000')],x:[0,50]}},
 {t:'不存在',p:'只要有一个位是 0，就一定没有加入过。',d:3600,set:{b:[0,0,bits('0010000100010000')],y:[0,50]}},
 {t:'误判',p:'所有位碰巧都被其他元素置为 1 时会误判为存在，误判率由位数组大小和哈希个数决定。',d:4000,set:{b:[0,0,bits('0010000100010000')],z:[0,50]}}]});
Term(document.getElementById('t4'),[
['BF.RESERVE bf 0.001 10000000','OK','1000 万元素、0.1% 误判率，约 17 MB。'],
['BF.EXISTS bf 42','(integer) 0','0：一定不存在。'],
['CF.RESERVE cf 1000000\nCF.DEL cf 42','OK\n(integer) 0','Cuckoo 过滤器支持删除。'],
['SET lock:k uuid NX EX 10','OK','互斥重建锁，第 20 课详细讲分布式锁。'],
['HSET hot:k data \'{…}\' expire_at 1761108000','(integer) 2','逻辑过期：过期时间存在值里。']]);
Quiz(document.getElementById('qs'),[
['请求不存在的数据导致每次查库，叫？',['穿透','击穿','雪崩'],0,''],
['布隆过滤器返回“不存在”时？',['可能存在','一定不存在','需要再查'],1,''],
['击穿的核心对策？',['TTL 抖动','只让一个请求重建','布隆过滤器'],1,''],
['大量键使用相同 TTL 的风险？',['雪崩','穿透','热 key'],0,''],
['Redis 整体不可用时保护数据库的手段？',['限流熔断与降级','增大 TTL','布隆过滤器'],0,'']]);
