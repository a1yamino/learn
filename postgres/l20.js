const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=110)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const M=['07','08','09','10','11'];const e={par:B('events','父表 · 不存数据','sig',200),q1:P("WHERE created_at >= '2026-10-01'",'sig'),q2:P('WHERE user_id = 42：没有分区键，全部扫描','bad'),q3:P('WHERE created_at > now() - interval \'3 days\'：执行时裁剪','ok'),ix:P('每个分区有自己的索引，更小、更容易放进内存','mute')};M.forEach(m=>e['m'+m]=B('2026_'+m,'约 2 亿行'));
const row=(hl,c='ok')=>{const o={par:[220,0]};M.forEach((m,i)=>o['m'+m]=[i*125,80,{cls:'blk '+(hl===true||hl.includes(m)?c:'mute')}]);return o};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'按月分区',p:'父表 events 是逻辑上的一张表；数据存在每个月的分区里。',set:{...row(true,''),ix:[0,150]}},
 {t:'规划时裁剪',p:'条件是常量，规划器直接排除 7、8、9 月。计划里只出现需要的分区。',d:3800,set:{...row(['10','11']),q1:[0,150]}},
 {t:'执行时裁剪',p:'now() 在规划时不是常量，但执行开始时可以计算，仍然能跳过分区。EXPLAIN 中显示 Subplans Removed。',d:3800,set:{...row(['10']),q3:[0,150]}},
 {t:'没有分区键',p:'只按 user_id 查询，每个分区都要查一遍各自的索引。分区键应该出现在大多数查询中。',d:3800,set:{...row(true,'bad'),q2:[0,150]}}]});
const e2={a:B('DELETE … WHERE created_at < \'2026-08-01\'','2 亿行','bad',300),a1:P('写 2 亿条 WAL 记录，持续数小时','bad'),a2:P('留下 2 亿个死元组，等 VACUUM，表和索引都膨胀','bad'),b:B('DETACH PARTITION … CONCURRENTLY + DROP','events_2026_07','ok',300),b1:P('只改系统目录，删除文件：几秒','ok'),b2:P('没有死元组，其他分区不受影响','ok'),c:P('提前创建下个月的分区（pg_partman / 定时任务）','sig')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'不分区：DELETE',p:'删除一个月的数据要逐行标记删除、写 WAL、更新每个索引。',set:{a:[0,0]}},
 {t:'代价',p:'长时间运行的大事务、大量 WAL 拖慢复制，还要靠 VACUUM 慢慢回收。',d:3600,set:{a:[0,0],a1:[0,60],a2:[0,100]}},
 {t:'分区：DROP',p:'过期的数据整块在一个分区里。先 DETACH（CONCURRENTLY 不阻塞查询），再 DROP 表。',d:3800,set:{b:[0,0],b1:[0,60],b2:[0,100]}},
 {t:'滚动窗口',p:'每月新建一个分区、删掉最老的一个，表的大小保持稳定。忘了建新分区时，写入会报错或进入 DEFAULT 分区。',d:3800,set:{b:[0,0],b1:[0,60],c:[0,100]}}]});
