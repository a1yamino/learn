const S=(t,s,c='',w=140)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});const P=(t,c='sig')=>({cls:'pill '+c,html:t});
Player(document.getElementById('p1'),{els:{c1:S('应用 A','连接 1','',110),c2:S('应用 B','连接 2','',110),pm:S('postmaster','监听 5432','',150),b1:S('后端进程','pid 68','',120),b2:S('后端进程','pid 71','',120),sh:{w:340,h:60,cls:'blk',html:'共享内存<br><span style="font-size:11px;opacity:.7">shared_buffers · WAL 缓冲区 · 锁表</span>'},bg:S('后台进程','checkpointer · walwriter · autovacuum…','',290),dk:S('磁盘','数据文件 · WAL','',130),n:{w:700,cls:'tag'}},scenes:[
 {t:'postmaster',p:'启动后，主进程 postmaster 分配共享内存，启动后台进程，然后监听端口等待连接。',set:{pm:[180,0,{cls:'blk sig'}],sh:[180,170],bg:[180,250],dk:[560,250]}},
 {t:'每个连接一个进程',p:'客户端连接时，postmaster 完成认证并 fork 一个后端进程。之后这个连接上的所有 SQL 都由它执行，postmaster 不再参与。',d:4000,set:{c1:[0,80],pm:[180,0],b1:[180,80,{cls:'blk sig'}],sh:[180,170],bg:[180,250],dk:[560,250]}},
 {t:'更多连接',p:'第二个连接得到另一个进程。进程之间不共享私有内存（work_mem 等），只通过共享内存交换数据页和锁信息。',d:3800,set:{c1:[0,80],c2:[0,140],pm:[180,0],b1:[180,80,{cls:'blk sig'}],b2:[320,80,{cls:'blk sig'}],sh:[180,170],bg:[180,250],dk:[560,250]}},
 {t:'读写数据',p:'后端进程在共享缓冲区里读写数据页，修改先记录到 WAL。后台进程在之后把脏页和日志写到磁盘（第 8、9 课）。',d:4000,set:{c1:[0,80],c2:[0,140],pm:[180,0],b1:[180,80],b2:[320,80],sh:[180,170,{cls:'blk sig'}],bg:[180,250,{cls:'blk sig'}],dk:[560,250,{cls:'blk ok'}]}}]});
const ST=[['pa','解析','语法树','SELECT name FROM users WHERE id = 1'],['an','分析 · 改写','名字 → 对象 OID，展开视图',''],['pl','规划','选择执行计划',''],['ex','执行','读取数据页，返回行','']];
const e2={q:{w:330,h:34,cls:'blk',html:'<code>SELECT name FROM users WHERE id = 1</code>'},plan:P('Index Scan using users_pkey · cost=0.15..8.17','sig'),alt:P('候选：Seq Scan · cost=0.00..25.00','mute'),buf:P('shared_buffers 命中 1 页','ok'),r:P('1 row: 李雷','ok'),n:{w:700,cls:'tag'}};ST.forEach(([k,t,s])=>e2[k]=S(t,s,'',160));
const on=(...k)=>{const o={q:[0,0]};ST.forEach(([x],i)=>o[x]=[i*175,60,{cls:k.includes(x)?'blk sig':'blk'}]);return o};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'解析',p:'检查语法，生成语法树。拼写错误在这一步报错（syntax error）。此时还不知道 users 是否存在。',set:on('pa')},
 {t:'分析与改写',p:'查系统目录：users 是哪张表、name 是什么类型、当前用户有没有权限。如果 users 是视图，改写器把它展开成底层查询。表不存在的错误在这里出现。',d:4200,set:on('an')},
 {t:'规划',p:'规划器列举可能的执行方式（顺序扫描、索引扫描……），用统计信息估算代价，选最便宜的。这就是 EXPLAIN 显示的内容（第 12 课）。',d:4000,set:{...on('pl'),plan:[175,140],alt:[175,180]}},
 {t:'执行',p:'执行器按计划从共享缓冲区读取数据页（不在缓冲区就从磁盘读），逐行返回给客户端。预备语句（prepared statement）可以跳过重复的解析和规划。',d:4000,set:{...on('ex'),plan:[175,140],buf:[350,180],r:[525,140]}}]});
