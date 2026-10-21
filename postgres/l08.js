const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,c='',w=150,h=40)=>({w,h,cls:'blk '+c,html:t});
const e={sb:{w:200,h:150,cls:'frame',html:'<i>共享缓冲区（内存）</i>'},pg:B('页 12','',120),wb:{w:200,h:150,cls:'frame',html:'<i>WAL 缓冲区</i>'},r:B('UPDATE 记录 lsn 0/2000070','',170,36),c:B('COMMIT 记录','',170,36),wal:B('pg_wal（磁盘，顺序写）','',200),df:B('数据文件（磁盘，随机写）','',200),ok:P('fsync 完成 → 返回 COMMIT','ok'),ck:P('检查点或后台写进程稍后写回','sig')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'修改内存中的页',p:'UPDATE 把页 12 读入共享缓冲区，在内存中修改，页变“脏”。数据文件还没变。',set:{sb:[0,0],pg:[40,50,{cls:'blk sig'}],wb:[230,0]}},
 {t:'生成 WAL 记录',p:'同时把描述这次修改的记录追加到 WAL 缓冲区，得到一个 LSN。页头记下这个 LSN。',d:3800,set:{sb:[0,0],pg:[40,50,{cls:'blk sig'}],wb:[230,0],r:[245,40]}},
 {t:'COMMIT',p:'提交时追加 COMMIT 记录，把 WAL 缓冲区顺序写入 pg_wal 并 fsync。到这里事务就是持久的，数据页仍只在内存中。',d:4400,set:{sb:[0,0],pg:[40,50,{cls:'blk sig'}],wb:[230,0],r:[245,40,{cls:'blk ok'}],c:[245,84,{cls:'blk ok'}],wal:[230,170,{cls:'blk ok'}],ok:[460,120]}},
 {t:'之后再写数据页',p:'脏页由后台写进程或检查点写回。写回前会确认对应的 WAL 已落盘（预写规则）。很多次修改可以合并成一次页写入。',d:4200,set:{sb:[0,0],pg:[40,50],wb:[230,0],wal:[230,170],df:[0,170,{cls:'blk ok'}],ck:[460,120]}}]});
const W=['ck','a','b','c','d'];const e2={line:{w:640,h:4,cls:'blk mute',html:''},ck:B('检查点 0/3A21F40','sig',140,36),a:B('T1 UPDATE','',100,36),b:B('T1 COMMIT','',100,36),c:B('T2 INSERT','',100,36),d:B('（崩溃）','bad',100,36),f:P('重放：T1 已提交 → 恢复；T2 没有 COMMIT → 不可见','ok'),fp:P('检查点后首次修改某页：WAL 中带整页镜像','sig'),old:P('检查点之前的段可以回收','mute')};
const xs={ck:0,a:160,b:280,c:400,d:520};const at=(ks,c={})=>{const o={line:[0,58]};ks.forEach(k=>o[k]=[xs[k],70,c[k]?{cls:'blk '+c[k]}:{}]);return o};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'检查点',p:'检查点时刻所有脏页都已写回，并在 pg_control 中记下 redo 起点。',set:{...at(['ck']),old:[0,10]}},
 {t:'继续运行',p:'之后的修改只在 WAL 和内存里。',d:3400,set:{...at(['ck','a','b','c']),fp:[160,10]}},
 {t:'崩溃',p:'进程被 kill -9 或断电，内存中的脏页全部丢失。',d:3200,set:at(['ck','a','b','c','d'])},
 {t:'恢复',p:'启动时读 pg_control，从检查点的 redo 位置开始逐条重放 WAL 到末尾。已提交的 T1 被恢复；T2 没有提交记录，它的元组在 pg_xact 中视为中止。',d:4600,set:{...at(['ck','a','b','c','d'],{a:'ok',b:'ok',c:'mute'}),f:[0,130]}}]});