(()=>{const Q=[["WHERE created_at >= '2026-10-01' AND created_at < '2026-10-08'","Index Scan using events_2026_10_created_at_idx on events_2026_10 events\n  Index Cond: …",'ok','只扫描 10 月分区。'],
["WHERE created_at > now() - interval '7 days'","Append\n  Subplans Removed: 11\n  ->  Index Scan … on events_2026_10 events_1",'ok','执行时裁剪。'],
["WHERE user_id = 42","Append\n  ->  Index Scan using events_2026_01_user_id_idx …\n  ->  Index Scan using events_2026_02_user_id_idx …\n  … （12 个分区）",'bad','每个分区都要查一次。如果这是主要查询，应考虑按 user_id 做 HASH 分区，或者不分区。'],
["WHERE date_trunc('month', created_at) = '2026-10-01'","Append\n  ->  Seq Scan on events_2026_01 … Filter: (date_trunc(…) = …)\n  … （12 个分区）",'bad','对分区键做了函数运算，规划器无法推导出范围，裁剪失败。改写为范围条件。'],
["WHERE created_at::date = '2026-10-21'","Append（12 个分区）",'bad','timestamptz 转 date 依赖时区设置，不是不可变的，同样无法裁剪。'],
["WHERE created_at >= (SELECT max(created_at) FROM checkpoints)","Append\n  InitPlan 1\n  ->  Seq Scan on events_2026_01 (never executed)\n  …\n  ->  Seq Scan on events_2026_10 (actual rows=…)",'ok','子查询的结果在执行时才知道，未用到的分区标为 never executed。'],
["SELECT … ORDER BY created_at DESC LIMIT 10（无 WHERE）","Limit\n  ->  Append（按分区倒序）\n        ->  Index Scan Backward … on events_2026_12\n        ->  Index Scan Backward … on events_2026_11 (never executed)",'ok','分区按范围有序，Append 可以按顺序依次读取，拿够 10 行就停，不必合并排序。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent='EXPLAIN SELECT * FROM events '+Q[i][0]+';\n\n'+Q[i][1];m.className='msg '+Q[i][2];m.innerHTML=Q[i][3]});q.appendChild(b)});
 m.className='msg';m.innerHTML='分区键 created_at，每个分区上有 (created_at) 和 (user_id) 索引。'})();
Term(document.getElementById('t4'),[
['\\d+ events','                    Partitioned table "public.events"\n…\nPartition key: RANGE (created_at)\nPartitions: events_2026_09 FOR VALUES FROM (\'2026-09-01 …\') TO (\'2026-10-01 …\'),\n            events_2026_10 FOR VALUES FROM …,\n            events_default DEFAULT','分区键和所有分区。'],
['SELECT * FROM pg_partition_tree(\'events\');','     relid      | parentrelid | isleaf | level\n----------------+-------------+--------+-------\n events         |             | f      |     0\n events_2026_09 | events      | t      |     1\n …','分区树，支持多级分区。'],
['CREATE TABLE events_2026_11 (LIKE events INCLUDING ALL);\nALTER TABLE events_2026_11 ADD CONSTRAINT c CHECK (created_at >= \'2026-11-01\' AND created_at < \'2026-12-01\');\nALTER TABLE events ATTACH PARTITION events_2026_11 FOR VALUES FROM (\'2026-11-01\') TO (\'2026-12-01\');','ALTER TABLE','先建好再挂载：已有的 CHECK 约束让 ATTACH 跳过全表验证。'],
['ALTER TABLE events DETACH PARTITION events_2026_08 CONCURRENTLY;','ALTER TABLE','降低父表锁级别；不能在事务块中执行，父表有 DEFAULT 分区时也不允许。此时应使用普通 DETACH，并设置较短的 lock_timeout。'],
['SHOW enable_partition_pruning;',' enable_partition_pruning\n--------------------------\n on','默认开启。'],
['CREATE EXTENSION pg_partman;\nSELECT partman.create_parent(\'public.events\', \'created_at\', \'1 month\', p_premake => 3);','…','pg_partman 自动预建分区、按保留期删除旧分区，配合其后台进程或定时任务运行。']]);
Quiz(document.getElementById('qs'),[
['按时间分区的表上，主键必须？',['包含分区键','只用 id','不能有主键'],0,''],
['删除一个月的旧数据最好用？',['DELETE','DETACH + DROP 分区','TRUNCATE 父表'],1,''],
["WHERE date_trunc('month', created_at) = … 能裁剪吗？",['能','不能','只能在执行时'],1,'写成范围条件。'],
['查询大多不带分区键，分区会？',['更快','可能更慢','没影响'],1,''],
['ATTACH PARTITION 前加 CHECK 约束是为了？',['避免扫描验证','提高查询速度','让索引生效'],0,'']]);
