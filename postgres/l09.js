const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,c='',w=200,h=44)=>({w,h,cls:'blk '+c,html:t});
const e={be:B('后端进程<br><span style="font-size:11px;opacity:.7">要读 orders 页 12</span>','',150),sb:B('共享缓冲区<br><span style="font-size:11px;opacity:.7">shared_buffers</span>'),os:B('操作系统页缓存<br><span style="font-size:11px;opacity:.7">剩余空闲内存</span>'),dk:B('磁盘','',200),t1:P('~0.1 µs：shared hit','ok'),t2:P('~5 µs：read，但在页缓存','sig'),t3:P('~0.1–2 ms：read，真正读盘','bad')};
const L={be:[0,80],sb:[200,0],os:[200,80],dk:[200,160]};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'三层',p:'后端进程只和共享缓冲区打交道。下面是操作系统的页缓存，再下面才是磁盘。',set:L},
 {t:'命中共享缓冲区',p:'页已经在共享缓冲区中，固定（pin）它、加锁读取即可。EXPLAIN 中计为 shared hit。',d:3600,set:{...L,sb:[200,0,{cls:'blk ok'}],t1:[430,10]}},
 {t:'命中页缓存',p:'不在共享缓冲区：找一个空闲缓冲区，调用 read() 向操作系统要这页。操作系统缓存里有，很快返回。EXPLAIN 中仍计为 read。',d:4200,set:{...L,sb:[200,0,{cls:'blk sig'}],os:[200,80,{cls:'blk ok'}],t2:[430,90]}},
 {t:'读盘',p:'两层都没有，真正发生磁盘 I/O。只有打开 track_io_timing 才能从耗时上区分这两种 read。',d:4000,set:{...L,sb:[200,0,{cls:'blk sig'}],os:[200,80,{cls:'blk sig'}],dk:[200,160,{cls:'blk bad'}],t3:[430,170]}}]});
const n=8,e2={hand:P('▼ 时钟指针','sig'),nw:P('需要 1 个缓冲区放新页','mute'),r:P('计数 0 且未固定 → 替换','ok'),ring:P('顺序扫描大表：用 256 KB 环形缓冲区，不冲掉热页','sig')};const cnt=[3,0,5,1,2,0,4,1];
for(let i=0;i<n;i++)e2['b'+i]=B('页 '+String.fromCharCode(65+i)+'<br><span style="font-size:11px;opacity:.7">计数 '+cnt[i]+'</span>','',70);
const row=(m={})=>{const o={};for(let i=0;i<n;i++){const c=m[i];o['b'+i]=[i*80,40,c?(typeof c==='string'?{cls:'blk '+c}:c):{cls:'blk'}]}return o};
const lab=(i,v,c)=>({cls:'blk '+c,html:'页 '+String.fromCharCode(65+i)+'<br><span style="font-size:11px;opacity:.7">计数 '+v+'</span>'});
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'缓冲区已满',p:'每个缓冲区有使用计数，被访问一次加一，最多 5。现在要读入一个新页，需要腾出一个位置。',set:{...row(),nw:[0,110]}},
 {t:'指针经过页 A',p:'计数 3 > 0：减为 2，跳过。被频繁访问的页需要很多圈才会被淘汰。',d:3800,set:{...row({0:lab(0,2,'sig')}),hand:[0,0]}},
 {t:'到达页 B',p:'计数 0 且没有进程固定它：选中。如果是脏页，先写回（这就是后端被迫写），再装入新页。',d:4000,set:{...row({0:lab(0,2,'mute'),1:lab(1,1,'ok')}),hand:[80,0],r:[0,110]}},
 {t:'环形缓冲区',p:'一次性的大扫描如果走正常路径，会把热页全挤掉。所以大表顺序扫描、VACUUM、COPY 只在一个很小的私有环里循环使用缓冲区。',d:4000,set:{...row({2:'ok',4:'ok',6:'ok'}),ring:[0,110]}}]});
