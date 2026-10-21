const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,c='',w=170,h=36)=>({w,h,cls:'blk '+c,html:t});
const e={r1:B("行 1：{red, sale}"),r2:B("行 2：{blue}"),r3:B("行 3：{red, new}"),k1:B('red → 1, 3','',130),k2:B('blue → 2','',130),k3:B('sale → 1','',130),k4:B('new → 3','',130),q:P("tags @> '{red,new}'",'sig'),ans:P('red ∩ new = {3}','ok'),w:P('更新一行：要改它的每个元素的列表 → 写入慢，先进待处理列表','bad')};
const R={r1:[0,0],r2:[0,46],r3:[0,92]},K={k1:[260,0],k2:[260,46],k3:[260,92],k4:[260,138]};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'一行多个值',p:'tags 是数组。B-tree 只能把整个数组当作一个值排序，无法回答“包含 red 的行”。',set:R},
 {t:'倒排',p:'GIN 把每行拆成元素，为每个元素保存包含它的行列表（posting list）。元素本身用 B-tree 组织。',d:4000,set:{...R,...K}},
 {t:'查询',p:'包含 red 和 new：分别取两个列表求交集，得到行 3。jsonb 的键、全文检索的词元都是同样的道理。',d:4000,set:{...R,...K,k1:[260,0,{cls:'blk ok'}],k4:[260,138,{cls:'blk ok'}],q:[460,0],ans:[460,46]}},
 {t:'代价',p:'插入一行要更新多个列表。fastupdate 先把新条目追加到待处理列表，VACUUM 或列表超过 gin_pending_list_limit 时再合并。',d:4000,set:{...R,...K,w:[0,190]}}]});
const e2={};const rng=['01-01 00:00–02:10','01-01 02:10–04:20','01-01 04:20–06:30','01-01 06:30–08:40','01-01 08:40–10:50','01-01 10:50–13:00'];
rng.forEach((r,i)=>e2['g'+i]=B('页 '+(i*128)+'–'+(i*128+127)+'<br><span style="font-size:11px;opacity:.7">'+r+'</span>','',190,44));
e2.q=P("ts BETWEEN '05:00' AND '07:00'",'sig');e2.s=P('只扫描 2 段 = 256 页','ok');e2.sz=P('5 亿行：B-tree 10 GB，BRIN 约 1 MB','sig');e2.bad=P('如果数据按随机顺序写入：每段范围都覆盖全天 → 一段也跳不过','bad');
const G=(h={},cls='ok')=>{const o={};for(let i=0;i<6;i++)o['g'+i]=[(i%3)*200,Math.floor(i/3)*54,h[i]?{cls:'blk '+cls}:{cls:'blk'}];return o};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'每 128 页一段',p:'BRIN 为每段连续的堆页只存一条摘要：这段里 ts 的最小值和最大值。',set:{...G(),sz:[0,120]}},
 {t:'查询',p:'查 05:00 到 07:00：逐条比较摘要，只有两段的范围与查询相交。其他段整个跳过。',d:4000,set:{...G({2:1,3:1}),q:[0,120],s:[260,120]}},
 {t:'需要相关性',p:'BRIN 的前提是物理顺序和列值相关。日志表按时间追加，天然满足；随机更新或乱序导入会让每段的范围都很宽。',d:4200,set:{...G({0:1,1:1,2:1,3:1,4:1,5:1},'bad'),bad:[0,120]}}]});
