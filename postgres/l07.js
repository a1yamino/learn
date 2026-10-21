const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,c='',w=120,h=36)=>({w,h,cls:'blk '+c,html:t});
const e={pg:{w:600,h:220,cls:'frame',html:'<i>页 0 · 8192 字节</i>'},hd:B('页头 24 B','sig',110),l1:B('lp1','',50),l2:B('lp2','',50),l3:B('lp3','',50),fr:B('空闲空间','mute',200),t3:B('元组 3','',90),t2:B('元组 2','',90),t1:B('元组 1','',90),th:B('元组头 23 B：xmin | xmax | ctid | infomask | NULL 位图','sig',420),td:B('列数据（按类型对齐）','',300),ct:P('ctid (0,2) = 第 0 页的第 2 个行指针','ok')};
const base={pg:[0,0],hd:[10,24],l1:[130,24],l2:[190,24]};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'页的布局',p:'页头之后是行指针数组，从前往后增长；元组从页尾往前存放。两者在中间相遇时页就满了。',set:{...base,fr:[250,24],t2:[400,170],t1:[500,170]}},
 {t:'插入一行',p:'新元组写在已有元组之前，再追加一个行指针指向它（偏移和长度）。',d:3800,set:{...base,l3:[250,24,{cls:'blk ok'}],fr:[310,24,{w:150}],t3:[300,170,{cls:'blk ok'}],t2:[400,170],t1:[500,170]}},
 {t:'ctid',p:'索引存的是 (页号, 行指针号)。元组在页内移动（整理碎片）时只需更新行指针，索引不用改。',d:4000,set:{...base,l3:[250,24],t3:[300,170],t2:[400,170,{cls:'blk ok'}],t1:[500,170],ct:[10,80]}},
 {t:'元组头',p:'每个元组前有约 23 字节的头。xmin、xmax 决定这个版本对哪些事务可见（第 15 课），这是 PostgreSQL MVCC 的基础。',d:4200,set:{...base,l3:[250,24],th:[10,80],td:[10,124]}}]});
const e2={row:B('行：id | title | body (500 KB)','',360),cmp:P('压缩 pglz / lz4 → 180 KB','sig'),ch:P('切成约 2 KB 的块','sig'),main:B('主表元组：id | title | 指针 → toast','ok',360,36),tt:{w:300,h:120,cls:'frame',html:'<i>pg_toast.pg_toast_16430</i>'},c1:B('chunk 0','',80,30),c2:B('chunk 1','',80,30),c3:B('… chunk 89','',80,30),q:P("SELECT id, title：不读 TOAST",'ok'),q2:P('SELECT *：读 90 块并解压','bad')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'放不进一页',p:'元组不能跨页。一行超过约 2 KB 时触发 TOAST。',set:{row:[0,0]}},
 {t:'先压缩',p:'最大的变长字段先尝试压缩。压缩后够小就留在主表。',d:3600,set:{row:[0,0],cmp:[0,50]}},
 {t:'再切片外存',p:'仍然太大，就切成块存到这张表的 TOAST 表，主元组只留一个 18 字节左右的指针。',d:4000,set:{main:[0,0],ch:[0,50],tt:[380,0],c1:[390,30],c2:[390,66],c3:[480,30]}},
 {t:'读的代价',p:'只有真正用到该列时才去 TOAST 表取。所以只查需要的列，大字段的列表页可以快很多。',d:4000,set:{main:[0,0],tt:[380,0],c1:[390,30],c2:[390,66],c3:[480,30],q:[0,60],q2:[0,100]}}]});
