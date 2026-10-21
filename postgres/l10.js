const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,c='',w=130,h=40)=>({w,h,cls:'blk '+c,html:t});
const e={meta:B('元页 · root=3','mute',130),root:B('根：| 300 | 600 |','',200),i1:B('内部：| 100 | 200 |','',150),i2:B('内部：| 400 | 500 |','',150),i3:B('内部：| 700 | 800 |','',150),l1:B('叶：401…450','',100),l2:B('叶：451…499','',100),l3:B('叶：500…549','',100),h:B('堆页 (88,7)','',120),q:P('WHERE id = 466','sig'),c:P('读 4 个索引页 + 1 个堆页','ok'),rg:P('BETWEEN 440 AND 520：沿叶子链表向右','ok')};
const T={meta:[0,0],root:[200,0],i1:[0,70],i2:[200,70],i3:[400,70],l1:[90,140],l2:[200,140],l3:[310,140]};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'结构',p:'元页指向根。根和内部页存分隔键，叶子页存键和 ctid。同层的页左右相连。',set:T},
 {t:'从根往下',p:'查 466：在根页二分，300 ≤ 466 < 600，进入中间的内部页；400 ≤ 466 < 500，进入对应叶子页。',d:4200,set:{...T,root:[200,0,{cls:'blk sig'}],i2:[200,70,{cls:'blk sig'}],l2:[200,140,{cls:'blk sig'}],q:[420,0]}},
 {t:'回表',p:'叶子中找到 466 → (88,7)，再读堆页取整行。树高 3 层加元页（元页通常常驻缓存）。',d:3800,set:{...T,l2:[200,140,{cls:'blk ok'}],h:[420,140,{cls:'blk ok'}],c:[420,200]}},
 {t:'范围扫描',p:'范围查询找到起点后，不必再回到根：沿叶子页的右指针逐页读，直到超过上界。',d:3800,set:{...T,l1:[90,140,{cls:'blk ok'}],l2:[200,140,{cls:'blk ok'}],l3:[310,140,{cls:'blk ok'}],rg:[0,200]}}]});
const e2={par:B('父页：| 100 | 200 |','',200),a:B('叶 [101…199] 满','',160),a1:B('叶 [101…150]','ok',140),a2:B('新叶 [151…199]','ok',140),nk:P('插入 175','sig'),up:P('父页插入分隔键 151','sig'),pr:B('父页：| 100 | 151 | 200 |','ok',220),r:B('最右叶 [9001…9800] 满','',200),r1:B('[9001…9790]','ok',140),r2:B('新叶 [9791…]','ok',140),rn:P('自增键：只把最后少量键移到新页，旧页保持约 90% 满','sig')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'页满了',p:'要插入 175，目标叶子页已经没有空间。',set:{par:[100,0],a:[120,80,{cls:'blk bad'}],nk:[320,90]}},
 {t:'分裂',p:'申请一个新页，把大约一半的条目移过去，两页通过左右指针相连。',d:3800,set:{par:[100,0],a1:[30,80],a2:[200,80],nk:[360,90]}},
 {t:'向上插入',p:'在父页中插入新页的分隔键。父页也满了就继续向上分裂；根分裂时树高加一。',d:3800,set:{pr:[90,0],a1:[30,80],a2:[200,80],up:[340,10]}},
 {t:'最右分裂',p:'键单调递增时，新键总落在最右的叶子。对半分会让每个旧页只有一半满；PostgreSQL 识别这种情况，把分裂点放在靠右处。',d:4200,set:{r:[0,0],r1:[0,80],r2:[160,80],rn:[0,140]}}]});