(()=>{const Q=[["WHERE attrs @> '{\"color\":\"red\"}'","CREATE INDEX ON products USING gin (attrs jsonb_path_ops);",'ok','jsonb 包含查询。只用 @> 时 jsonb_path_ops 更小更快；需要 ? 判断键是否存在时用默认的 jsonb_ops。'],
["WHERE lower(email) = lower($1)","CREATE UNIQUE INDEX ON users (lower(email));",'ok','表达式索引，同时保证大小写不敏感的唯一性。也可以考虑 citext 类型或非确定性排序规则。'],
["WHERE name ILIKE '%phone%'","CREATE EXTENSION pg_trgm;\nCREATE INDEX ON products USING gin (name gin_trgm_ops);",'ok','前后都有通配符，B-tree 无能为力。三元组（trigram）GIN 索引把字符串拆成 3 字符片段，支持 LIKE/ILIKE/正则和相似度。'],
["WHERE status = 'pending' AND created_at < now() - '1 hour'（pending 占 0.5%）","CREATE INDEX ON orders (created_at) WHERE status = 'pending';",'ok','部分索引只包含 0.5% 的行，体积小，非 pending 订单的更新不触及它。'],
["WHERE ts >= now() - '1 day'（10 亿行只追加日志）","CREATE INDEX ON logs USING brin (ts);",'ok','数据按时间追加，BRIN 几 MB 就够，B-tree 要几十 GB。查询多是大范围扫描，BRIN 正合适。'],
["WHERE to_tsvector('simple', body) @@ to_tsquery('simple', 'postgres & wal')","CREATE INDEX ON docs USING gin (to_tsvector('simple', body));",'','全文检索的表达式 GIN 索引。更好的做法是加一个生成列 tsv tsvector GENERATED ALWAYS AS (…) STORED 再索引它，查询更简单。中文分词需要 zhparser 等扩展。'],
["ORDER BY location <-> point(121.5, 25.0) LIMIT 10","CREATE INDEX ON shops USING gist (location);",'ok','GiST 支持按距离的最近邻搜索，不需要算出所有行的距离再排序。地理坐标通常用 PostGIS。'],
["WHERE user_id = $1 AND deleted_at IS NULL（唯一）","CREATE UNIQUE INDEX ON accounts (user_id) WHERE deleted_at IS NULL;",'ok','部分唯一索引：每个用户最多一个未删除的账号，已软删除的不受限制。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent=Q[i][1];m.className='msg '+Q[i][2];m.innerHTML=Q[i][3]});q.appendChild(b)});
 m.className='msg';m.innerHTML='每个查询都是高频接口。'})();
Term(document.getElementById('t4'),[
['SELECT amname FROM pg_am WHERE amtype = \'i\';',' amname\n--------\n btree\n hash\n gist\n gin\n spgist\n brin','内置的索引访问方法。'],
['SELECT opcname FROM pg_opclass c JOIN pg_am a ON a.oid = c.opcmethod WHERE amname = \'gin\';','     opcname\n------------------\n array_ops\n jsonb_ops\n jsonb_path_ops\n tsvector_ops\n …','GIN 的运算符类，决定能支持哪些运算符。'],
['SELECT * FROM brin_page_items(get_raw_page(\'logs_ts_brin\', 2), \'logs_ts_brin\') LIMIT 2;',' itemoffset | blknum | … |                       value\n------------+--------+---+---------------------------------------------------\n          1 |      0 |   | {2026-01-01 00:00:01+08 .. 2026-01-01 02:10:56+08}\n          2 |    128 |   | {2026-01-01 02:10:57+08 .. 2026-01-01 04:21:52+08}','每段的最小、最大值。'],
['SELECT correlation FROM pg_stats WHERE tablename = \'logs\' AND attname = \'ts\';',' correlation\n-------------\n           1','物理顺序与值的相关性，接近 ±1 才适合 BRIN。'],
['SELECT gin_clean_pending_list(\'products_tags_gin\');',' gin_clean_pending_list\n------------------------\n                    312','手动合并 GIN 待处理列表。'],
['CREATE INDEX ON logs USING brin (ts) WITH (pages_per_range = 32);','CREATE INDEX','更小的段，过滤更精确，索引稍大。']]);
Quiz(document.getElementById('qs'),[
['jsonb 的 @> 查询首选？',['B-tree','GIN','BRIN'],1,''],
['BRIN 适合？',['按时间追加的日志表','随机主键','经常更新的状态列'],0,''],
["name LIKE '%abc%' 可以用什么索引？",['B-tree','pg_trgm 的 GIN/GiST','Hash'],1,''],
['表达式索引 lower(email) 能被 WHERE email = ? 使用吗？',['能','不能','只有唯一索引能'],1,'表达式必须一致。'],
['防止时间段重叠用？',['UNIQUE','EXCLUDE USING gist','CHECK'],1,'']]);