(()=>{const Q=[['UPDATE 后、COMMIT 前','BEGIN; UPDATE accounts SET balance = 70 WHERE name=\'A\';\n  ⚡ 断电\n重启：redo 重放到末尾，没有 T 的 COMMIT 记录\nSELECT balance FROM accounts WHERE name=\'A\';  -- 100','ok','事务未提交，客户端也没收到成功。修改不可见，正确。'],
['COMMIT 已返回，数据页未写回','COMMIT;  -- 客户端收到 COMMIT\n  ⚡ 断电（页 12 只在内存里改过）\n重启：从检查点重放，遇到 UPDATE 和 COMMIT 记录\nSELECT balance … -- 70','ok','这就是 WAL 的意义：只要 COMMIT 返回，WAL 一定已经落盘，重放能恢复数据页。'],
['写数据页写到一半','检查点写页 12：前 4 KB 写入，后 4 KB 未写\n  ⚡ 断电 → 页 12 是“半新半旧”的损坏页\n重启：WAL 中有检查点后对页 12 的首次修改的整页镜像\n  → 先整页覆盖，再重放之后的记录','ok','full_page_writes 修复了半页写。关掉它在不保证原子页写的存储上可能导致无法恢复的损坏。'],
['synchronous_commit = off','SET synchronous_commit = off;\nINSERT INTO events …; COMMIT;  -- 立即返回\n  ⚡ 200 ms 后断电，WAL 写进程尚未刷盘\n重启：这条 INSERT 不存在','','丢了最近已“提交”的少量事务，但数据库是一致的。用于可丢的数据换取更低延迟。'],
['fsync = off','ALTER SYSTEM SET fsync = off;\n…大量写入…\n  ⚡ 断电：操作系统缓存中的 WAL 和数据页都可能只写了一部分\n重启：ERROR: invalid page in block 1288 of relation base/16384/16401\n      或悄无声息的数据不一致','bad','不能保证预写规则，恢复的前提不成立。只适合可以随时丢弃重建的测试库。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent=Q[i][1];m.className='msg '+Q[i][2];m.innerHTML=Q[i][3]});q.appendChild(b)});
 m.className='msg';m.innerHTML='初始 A = 100，最近一次检查点在 UPDATE 之前。'})();
Term(document.getElementById('t4'),[
['SELECT name, setting, unit FROM pg_settings WHERE name IN (\'max_wal_size\',\'checkpoint_timeout\',\'checkpoint_completion_target\',\'wal_level\',\'full_page_writes\');','             name             | setting | unit\n------------------------------+---------+------\n checkpoint_completion_target | 0.9     |\n checkpoint_timeout           | 300     | s\n full_page_writes             | on      |\n max_wal_size                 | 1024    | MB\n wal_level                    | replica |','wal_level=replica 支持物理复制和 PITR；logical 支持逻辑复制。'],
['SELECT * FROM pg_stat_wal;',' wal_records | wal_fpi | wal_bytes  | wal_buffers_full | …\n-------------+---------+------------+------------------+\n     1820344 |   91023 | 1532881920 |               12 |','wal_fpi 是整页镜像数。占比高说明检查点太频繁。'],
['SELECT checkpoint_lsn, redo_lsn, timeline_id FROM pg_control_checkpoint();',' checkpoint_lsn | redo_lsn  | timeline_id\n----------------+-----------+-------------\n 0/3B10D30      | 0/3B10CF8 |           1','最近一次检查点。'],
['ALTER SYSTEM SET log_checkpoints = on; SELECT pg_reload_conf();','ALTER SYSTEM\n pg_reload_conf\n----------------\n t','记录每次检查点的触发原因和耗时（18 默认开启）。'],
['SELECT count(*), pg_size_pretty(sum(size)) FROM pg_ls_waldir();',' count | pg_size_pretty\n-------+----------------\n    35 | 560 MB','pg_wal 中的段数量和大小。持续增长通常是复制槽或归档卡住了。'],
['ALTER SYSTEM SET wal_compression = lz4;','ALTER SYSTEM','压缩整页镜像，减少 WAL 量。']]);
Quiz(document.getElementById('qs'),[
['COMMIT 返回成功时，什么一定已经在磁盘上？',['被修改的数据页','这个事务的 WAL 记录','整个共享缓冲区'],1,''],
['崩溃恢复从哪里开始重放？',['WAL 的开头','最近一次检查点的 redo 位置','崩溃时刻'],1,''],
['日志提示 checkpoints are occurring too frequently，通常调？',['max_wal_size','shared_buffers','work_mem'],0,''],
['full_page_writes 主要防止什么？',['半页写导致的页损坏','WAL 丢失','死锁'],0,''],
['synchronous_commit = off 崩溃时最坏情况？',['数据库损坏','丢失最近少量已提交事务','丢失所有数据'],1,'']]);