(()=>{const Q=[['WHERE id = 466','元页（缓存）→ 根 → 内部 → 叶 → 堆页\n索引页 3 + 堆页 1\nIndex Scan using orders_pkey  Buffers: shared hit=4','ok','等值查找，深度决定页数，与表大小几乎无关（1000 万行也只有 3 层）。'],
['WHERE user_id = 42（命中 118 行）','根 → 内部 → 叶（118 个条目在 1 个叶子页上）\n回表：118 行分布在 112 个不同的堆页\nBitmap Heap Scan  Buffers: shared hit=3 read=112','sig','索引部分只读 3 页，主要开销在回表：行分散在不同的堆页。规划器改用 Bitmap 扫描，先收集所有 ctid、按页号排序再读。'],
['SELECT user_id, amount … WHERE user_id = 42（覆盖索引 INCLUDE amount）','根 → 内部 → 叶\n可见性映射：112 个堆页中 110 页全部可见\nIndex Only Scan  Heap Fetches: 2  Buffers: shared hit=7','ok','所需列都在索引里，只对 2 个不是全部可见的页回表。刚大量更新、还没 VACUUM 时 Heap Fetches 会很高。'],
['WHERE id > 9990000 ORDER BY id LIMIT 10','定位到最右的叶子，顺着链表读 10 个条目即停\nLimit → Index Scan  Buffers: shared hit=5','ok','有序存储让 ORDER BY + LIMIT 不需要排序，也不需要读完所有匹配行。'],
['WHERE id::text = \'466\'','索引里存的是 bigint，不能用来比较 text\nSeq Scan  Buffers: shared read=137000','bad','表达式与索引不一致，退化为顺序扫描 1000 万行。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent=Q[i][1];m.className='msg '+Q[i][2];m.innerHTML=Q[i][3]});q.appendChild(b)});
 m.className='msg';m.innerHTML='orders_pkey 与 user_id 索引都是 3 层。'})();
Term(document.getElementById('t4'),[
['SELECT * FROM bt_metap(\'orders_pkey\');',' magic  | version | root | level | fastroot | fastlevel | … | allequalimage\n--------+---------+------+-------+----------+-----------+---+--------------\n 340322 |       4 |  412 |     2 |      412 |         2 |   | t','level 是根所在层（叶子为 0），所以树高是 level + 1。allequalimage = t 表示可以去重。'],
['SELECT blkno, type, live_items, dead_items, avg_item_size, free_size FROM bt_page_stats(\'orders_pkey\', 1);',' blkno | type | live_items | dead_items | avg_item_size | free_size\n-------+------+------------+------------+---------------+-----------\n     1 | l    |        367 |          0 |            16 |       808','type：r 根、i 内部、l 叶子。'],
['CREATE EXTENSION pgstattuple;\nSELECT tree_level, leaf_pages, avg_leaf_density, leaf_fragmentation FROM pgstatindex(\'orders_pkey\');',' tree_level | leaf_pages | avg_leaf_density | leaf_fragmentation\n------------+------------+------------------+--------------------\n          1 |        274 |            90.08 |                  0','密度低、碎片高说明膨胀。'],
['CREATE INDEX ON orders (user_id) WITH (fillfactor = 70);','CREATE INDEX','叶子页只填到 70%，给随机插入留空间，减少分裂。默认 90。'],
['SELECT relname, n_tup_ins, n_tup_upd, n_tup_hot_upd FROM pg_stat_user_tables WHERE relname = \'orders\';',' relname | n_tup_ins | n_tup_upd | n_tup_hot_upd\n---------+-----------+-----------+---------------\n orders  |    100000 |    200004 |        198112','HOT 更新不需要修改索引（第 15 课）。'],
['REINDEX INDEX CONCURRENTLY orders_pkey;','REINDEX','重建并替换，不阻塞读写。']]);
Quiz(document.getElementById('qs'),[
['B-tree 叶子页存的是？',['整行数据','键和堆元组 ctid','只有键'],1,''],
['1 亿行表的 B-tree 一次等值查找大约读几个索引页？',['3–4','~27','~1000'],0,'扇出很大。'],
['范围扫描怎么从一页走到下一页？',['每次回到根','沿叶子页的兄弟指针','扫描全部叶子'],1,''],
['Index Only Scan 显示 Heap Fetches 很高，通常因为？',['索引损坏','可见性映射没有更新，需要 VACUUM','缓存太小'],1,''],
['哪种主键对 B-tree 插入最不友好？',['bigint 自增','UUIDv7','随机 UUIDv4'],2,'']]);
