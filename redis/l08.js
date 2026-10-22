const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=90)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const ks=[['k1','空闲 3s'],['k2','空闲 900s'],['k3','空闲 40s'],['k4','空闲 2s'],['k5','空闲 610s'],['k6','空闲 12s'],['k7','空闲 75s'],['k8','空闲 1s']];
const e={bar:{w:400,h:24,cls:'blk bad',html:'used_memory 1024 MB / maxmemory 1024 MB'},w:P('SET new:1 …','sig'),s:P('随机抽样 5 个键 → 放入淘汰池','sig'),ev:P('淘汰池中空闲最久的 k2 被删除','ok'),ok:P('内存降到上限以下，执行 SET','ok'),oom:P('noeviction：返回 OOM 错误，读命令仍然可用','bad')};ks.forEach(([k,s])=>e[k]=B(k,s));
const G=(m={})=>{const o={bar:[0,0]};ks.forEach(([k],i)=>o[k]=[(i%4)*100,40+Math.floor(i/4)*54,m[k]?{cls:'blk '+m[k]}:{cls:'blk'}]);return o};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'写入前检查',p:'内存已经到达上限。执行一条会增加内存的写命令前，先尝试释放空间。',set:{...G(),w:[420,0]}},
 {t:'抽样',p:'Redis 不维护全局 LRU 链表（太耗内存），而是随机抽几个键，与之前留在淘汰池中的候选比较。',d:3800,set:{...G({k2:'sig',k3:'sig',k5:'sig',k6:'sig',k8:'sig'}),s:[0,160]}},
 {t:'淘汰',p:'删除池中空闲时间最长的键，必要时重复，直到内存降到上限以下。',d:3800,set:{...G({k2:'mute',k3:'sig',k5:'sig',k6:'sig',k8:'sig'}),ev:[0,160],ok:[0,200]}},
 {t:'noeviction',p:'默认策略不淘汰，写命令直接失败。对纯缓存来说这通常不是想要的行为。',d:3600,set:{...G(),oom:[0,160]}}]});
const e2={h1:B('热点 A','每秒访问 100 次','ok',150),h2:B('热点 B','每秒访问 80 次','ok',150),sc:P('离线任务顺序访问 100 万个冷门键','sig'),c:B('冷门键 × 100 万','各访问 1 次','',200),lru:P('LRU：冷门键都“刚刚访问过”→ 热点被淘汰','bad'),lfu:P('LFU：热点计数 255，冷门键计数 5 → 冷门键先被淘汰','ok'),dc:P('计数随时间衰减：过气的热点也会逐渐被淘汰','mute')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'稳定状态',p:'少量热点键承担大部分访问。',set:{h1:[0,0],h2:[0,54]}},
 {t:'一次扫描',p:'某个任务把大量只用一次的键读写了一遍。',d:3400,set:{h1:[0,0],h2:[0,54],sc:[170,10],c:[170,54]}},
 {t:'LRU 的结果',p:'按最近访问时间，冷门键全部比热点“新”，热点成了淘汰对象。',d:3800,set:{h1:[0,0,{cls:'blk bad'}],h2:[0,54,{cls:'blk bad'}],c:[170,54],lru:[0,120]}},
 {t:'LFU 的结果',p:'按访问频率，只被访问一次的键计数很低，优先被淘汰，热点留了下来。',d:3800,set:{h1:[0,0,{cls:'blk ok'}],h2:[0,54,{cls:'blk ok'}],c:[170,54,{cls:'blk mute'}],lfu:[0,120],dc:[0,160]}}]});
(()=>{const Q=[['纯缓存，访问有明显热点','maxmemory-policy allkeys-lfu','ok','所有数据都可以从数据库重建；LFU 能保留真正的热点。'],
['纯缓存，访问比较均匀、最近的数据更常用','maxmemory-policy allkeys-lru','ok','时间局部性明显时 LRU 足够好，也是最常见的选择。'],
['缓存 + 会话（会话没有过期时间，不能丢）','maxmemory-policy volatile-lru\n风险：缓存都带 TTL，但会话越来越多时可淘汰的键不足 → OOM','sig','能工作，但更推荐把会话放到单独的实例，配置 noeviction 并监控内存。'],
['作为队列或主存储（数据不能丢）','maxmemory-policy noeviction','ok','宁可写入失败也不能悄悄删数据。必须监控内存并留出余量。'],
['所有键都有 TTL，希望先删快过期的','maxmemory-policy volatile-ttl','sig','在带过期时间的键中淘汰剩余 TTL 最短的。'],
['没有设置 maxmemory','maxmemory 0\n物理内存 16 GB → used_memory 增长到 15.8 GB\nfork 做 BGSAVE 时写时复制 → OOM killer 杀掉 redis-server','bad','永远设置 maxmemory，并给 fork、缓冲区和系统留余量。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent=Q[i][1];m.className='msg '+Q[i][2];m.innerHTML=Q[i][3]});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择场景。'})();
Term(document.getElementById('t4'),[
['CONFIG SET maxmemory 6gb','OK','可在线修改。在 redis.conf 中设置以便重启后保留（或 CONFIG REWRITE）。'],
['CONFIG SET maxmemory-samples 10','OK','抽样数，更接近真实 LRU，CPU 稍高。'],
['INFO stats | grep -E "evicted|keyspace"','evicted_keys:1832211\nkeyspace_hits:9102332110\nkeyspace_misses:183022012','淘汰数量和命中率。'],
['MEMORY STATS','"overhead.total" … "clients.normal" … "replication.backlog" … "dataset.bytes" …','内存按用途分解，找出非数据部分的大头（例如客户端输出缓冲区）。'],
['CONFIG SET activedefrag yes','OK','jemalloc 下的主动碎片整理，在后台逐步移动对象。'],
['redis-cli --bigkeys / --memkeys','… Biggest hash found "product:index" has 2103322 fields','扫描并报告各类型最大的键（用 SCAN，可在线执行，第 19 课）。']]);
Quiz(document.getElementById('qs'),[
['默认的 maxmemory-policy 是？',['allkeys-lru','noeviction','volatile-lru'],1,''],
['volatile-lru 只会淘汰？',['所有键','设置了过期时间的键','最大的键'],1,''],
['Redis 的 LRU 是？',['精确 LRU 链表','基于抽样的近似 LRU','随机'],1,''],
['一次性批量扫描会挤掉热点，哪种策略更能抵抗？',['allkeys-lru','allkeys-lfu','allkeys-random'],1,''],
['mem_fragmentation_ratio 小于 1 通常意味着？',['碎片很多','发生了 swap','内存充足'],1,'']]);