(()=>{const H=' lp | t_xmin | t_xmax | t_ctid | 说明\n----+--------+--------+--------+------\n';const Q=[['初始','SELECT lp, t_xmin, t_xmax, t_ctid FROM heap_page_items(get_raw_page(\'accounts\',0));\n\n'+H+'  1 |    900 |      0 | (0,1)  | A=100\n  2 |    900 |      0 | (0,2)  | B=100','','两行，都由事务 900 插入，xmax = 0 表示没被删除。'],
['UPDATE A','UPDATE accounts SET balance = 70 WHERE name=\'A\';  -- 事务 901\n\n'+H+'  1 |    900 |    901 | (0,3)  | A=100 旧版本\n  2 |    900 |      0 | (0,2)  | B=100\n  3 |    901 |      0 | (0,3)  | A=70  新版本','sig','UPDATE 不是原地修改：旧版本 xmax 设为 901，t_ctid 指向新版本 (0,3)；新版本作为新元组插入。'],
['DELETE B','DELETE FROM accounts WHERE name=\'B\';  -- 事务 902\n\n'+H+'  1 |    900 |    901 | (0,3)  | A=100 旧版本\n  2 |    900 |    902 | (0,2)  | B=100 已删除\n  3 |    901 |      0 | (0,3)  | A=70','sig','DELETE 只设置 xmax，元组仍占着空间，等 VACUUM 回收。'],
['VACUUM','VACUUM accounts;\n\n lp | lp_flags | t_xmin | t_xmax\n----+----------+--------+-------\n  1 |   3 (DEAD)  |        |\n  2 |   0 (UNUSED)|        |\n  3 |   1 (NORMAL)|    901 |      0','ok','VACUUM 确认没有事务还需要旧版本后回收空间。行指针 1 被 HOT 链 / 索引引用，暂时标 DEAD；空间可被后续插入复用，但文件通常不会变小（第 16 课）。'],
['回滚的 INSERT','BEGIN; INSERT INTO accounts VALUES (\'C\', 5); ROLLBACK;  -- 事务 903\n\n'+H+'  3 |    901 |      0 | (0,3)  | A=70\n  4 |    903 |      0 | (0,4)  | C=5，但 903 已中止','bad','回滚不会去删除元组：它照样留在页里，因为事务 903 在 pg_xact 中标记为中止，所有人都看不到它。同样等 VACUUM 清理。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent=Q[i][1];m.className='msg '+Q[i][2];m.innerHTML=Q[i][3]});q.appendChild(b)});
 m.className='msg';m.innerHTML='按顺序点，每一步在上一步基础上执行。'})();
Term(document.getElementById('t4'),[
['SHOW data_directory;',' data_directory\n------------------------------\n /var/lib/postgresql/18/docker','数据目录。'],
['SELECT oid, datname FROM pg_database;','  oid  | datname\n-------+----------\n     5 | postgres\n 16384 | shop','base/ 下的子目录名就是数据库 OID。'],
['SELECT relname, relfilenode, relpages, reltuples FROM pg_class WHERE relname = \'orders\';',' relname | relfilenode | relpages | reltuples\n---------+-------------+----------+-----------\n orders  |       16401 |     1370 |    100000','relpages、reltuples 是 ANALYZE/VACUUM 时的估计值，规划器使用它们。'],
['SELECT pg_size_pretty(pg_relation_size(\'orders\')) heap, pg_size_pretty(pg_total_relation_size(\'orders\')) total;',' heap  | total\n-------+-------\n 11 MB | 14 MB','total 包括索引和 TOAST。'],
['SELECT * FROM page_header(get_raw_page(\'orders\', 0));','    lsn    | checksum | flags | lower | upper | special | pagesize\n-----------+----------+-------+-------+-------+---------+---------\n 0/1A3C2F8 |        0 |     0 |   304 |   384 |    8192 |     8192','lower 是行指针结束处，upper 是元组开始处，差就是空闲空间。lsn 是最后修改此页的 WAL 位置。'],
['ALTER TABLE docs ALTER COLUMN body SET COMPRESSION lz4;','ALTER TABLE','之后写入的值用 lz4 压缩，通常更快。']]);
Quiz(document.getElementById('qs'),[
['PostgreSQL 默认页大小是？',['4 KB','8 KB','16 KB'],1,'编译时确定。'],
['ctid 适合作为业务主键吗？',['适合','不适合，UPDATE 和 VACUUM FULL 会改变它','只在只读表上适合'],1,''],
['UPDATE 一行在页里发生了什么？',['原地覆盖','旧版本设 xmax，新版本作为新元组插入','先删再整理页'],1,'MVCC。'],
['一个 500 KB 的 text 字段存在哪里？',['主表元组里','压缩切片后存在 TOAST 表','单独的文件'],1,''],
['回滚的 INSERT 产生的元组？',['立即删除','留在页里，由 VACUUM 回收','写入 WAL 后删除'],1,'']]);
