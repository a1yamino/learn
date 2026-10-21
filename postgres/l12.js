const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,c='',w=130,h=40)=>({w,h,cls:'blk '+c,html:t});
const e={sql:B('SQL 文本','',100),pa:B('解析','',100),rw:B('分析 / 重写','',110),pl:B('规划器','',100),ex:B('执行器','',100),c1:P('Seq Scan · cost 2137','mute'),c2:P('Index Scan · cost 318','ok'),c3:P('Bitmap Scan · cost 420','mute'),st:P('依据：pg_class 页数行数、pg_stats 分布、代价参数','sig'),pull:P('计划树：父节点向子节点逐行拉取','sig')};
const L={sql:[0,0],pa:[120,0],rw:[240,0],pl:[370,0],ex:[490,0]};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'解析与重写',p:'检查语法，生成解析树；解析表名、列名和类型，把视图展开成子查询。',set:{...L,pa:[120,0,{cls:'blk sig'}],rw:[240,0,{cls:'blk sig'}]}},
 {t:'生成候选路径',p:'对每张表考虑顺序扫描和每个可用索引；对每对表考虑三种连接算法和不同的连接顺序。',d:4000,set:{...L,pl:[370,0,{cls:'blk sig'}],c1:[300,70],c2:[300,110],c3:[300,150]}},
 {t:'估代价，选最便宜',p:'代价来自统计信息和代价参数。规划器不执行查询，所以估算错了，选择也会错。',d:4000,set:{...L,pl:[370,0,{cls:'blk ok'}],c1:[300,70],c2:[300,110,{cls:'pill ok'}],c3:[300,150],st:[0,200]}},
 {t:'执行',p:'执行器从根节点开始向下要行，每个节点按需从子节点拉取（迭代器模型）。LIMIT 拿够行数就停，子节点也随之停止。',d:4000,set:{...L,ex:[490,0,{cls:'blk ok'}],pull:[0,70]}}]});
const e2={a:B('HashAggregate<br><span style="font-size:11px;opacity:.7">rows=9</span>','',170,44),n:B('Nested Loop<br><span style="font-size:11px;opacity:.7">rows=1012</span>','',170,44),u:B('Index Scan users<br><span style="font-size:11px;opacity:.7">rows=9 · loops=1</span>','',190,44),o:B('Index Scan orders<br><span style="font-size:11px;opacity:.7">rows=112 · loops=9</span>','',190,44),x:P('外层每输出 1 行，内层执行 1 次','sig'),t:P('内层总行数 ≈ 112 × 9 = 1008','ok'),g:P('先读最深的节点','sig')};
const T={a:[200,0],n:[200,70],u:[60,140],o:[300,140]};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'树形结构',p:'EXPLAIN 的缩进就是树：HashAggregate 的子节点是 Nested Loop，Nested Loop 有两个子节点。',set:T},
 {t:'从最深处开始',p:'先看叶子：users 用主键索引取出 9 行。',d:3400,set:{...T,u:[60,140,{cls:'blk sig'}],g:[0,200]}},
 {t:'loops',p:'Nested Loop 对外层的每一行执行一次内层：orders 的索引扫描执行了 9 次，每次平均 112 行。actual time 也是每次循环的平均值。',d:4400,set:{...T,u:[60,140,{cls:'blk sig'}],o:[300,140,{cls:'blk sig'}],x:[0,200],t:[260,200]}},
 {t:'向上汇总',p:'1012 行交给 HashAggregate 按 name 分组，输出 9 行。',d:3600,set:{...T,n:[200,70,{cls:'blk ok'}],a:[200,0,{cls:'blk ok'}]}}]});
