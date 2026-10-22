const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=140)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={u:B('用户请求','查我的订单 #4242'),db:{w:180,h:110,cls:'frame',html:'<i>orders 表</i><br>…<br>#4242 ¥99<br>…'},q1:P('按键读 1 行 · 1 ms','ok'),an:B('分析师','上月按城市的销售额'),q2:P('扫描 100 万行 · 聚合','sig'),dw:B('数据仓库','列式存储','ok',150)};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'OLTP',p:'事务型：按键读写少量记录，要求毫秒级延迟。',set:{u:[0,0],db:[200,20],q1:[0,70]}},
 {t:'OLAP',p:'分析型：扫描大量记录做聚合，查询临时多变。',d:3400,set:{u:[0,0],db:[200,20],q1:[0,70],an:[400,0],q2:[400,70]}},
 {t:'冲突',p:'在同一个库上跑大扫描会拖慢线上请求。',d:3400,set:{u:[0,0,B('用户请求','变慢了','bad')],db:[200,20],an:[400,0],q2:[400,70,P('扫描占满 I/O','bad')]}},
 {t:'分开',p:'把数据复制到专门的分析系统（数据仓库），各自使用合适的存储引擎。',d:3600,set:{u:[0,0],db:[200,20],q1:[0,70],an:[400,0],dw:[400,90]}}]});
const e2={a:B('订单库','记录系统','ok'),b:B('用户库','记录系统','ok'),etl:B('ETL / CDC','抽取、转换、加载','sig'),w:B('数据仓库','派生'),s:B('搜索索引','派生'),c:B('缓存','派生'),r:P('丢了可以重建','ok')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'记录系统',p:'数据第一次写入的地方，是事实的权威来源。',set:{a:[0,0],b:[0,70]}},
 {t:'管道',p:'变更通过 ETL 或 CDC 流出。',d:3000,set:{a:[0,0],b:[0,70],etl:[200,35]}},
 {t:'派生数据',p:'仓库、索引、缓存都是从记录系统转换而来。',d:3400,set:{a:[0,0],b:[0,70],etl:[200,35],w:[400,0],s:[400,70],c:[400,140]}},
 {t:'可重建',p:'派生数据出错或丢失时，从记录系统重新生成即可。',d:3200,set:{a:[0,0],b:[0,70],etl:[200,35],w:[400,0],s:[400,70],c:[400,140],r:[200,150]}}]});
(()=>{const S=[['PostgreSQL 订单表',['记录系统','丢失 → 只能从备份恢复，无法重建'],'ok'],['Redis 中的商品详情缓存',['派生数据','丢失 → 从数据库重新加载（缓存击穿时注意保护数据库）'],'sig'],['Elasticsearch 商品索引',['派生数据','丢失 → 从商品库全量重建索引'],'sig'],['Kafka 中的用户点击事件（保留 7 天）',['记录系统（行为事实的来源）','丢失 → 无法重建；需要长期保存时归档到对象存储'],'ok'],['数据仓库中的日销售汇总表',['派生数据','丢失 → 重新运行 ETL 计算'],'sig'],['物化视图 monthly',['派生数据','丢失 → REFRESH / 重新 CREATE'],'sig']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 S.forEach(([t,r,c])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));p.textContent=r.join('\n');m.className='msg '+c;m.innerHTML=c==='ok'?'它是事实来源，要重点保护（备份、复制）。':'它可以从别处算出来。'});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择一个数据存储。'})();
Term(document.getElementById('t4'),[
['EXPLAIN SELECT * FROM orders WHERE id = 424242;','Index Scan using orders_pkey on orders  (cost=0.42..8.44 rows=1 width=30)\n  Index Cond: (id = 424242)','OLTP：通过 B 树索引直接定位一行。'],
['EXPLAIN SELECT user_id % 100, sum(amount) FROM orders GROUP BY 1;','HashAggregate  (cost=… rows=…)\n  ->  Seq Scan on orders  (cost=0.00..16370.00 rows=1000000 width=10)','OLAP：顺序扫描全部行再聚合；行存储会读入所有列，列存储（第 8 课）只读需要的列。']]);
Quiz(document.getElementById('qs'),[
['哪一项是典型的 OLTP 查询？',['按订单号查询订单','统计去年每月销售额','训练推荐模型'],0,'OLTP 按键读写少量记录，延迟敏感。'],
['为什么通常把分析查询放到单独的数据仓库？',['数据仓库更便宜','大扫描会拖慢线上业务，且两类负载适合不同的存储引擎','业务库不支持 SQL'],1,'访问模式不同，分开后各自优化。'],
['下列哪个是派生数据？',['用户注册表','搜索索引','银行流水原始记录'],1,'索引由记录系统转换而来，可以重建。'],
['云原生数据库的典型架构特征是？',['存储与计算分离','只能单机运行','不使用对象存储'],0,'计算节点无状态，数据放在共享存储或对象存储中。'],
['GDPR 删除权对架构意味着？',['只需删除主库中的行','派生数据和备份中也要处理','不需要处理'],1,'数据会扩散到各个派生系统，要能追踪和删除。']]);