(()=>{const MAX=6,RES=1;let conns=[],pid=68;const cn=document.getElementById('cn'),cp=document.getElementById('cp'),cm=document.getElementById('cm');
 const add=(su)=>{if(conns.length>=MAX){return ['bad','FATAL:  sorry, too many clients already']}if(!su&&conns.filter(c=>!c.su).length>=MAX-RES){return ['bad','FATAL:  remaining connection slots are reserved for roles with the SUPERUSER attribute']}conns.push({pid:pid+=3,su});return ['ok',`postmaster fork 了后端进程 pid ${pid}。`]};
 [['app','应用打开连接',()=>add(false)],['su','超级用户连接',()=>add(true)],['close','关闭一个连接',()=>{if(!conns.length)return ['','没有连接可关闭。'];const c=conns.shift();return ['',`连接关闭，进程 ${c.pid} 退出。`]}],['idle','应用忘记关闭连接（泄漏）',()=>{let r;for(let i=0;i<3;i++)r=add(false);return [r[0],'连续打开 3 个且不关闭。'+(r[0]==='bad'?' '+r[1]:'')]}]].forEach(([k,t,f])=>{const b=document.createElement('button');b.className='btn';b.dataset.v=k;b.textContent=t;b.addEventListener('click',()=>{const [c,m]=f();draw(c,m)});cn.appendChild(b)});
 function draw(c,m){const mem=conns.length*4+128;cp.innerHTML=`<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:14px 0"><span class="pill mute">postmaster</span><span class="pill mute">后台进程 ×8</span>${conns.map(x=>`<span class="pill ${x.su?'sig':'ok'}">${x.su?'superuser':'app'} · ${x.pid}</span>`).join('')}${Array.from({length:MAX-conns.length},(_,i)=>`<span class="pill mute" style="opacity:.4">空位${MAX-conns.length-i<=RES&&conns.filter(x=>x.su).length<RES?'（保留）':''}</span>`).join('')}</div><div style="font:12px var(--m);opacity:.75">连接 ${conns.length}/${MAX} · 估算内存约 ${mem} MB（共享内存 128 MB + 每个后端约 4 MB 起，排序、哈希时按 work_mem 增加）</div>`;
  cm.className='msg '+(c||'');cm.innerHTML=m+(c==='bad'?' 普通连接用尽后，只剩保留给超级用户的位置用于排查。解决方法是连接池（第 21 课），不是不停调大 max_connections。':'')}
 draw('','每个连接都是一个独立的操作系统进程。')})();
Term(document.getElementById('t4'),[
['\\l','   Name    |  Owner   | Encoding | Locale Provider |  Collate   |   Ctype\n-----------+----------+----------+-----------------+------------+------------\n postgres  | postgres | UTF8     | libc            | en_US.utf8 | en_US.utf8\n shop      | postgres | UTF8     | libc            | en_US.utf8 | en_US.utf8\n template0 | postgres | UTF8     | libc            | en_US.utf8 | en_US.utf8\n template1 | postgres | UTF8     | libc            | en_US.utf8 | en_US.utf8','所有数据库。CREATE DATABASE 默认复制 template1。'],
['\\dn','  List of schemas\n  Name  |       Owner\n--------+-------------------\n public | pg_database_owner','当前数据库中的 schema。'],
['SHOW max_connections; SHOW shared_buffers;',' max_connections\n-----------------\n 100\n\n shared_buffers\n----------------\n 128MB','查看配置参数。SHOW ALL 显示全部，pg_settings 视图还包括来源和是否需要重启。'],
['SELECT pid, usename, application_name, state, now() - query_start AS running, left(query, 40) FROM pg_stat_activity WHERE backend_type = \'client backend\';',' pid | usename  | application_name | state  | running  |   left\n-----+----------+------------------+--------+----------+-----------\n  68 | postgres | psql             | active | 00:00:00 | SELECT pid, …','当前连接在做什么。排查慢查询和连接泄漏的第一站。'],
['\\timing on\nSELECT count(*) FROM generate_series(1, 1000000);','Timing is on.\n  count\n---------\n 1000000\n\nTime: 61.512 ms','显示每条语句的耗时（含网络往返）。'],
['\\x on\nSELECT * FROM pg_stat_database WHERE datname = \'shop\';','-[ RECORD 1 ]---+------\ndatid           | 16384\ndatname         | shop\nnumbackends     | 1\nxact_commit     | 42\n…','竖排显示，适合列很多的结果。']]);
Quiz(document.getElementById('qs'),[
['PostgreSQL 为每个客户端连接创建？',['一个线程','一个独立的后端进程','什么都不创建'],1,'fork 模型。'],
['“relation users does not exist”是在哪个阶段报出的？',['解析','分析','执行'],1,'解析只检查语法。'],
['应用每个请求都新建一个数据库连接，主要问题是？',['SQL 语法受限','每次 fork 进程和认证开销大，连接数很快耗尽','数据不安全'],1,'用连接池。'],
['一个 psql 会话能同时访问两个数据库中的表吗？',['可以，用 db.schema.table','不能，连接时选定一个数据库','只有超级用户可以'],1,'跨库需要 dblink / FDW。']]);
