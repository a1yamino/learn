const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,c='',w=150,h=40)=>({w,h,cls:'blk '+c,html:t});
const e={q:P("WHERE status = 'paid' AND amount > 900",'sig'),mcv:B("MCV：paid 0.50 · pending 0.30 · cancelled 0.20",'',330),hist:B('amount 直方图：100 个等频桶，900 在第 90 桶','',330),s1:P('选择率 0.50','ok'),s2:P('选择率 0.10','ok'),mul:P('0.50 × 0.10 × 100000 = 5000 行','sig'),ind:P('假设两列独立；如果相关，结果可能差几个数量级','bad')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'等值条件',p:"status = 'paid'：paid 在最常见值列表中，频率 0.50，直接使用。",set:{q:[0,0],mcv:[0,50],s1:[350,56]}},
 {t:'范围条件',p:'amount > 900：在直方图中定位，900 之上大约 10 个桶，选择率约 0.10。',d:3800,set:{q:[0,0],mcv:[0,50],s1:[350,56],hist:[0,100],s2:[350,106]}},
 {t:'组合',p:'AND 的两个条件选择率相乘，乘以 reltuples 得到估算行数。',d:3600,set:{q:[0,0],mcv:[0,50],s1:[350,56],hist:[0,100],s2:[350,106],mul:[0,160]}},
 {t:'独立性假设',p:'如果大额订单基本都是 paid，真实结果接近 1 万行而不是 5000。用 CREATE STATISTICS 记录列之间的依赖和组合 MCV。',d:4000,set:{q:[0,0],mul:[0,50],ind:[0,100]}}]});
const e2={o:B('外表 users（9 行）','',170),i:B('内表 orders · user_id 索引','',210),nl:P('Nested Loop：9 次索引查找','ok'),h1:B('小表 users → 哈希表','sig',190),h2:B('大表 orders 顺序扫描，逐行探测','',230),hj:P('Hash Join：各读一遍，O(n+m)','ok'),m1:B('users 按 id 有序（pkey）','',200),m2:B('orders 按 user_id 有序（索引）','',220),mj:P('Merge Join：两个指针同步前进','ok'),bad:P('外层估算 9 行、实际 50 万行 → 内层执行 50 万次','bad')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'Nested Loop',p:'外层每一行，到内层查一次匹配行。外层小、内层有索引时最快；不需要额外内存，第一行马上输出。',set:{o:[0,0],i:[0,60],nl:[260,30]}},
 {t:'Hash Join',p:'用较小的输入建哈希表（放在 work_mem 中，放不下就分批写临时文件），再扫描较大的输入探测。只支持等值连接。',d:4200,set:{h1:[0,0],h2:[0,60],hj:[260,30]}},
 {t:'Merge Join',p:'两边都按连接键排好序，像合并两个有序列表。输入已经有序（索引）时代价低；否则要先排序。',d:4000,set:{m1:[0,0],m2:[0,60],mj:[260,30]}},
 {t:'选错的代价',p:'Nested Loop 的代价与外层行数成正比。估算太低，就会选它，实际执行可能慢上千倍。看到慢的 Nested Loop，先比较外层的 rows 估算和实际。',d:4400,set:{o:[0,0],i:[0,60],bad:[0,130]}}]});