(()=>{const Q=[['A','Index Scan using orders_user_created_idx on orders (actual time=0.021..0.044 rows=20)\n  Buffers: shared hit=24\nExecution Time: 0.061 ms','ok','全部命中共享缓冲区，最快的情况。'],
['B','Index Scan … (actual time=0.120..0.392 rows=20)\n  Buffers: shared hit=4 read=20\n  I/O Timings: shared read=0.180\nExecution Time: 0.410 ms','sig','20 页要 read，但总共 0.18 ms，每页约 9 µs：来自操作系统页缓存。'],
['C','Index Scan … (actual time=1.931..41.702 rows=20)\n  Buffers: shared hit=3 read=21\n  I/O Timings: shared read=40.95\nExecution Time: 41.733 ms','bad','每页约 2 ms：真正的随机读盘。这是冷数据，常见于很少访问的用户。'],
['D','Seq Scan on orders (actual time=0.010..95.1 rows=100000)\n  Buffers: shared hit=32 read=1338 dirtied=1338 written=1290\nExecution Time: 112.4 ms','bad','只读查询却 dirtied 了 1338 页：刚批量写入的数据第一次被读时要设置提示位（hint bits，记录事务已提交），页因此变脏。written 表示后端自己被迫把脏页写回——缓冲区不足或 bgwriter 跟不上。批量导入后先 VACUUM 可以避免让在线查询承担这件事。'],
['E','Seq Scan on big_logs (actual time=0.4..2210 rows=8000000)\n  Buffers: shared read=98000\n(之后查询 A 仍然是 shared hit=24)','ok','读了 98000 页（765 MB），远大于 shared_buffers 的 1/4，走环形缓冲区：大扫描没有冲掉热点数据。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent='情况 '+t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent=Q[i][1];m.className='msg '+Q[i][2];m.innerHTML=Q[i][3]});q.appendChild(b)});
 m.className='msg';m.innerHTML='已开启 track_io_timing。'})();
Term(document.getElementById('t4'),[
['ALTER SYSTEM SET shared_buffers = \'4GB\';','ALTER SYSTEM','需要重启生效（docker restart pg）。'],
['SELECT * FROM pg_stat_bgwriter;',' buffers_clean | maxwritten_clean | buffers_alloc | …\n---------------+------------------+---------------+\n         81234 |               14 |       5023911 |','bgwriter 写回的页数。maxwritten_clean 频繁增长说明它每轮写得不够。'],
['SELECT backend_type, object, context, reads, writes, hits FROM pg_stat_io WHERE reads > 0 OR writes > 0;','   backend_type    |  object  | context  | reads  | writes |   hits\n-------------------+----------+----------+--------+--------+---------\n client backend    | relation | normal   |  51230 |   1288 | 9812201\n client backend    | relation | bulkread |  98000 |      0 |       0\n checkpointer      | relation | normal   |        |  29811 |','PostgreSQL 16+ 的 I/O 统计，按进程类型和上下文细分。客户端后端的 writes 应该很小。'],
['SELECT relname, heap_blks_read, heap_blks_hit, idx_blks_read, idx_blks_hit FROM pg_statio_user_tables ORDER BY heap_blks_read DESC LIMIT 3;',' relname | heap_blks_read | heap_blks_hit | idx_blks_read | idx_blks_hit\n---------+----------------+---------------+---------------+-------------\n orders  |         152330 |       8813300 |          4211 |      901233','哪些表读盘最多。'],
['SELECT pg_prewarm(\'orders\');',' pg_prewarm\n------------\n       1370','把表预先读入缓存（pg_prewarm 扩展），重启后预热用。'],
['SHOW io_method;',' io_method\n-----------\n worker','PostgreSQL 18 的异步 I/O 实现：worker（默认）、io_uring（Linux）或 sync。']]);
Quiz(document.getElementById('qs'),[
['专用 32 GB 服务器，shared_buffers 常见起点？',['1 GB','8 GB','28 GB'],1,'约 25%。'],
['EXPLAIN 中 shared read 表示？',['一定读了磁盘','不在共享缓冲区，向操作系统请求','从 WAL 读取'],1,'可能命中页缓存。'],
['effective_cache_size 设大会？',['多分配内存','让规划器更倾向于索引扫描','加快 COMMIT'],1,'只是估计值。'],
['大表顺序扫描为什么不会冲掉热点数据？',['使用小的环形缓冲区','不经过缓冲区','有优先级'],0,''],
['只读查询出现 dirtied，常见原因？',['设置提示位','查询修改了数据','WAL 回放'],0,'']]);