(()=>{const L=[[' Sort  (cost=2380.11..2405.11 rows=10000 width=29) (actual time=24.3..25.1 rows=9981 loops=1)','cost 启动..总代价：Sort 必须读完所有输入才能输出第一行，所以启动代价接近总代价。'],
['   Sort Key: amount DESC','排序键。'],
['   Sort Method: external merge  Disk: 432kB','排序超过了 work_mem（默认 4 MB 对应的工作内存），溢出到磁盘。适当调大 work_mem 可以改为内存中的 quicksort。','bad'],
['   ->  Seq Scan on orders  (cost=0.00..2137.00 rows=10050 width=29) (actual time=0.015..12.801 rows=9981 loops=1)','估算 10050 行，实际 9981 行：估算准确。启动代价 0，可以立即输出行。','ok'],
['         Filter: (amount > 900)','过滤条件在扫描时逐行判断，不能用索引。'],
['         Rows Removed by Filter: 90019','读了 10 万行，丢掉 9 万行。去掉的比例很高时，考虑建索引。','sig'],
[' Planning Time: 0.120 ms','规划耗时。复杂查询（很多表连接）这里可能很大。'],
[' Execution Time: 25.912 ms','总执行时间，不包括把结果发送给客户端的网络时间。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');q.style.flexDirection='column';q.style.alignItems='stretch';
 L.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.style.cssText='text-align:left;font-family:var(--mono,monospace);font-size:12px;white-space:pre-wrap;word-break:break-all;border-radius:8px';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent='EXPLAIN ANALYZE SELECT * FROM orders WHERE amount > 900 ORDER BY amount DESC;\n\n'+t.trim();m.className='msg '+(L[i][2]||'');m.innerHTML=L[i][1]});q.appendChild(b)});
 m.className='msg';m.innerHTML='EXPLAIN ANALYZE SELECT * FROM orders WHERE amount &gt; 900 ORDER BY amount DESC;'})();
Term(document.getElementById('t4'),[
['EXPLAIN (ANALYZE, BUFFERS, VERBOSE, SETTINGS) SELECT …;','…','VERBOSE 显示输出列和 schema；SETTINGS 列出与默认值不同、影响规划的参数。'],
['EXPLAIN (FORMAT JSON) SELECT …;','[ { "Plan": { "Node Type": "Seq Scan", … } } ]','JSON 格式适合粘贴到 explain.dalibo.com 等可视化工具。'],
['EXPLAIN (GENERIC_PLAN) SELECT * FROM orders WHERE user_id = $1;',' Index Scan using orders_user_id_idx on orders  (cost=0.29..…)\n   Index Cond: (user_id = $1)','PostgreSQL 16+：不给参数值也能看带占位符的通用计划。'],
['SET random_page_cost = 1.1;','SET','SSD 上随机读和顺序读差距小，调低后规划器更愿意用索引。可以 ALTER SYSTEM 全局设置。'],
['SHOW work_mem;',' work_mem\n----------\n 4MB','每个排序或哈希节点可用的内存。一个查询可能有多个节点，连接数 × 节点数 × work_mem 才是最坏情况。'],
['LOAD \'auto_explain\'; SET auto_explain.log_min_duration = \'500ms\'; SET auto_explain.log_analyze = on;','LOAD','把超过 500 ms 的查询计划自动写入日志。生产常在 session_preload_libraries 中加载。']]);
Quiz(document.getElementById('qs'),[
['cost=0.00..2137.00 中 2137 的单位是？',['毫秒','抽象代价单位（≈ 顺序读一页）','字节'],1,''],
['EXPLAIN ANALYZE 会执行语句吗？',['会','不会','只执行 SELECT'],0,'写语句要放在事务中回滚。'],
['内层节点 actual time=0.04 rows=112 loops=9，它总共输出约？',['112 行','1008 行','9 行'],1,''],
['Sort Method: external merge Disk 说明？',['排序溢出到磁盘，work_mem 不够','使用了索引','并行排序'],0,''],
['估算 rows=5，实际 rows=50000，首先怀疑？',['磁盘慢','统计信息或估算问题','网络'],1,'']]);