(()=>{const Q=[['原始：OFFSET 深分页',"SELECT * FROM orders WHERE user_id = 42 OR seller_id = 42\nORDER BY created_at DESC OFFSET 5000 LIMIT 20;\n\n Limit (actual time=2412.3..2412.4 rows=20)\n   ->  Sort (Sort Method: top-N heapsort)\n         ->  Seq Scan on orders (actual rows=5180)\n               Filter: ((user_id = 42) OR (seller_id = 42))\n               Rows Removed by Filter: 49994820\nExecution Time: 2412.6 ms",'bad','两个问题：OR 跨两列，任一单列索引都不能单独满足；OFFSET 5000 要先产生 5020 行再丢掉。'],
['OR 改为 UNION',"SELECT * FROM (\n  SELECT * FROM orders WHERE user_id = 42\n  UNION\n  SELECT * FROM orders WHERE seller_id = 42) t\nORDER BY created_at DESC OFFSET 5000 LIMIT 20;\n\n Limit (actual time=38.1..38.2 rows=20)\n   ->  Sort\n         ->  HashAggregate\n               ->  Append\n                     ->  Index Scan using orders_user_id_idx …\n                     ->  Index Scan using orders_seller_id_idx …\nExecution Time: 38.5 ms",'sig','每个分支用自己的索引，快了 60 倍。规划器有时会自动用 BitmapOr 合并两个索引，效果类似。'],
['再改为键集分页',"-- 客户端记住上一页最后一行的 (created_at, id)\nSELECT * FROM orders WHERE user_id = 42\n  AND (created_at, id) < ($last_ts, $last_id)\nORDER BY created_at DESC, id DESC LIMIT 20;\n-- 索引 (user_id, created_at DESC, id DESC)\n\n Limit (actual time=0.03..0.06 rows=20)\n   ->  Index Scan using orders_user_ts_id …\nExecution Time: 0.08 ms",'ok','翻到第几页都只读 20 个条目。行比较 (a, b) < (x, y) 可以直接用复合索引。代价是不能跳到任意页，适合“加载更多”式的接口。'],
['NOT IN 子查询',"SELECT * FROM users WHERE id NOT IN (SELECT user_id FROM orders);\n\n Seq Scan on users\n   Filter: (NOT (hashed SubPlan 1))\n…  orders.user_id 中只要有一个 NULL，结果就是 0 行",'bad','NOT IN 遇到 NULL 时语义是“未知”，整体返回空集，这通常是 bug；子查询太大放不进内存时还会退化为逐行扫描。'],
['改用 NOT EXISTS',"SELECT * FROM users u WHERE NOT EXISTS (\n  SELECT 1 FROM orders o WHERE o.user_id = u.id);\n\n Hash Right Anti Join (actual time=21.2..21.4 rows=103)\n   Hash Cond: (o.user_id = u.id)",'ok','反连接（Anti Join），语义正确且可以用 Hash / Merge / 索引 Nested Loop。'],
['函数包住列',"SELECT * FROM orders WHERE date(created_at) = '2026-10-21';\n\n Seq Scan on orders  Filter: (date(created_at) = '2026-10-21')\n\n改写：\nWHERE created_at >= '2026-10-21' AND created_at < '2026-10-22'\n\n Index Scan using orders_created_at_idx",'ok','把运算移到常量一侧，让列保持“裸”的形式就能用普通索引。也可以建表达式索引，但要保证查询写法一致。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent=Q[i][1];m.className='msg '+Q[i][2];m.innerHTML=Q[i][3]});q.appendChild(b)});
 m.className='msg';m.innerHTML='orders 5000 万行，user_id 和 seller_id 上各有索引。'})();
Term(document.getElementById('t4'),[
['SELECT most_common_vals, most_common_freqs FROM pg_stats WHERE tablename = \'orders\' AND attname = \'status\';','       most_common_vals       |  most_common_freqs\n------------------------------+---------------------\n {paid,pending,cancelled}     | {0.5,0.3,0.2}','最常见值和频率。'],
['ALTER TABLE orders ALTER COLUMN user_id SET STATISTICS 1000; ANALYZE orders;','ALTER TABLE\nANALYZE','加大单列的统计目标（MCV 和直方图更细，ANALYZE 更慢）。分布倾斜的列常用。'],
['SELECT relname, last_analyze, last_autoanalyze, n_mod_since_analyze FROM pg_stat_user_tables WHERE relname = \'orders\';',' relname |  last_analyze  |       last_autoanalyze        | n_mod_since_analyze\n---------+----------------+-------------------------------+---------------------\n orders  |                | 2026-10-22 09:12:40.118+08    |                3021','统计是否过期。'],
['SELECT stxname, stxkind FROM pg_statistic_ext;',' stxname | stxkind\n---------+---------\n addr_cz | {f,m}','扩展统计：d=ndistinct，f=functional dependencies，m=MCV。'],
['SET join_collapse_limit = 1;','SET','按 SQL 中书写的 JOIN 顺序连接（诊断用）。表很多时规划器在 join_collapse_limit（默认 8）以内才穷举顺序。'],
['SELECT * FROM pg_stat_user_tables WHERE seq_scan > 1000 AND n_live_tup > 100000 ORDER BY seq_tup_read DESC LIMIT 5;','…','大表上的大量顺序扫描，常指向缺失的索引。']]);
Quiz(document.getElementById('qs'),[
['两列相关导致估算严重偏低，应该？',['加大 work_mem','CREATE STATISTICS','关闭 nestloop'],1,''],
['外层 5 行、内层有索引，最可能的连接方式？',['Nested Loop','Hash Join','Merge Join'],0,''],
['Hash Join 支持哪种连接条件？',['任意','只有等值','只有范围'],1,''],
['深分页 OFFSET 100000 的问题是？',['要产生并丢弃 10 万行','不支持','结果不确定'],0,'用键集分页。'],
['NOT IN (子查询) 的主要陷阱是？',['子查询返回 NULL 时结果为空','语法错误','只能用于数字'],0,'']]);
