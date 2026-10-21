const S=(t,s,c='',w=110)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});const P=(t,c='sig')=>({cls:'pill '+c,html:t});
const pg=i=>S('页 '+i,'约 70 行','',90);const e={n:{w:700,cls:'tag'},ix:{w:230,h:150,cls:'frame',html:'<i>索引 orders_user_id_idx（有序）</i>'},k1:P('user_id 41 → (12,3) (88,7) …','mute'),k2:P('user_id 42 → (5,9) (19,2) (301,4) …','sig'),k3:P('user_id 43 → (7,1) …','mute'),cost:P('读 1,370 页','bad'),cost2:P('读 3 个索引页 + 118 个表页','ok')};for(let i=0;i<8;i++)e['p'+i]=pg(i);
const pages=(hl,cls='sig')=>{const o={};for(let i=0;i<8;i++)o['p'+i]=[300+(i%4)*100,Math.floor(i/4)*60,{cls:hl.includes(i)?'blk '+cls:'blk'}];return o};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'表是一堆页',p:'表的数据存放在 8 KB 的页（堆）中，行没有特定顺序。10 万笔订单约占 1,370 页。',set:pages([])},
 {t:'顺序扫描',p:'没有索引时，为了找 user_id = 42 的订单，只能读出每一页、检查每一行。结果只有 118 行，却读了全部页面。',d:4000,set:{...pages([0,1,2,3,4,5,6,7]),cost:[300,140]}},
 {t:'B-tree 索引',p:'索引是另一份按 user_id 排序的结构，每个键指向行在表中的位置（页号, 行号）。像书末的索引：先在有序的目录里定位，再翻到对应页。',d:4200,set:{...pages([]),ix:[0,0],k1:[10,40],k2:[10,75],k3:[10,110]}},
 {t:'索引扫描',p:'沿 B-tree 找到 42，只读几个索引页，再按位置去取表中的行。匹配的行越少，越划算；匹配大部分行时，跳来跳去的随机读反而不如顺序扫描。',d:4400,set:{...pages([1,5],'ok'),ix:[0,0],k1:[10,40],k2:[10,75],k3:[10,110],cost2:[300,140]}}]});
const I=[['h','表（堆）','追加一行'],['i1','orders_pkey','插入 id'],['i2','user_id 索引','插入 user_id'],['i3','created_at 索引','插入 created_at'],['i4','status 索引','插入 status']];
const e2={n:{w:700,cls:'tag'},w:P('WAL 记录也随之增加','mute'),u:P('UPDATE status：通常要为新行版本在每个索引中插入条目（除非是 HOT 更新，第 15 课）','mute')};I.forEach(([k,t,s])=>e2[k]=S(t,s,'',130));
const ws=n=>{const o={};I.forEach(([k],i)=>o[k]=[i*140,40,{cls:i<n?'blk sig':'blk mute'}]);return o};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'INSERT',p:'插入一行，先把行追加到表的某一页。',set:ws(1)},
 {t:'维护每个索引',p:'然后在每一个索引中找到正确的位置插入条目。4 个索引意味着 1 次表写入加 4 次 B-tree 插入，可能还要分裂页。',d:4000,set:{...ws(5),w:[0,120]}},
 {t:'UPDATE 也一样',p:'PostgreSQL 的 UPDATE 写入一个新的行版本。如果被修改的列有索引，或者新版本放不进同一页，所有索引都要插入指向新版本的条目。',d:4200,set:{...ws(5),u:[0,120]}},
 {t:'取舍',p:'读多写少的表可以多建几个索引；写入密集的表（日志、事件）只保留真正需要的。定期检查 idx_scan 为 0 的索引并删除。',d:3800,set:ws(3)}]});
(()=>{const Q=[['WHERE user_id = 42','Index Scan using orders_u_s_c_idx\n  Index Cond: (user_id = 42)','ok','最左列等值：可以用，扫描 user_id = 42 的整段。'],
  ["WHERE user_id = 42 AND status = 'paid'","Index Scan using orders_u_s_c_idx\n  Index Cond: ((user_id = 42) AND (status = 'paid'))",'ok','前两列等值：范围更窄。'],
  ["WHERE user_id = 42 AND status = 'paid' ORDER BY created_at DESC LIMIT 10","Limit\n  ->  Index Scan Backward using orders_u_s_c_idx\n        Index Cond: ((user_id = 42) AND (status = 'paid'))",'ok','三列全部用上：前两列定位，第三列的顺序直接满足 ORDER BY，反向扫描取前 10 行就停，不需要排序。'],
  ['WHERE user_id = 42 ORDER BY created_at DESC LIMIT 10',"Limit\n  ->  Sort  (Sort Key: created_at DESC)\n        ->  Index Scan using orders_u_s_c_idx\n              Index Cond: (user_id = 42)",'','能用来过滤 user_id，但 user_id = 42 的条目先按 status 排序、再按 created_at，整体并不按时间有序，所以还要排序。中间“跳过”了 status 列。'],
  ["WHERE status = 'paid'","Seq Scan on orders\n  Filter: (status = 'paid')",'bad','不含最左列：B-tree 不能直接定位（PostgreSQL 18 的 skip scan 在最左列取值很少时可以跳着扫描，但 user_id 有 900 个不同值，规划器不会选）。这个查询还会返回一半的行，本来就该顺序扫描。'],
  ["WHERE user_id = 42 AND created_at > now() - interval '7 days'","Index Scan using orders_u_s_c_idx\n  Index Cond: ((user_id = 42) AND (created_at > …))",'','能用，但 created_at 条件只能在每个 status 分组内部逐一检查，效率不如 (user_id, created_at) 索引。'],
  ['WHERE user_id IN (1, 2, 3)','Index Scan using orders_u_s_c_idx\n  Index Cond: (user_id = ANY (\'{1,2,3}\'::integer[]))','ok','IN 列表等同于多个等值查找。'],
  ["WHERE user_id::text = '42'",'Seq Scan on orders\n  Filter: ((user_id)::text = \'42\'::text)','bad','对索引列做了类型转换，表达式和索引不一致，不能用。常见于 ORM 传错参数类型。']];
 const iq=document.getElementById('iq'),ip=document.getElementById('ip'),im=document.getElementById('im');
 Q.forEach(([q],i)=>{const b=document.createElement('button');b.className='btn';b.dataset.v=i;b.textContent=q;b.addEventListener('click',()=>{iq.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));const [q2,p,c,m]=Q[i];ip.textContent='EXPLAIN SELECT * FROM orders '+q2+';\n\n'+p;im.className='msg '+c;im.innerHTML=m});iq.appendChild(b)});
 im.className='msg';im.innerHTML='索引先按 user_id 排序，同一 user_id 内按 status，再按 created_at。'})();
Term(document.getElementById('t4'),[
['\\di+ orders*','                         List of relations\n       Name         | Type  |  Table | Size\n--------------------+-------+--------+---------\n orders_pkey        | index | orders | 2208 kB\n orders_user_id_idx | index | orders | 712 kB','表上的索引及大小。'],
['CREATE INDEX CONCURRENTLY orders_created_idx ON orders (created_at);','CREATE INDEX','不阻塞写入地建索引。不能放在事务块中。'],
['SELECT indexrelid::regclass FROM pg_index WHERE NOT indisvalid;',' indexrelid\n------------\n(0 rows)','CONCURRENTLY 失败会留下无效索引，用这条查出来，DROP 后重建。'],
['SELECT relname, indexrelname, idx_scan FROM pg_stat_user_indexes WHERE idx_scan = 0 AND indexrelname NOT LIKE \'%pkey\';',' relname |  indexrelname   | idx_scan\n---------+-----------------+----------\n orders  | orders_status_idx |        0','从未被使用的索引（统计自上次重置）。删除前确认主库和所有副本上都没有使用。'],
['REINDEX INDEX CONCURRENTLY orders_user_id_idx;','REINDEX','重建膨胀的索引，不阻塞写入。'],
['SELECT pg_size_pretty(pg_table_size(\'orders\')) AS table, pg_size_pretty(pg_indexes_size(\'orders\')) AS indexes;',' table  | indexes\n--------+---------\n 11 MB  | 2920 kB','索引总大小与表大小的比较。']]);
Quiz(document.getElementById('qs'),[
['外键列 orders.user_id 会自动建索引吗？',['会','不会，需要手动创建','只有 ON DELETE CASCADE 时会'],1,'只有主键和唯一约束会。'],
['索引 (a, b) 对哪个查询帮助最小？',['WHERE a = 1','WHERE a = 1 AND b = 2','WHERE b = 2'],2,'不含最左列。'],
['有索引，但查询返回表中 60% 的行，规划器通常？',['用索引扫描','用顺序扫描','报错'],1,'大量随机读不如顺序读。'],
['生产环境中给大表加索引，应该用？',['CREATE INDEX','CREATE INDEX CONCURRENTLY','先锁表再建'],1,'不阻塞写入。']]);
