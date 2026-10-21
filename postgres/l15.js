const P=(t,c='sig')=>({cls:'pill '+c,html:t});const V=(t,x,c='')=>({w:190,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${x}</span>`});
const e={v1:V('A = 100','xmin 900 · xmax 0'),v1b:V('A = 100','xmin 900 · xmax 901','dim'),v2:V('A = 70','xmin 901 · xmax 0'),v2b:V('A = 70','xmin 901 · xmax 902','dim'),ar:P('t_ctid →','mute'),ar2:P('t_ctid →','mute'),d:P('DELETE：只设置 xmax，不移走元组','sig'),idx:P('索引条目仍指向 (0,1)，沿链找到可见版本','sig')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'插入',p:'事务 900 插入 A。xmin = 900，xmax = 0。',set:{v1:[0,40]}},
 {t:'更新',p:'事务 901 更新 A：旧版本的 xmax 设为 901，插入新版本 xmin = 901。旧版本的 t_ctid 指向新版本，形成版本链。',d:4200,set:{v1b:[0,40],ar:[200,52],v2:[290,40,{cls:'blk ok'}]}},
 {t:'删除',p:'事务 902 删除 A：只把最新版本的 xmax 设为 902。两个旧版本都还在页里。',d:3800,set:{v1b:[0,40],ar:[200,52],v2b:[290,40],d:[0,110]}},
 {t:'谁看到哪个',p:'快照在 901 提交前取得的事务看到 100；在 901 提交后、902 提交前的看到 70；902 提交后开始的什么也看不到。旧版本直到没有任何快照需要时才能被 VACUUM 清理。',d:4600,set:{v1b:[0,40,{cls:'blk sig'}],ar:[200,52],v2b:[290,40,{cls:'blk sig'}],idx:[0,110]}}]});
const e2={tup:V('A = 70','xmin 901 · xmax 902','sig'),s1:{w:220,h:40,cls:'blk',html:'快照 S1 = 901:901:<br><span style="font-size:11px;opacity:.7">901 尚未开始</span>'},s2:{w:220,h:40,cls:'blk',html:'快照 S2 = 902:903:902<br><span style="font-size:11px;opacity:.7">901 已提交，902 进行中</span>'},s3:{w:220,h:40,cls:'blk',html:'快照 S3 = 903:903:<br><span style="font-size:11px;opacity:.7">902 已提交</span>'},r1:P('xmin 901 ≥ xmax 901 → 不可见','bad'),r2:P('xmin 已提交可见；xmax 902 在 xip 中 → 可见','ok'),r3:P('xmax 902 已提交且可见 → 已删除，不可见','bad')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'一个元组版本',p:'这个版本由 901 创建，被 902 删除。它可见与否取决于问的是谁。',set:{tup:[0,0]}},
 {t:'S1',p:'S1 取于 901 开始之前：901 在快照的 xmax 之外，被视为“未来”的事务，它创建的版本看不到（S1 会看到更早的 A = 100）。',d:4200,set:{tup:[0,0],s1:[0,70],r1:[240,76]}},
 {t:'S2',p:'S2 取于 901 提交后、902 提交前：创建者已提交且可见；删除者 902 还在进行中（在 xip 列表里），删除不算数。可见。',d:4400,set:{tup:[0,0],s1:[0,70],r1:[240,76],s2:[0,120],r2:[240,126]}},
 {t:'S3',p:'S3 取于 902 提交之后：删除已生效，不可见。三个快照在同一时刻可以并存，各自看到一致的数据库状态，互不阻塞。',d:4400,set:{tup:[0,0],s1:[0,70],r1:[240,76],s2:[0,120],r2:[240,126],s3:[0,170],r3:[240,176]}}]});
(()=>{const Q=[['xmin 98（已提交）· xmax 0',"xmin 98 < 快照 xmin 100 且已提交 → 创建可见\nxmax 0 → 未被删除\n结果：可见",'ok','最常见的情况：很早以前插入、没有被修改。'],
['xmin 102（已提交）· xmax 0',"xmin 102：100 ≤ 102 < 104，不在 xip {101,103} 中，且已提交 → 可见\nxmax 0\n结果：可见",'ok','102 在快照取得前已经提交。'],
['xmin 101 · xmax 0',"xmin 101 在 xip 中：取快照时仍在进行\n结果：不可见（即使 101 现在已经提交）",'bad','快照取得之后才提交的事务，对这个快照永远不可见。这就是 REPEATABLE READ 中数据不变的原因。'],
['xmin 105 · xmax 0',"xmin 105 ≥ 快照 xmax 104：快照之后才开始的事务\n结果：不可见",'bad',''],
['xmin 98 · xmax 103',"创建可见\nxmax 103 在 xip 中：删除者在快照时仍在进行 → 删除不算数\n结果：可见",'ok','103 正在删除或更新这一行，我们仍然看到旧版本。读不被写阻塞。'],
['xmin 98 · xmax 102',"创建可见\nxmax 102 已提交且对快照可见 → 已被删除\n结果：不可见",'bad','我们应该看到的是 102 创建的那个新版本（如果是 UPDATE 的话）。'],
['xmin 99（已中止）· xmax 0',"xmin 99 在 pg_xact 中是 ABORTED\n结果：不可见",'bad','回滚的事务插入的元组永远不可见，等 VACUUM 清理。'],
['xmin 98 · xmax 99（已中止）',"创建可见\nxmax 99 已中止 → 删除无效\n结果：可见",'ok','回滚的 UPDATE/DELETE 留下的 xmax 被忽略；之后会设置 XMAX_INVALID 提示位。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent='快照 100:104:{101,103}\n\n'+Q[i][1];m.className='msg '+Q[i][2];m.innerHTML=Q[i][3]});q.appendChild(b)});
 m.className='msg';m.innerHTML='快照 xmin = 100，xmax = 104，进行中 = {101, 103}。'})();
Term(document.getElementById('t4'),[
['SELECT pg_current_snapshot();',' pg_current_snapshot\n---------------------\n 951:953:951','xmin:xmax:进行中的事务列表。'],
['SELECT pg_xact_status(\'951\');',' pg_xact_status\n----------------\n aborted','查询某个事务的状态：in progress、committed、aborted。'],
['SELECT pg_current_xact_id_if_assigned();',' pg_current_xact_id_if_assigned\n--------------------------------\n','只读事务不分配 xid，返回空。只读查询不消耗事务 ID。'],
['SELECT xmin, xmax, cmin, cmax, ctid, tableoid::regclass FROM accounts LIMIT 1;',' xmin | xmax | cmin | cmax | ctid  | tableoid\n------+------+------+------+-------+----------\n  790 |    0 |    0 |    0 | (0,4) | accounts','系统列，SELECT * 不返回，需要显式写出。'],
['SELECT pid, backend_xid, backend_xmin FROM pg_stat_activity WHERE backend_xmin IS NOT NULL;','  pid  | backend_xid | backend_xmin\n-------+-------------+--------------\n  1873 |         951 |          951','backend_xmin 是该会话快照的 xmin：比它新的死元组 VACUUM 都不能清理。'],
['ALTER TABLE orders SET (fillfactor = 85);','ALTER TABLE','给 HOT 更新留页内空间。']]);
Quiz(document.getElementById('qs'),[
['UPDATE 在 PostgreSQL 中实际做的是？',['原地修改','旧版本设 xmax，插入新版本','先删除索引再写'],1,''],
['快照 100:104:{101}，xmin=101 的已提交版本可见吗？',['可见','不可见','取决于隔离级别'],1,'101 在 xip 中。'],
['xmax 指向一个已中止的事务，这个版本？',['已删除','仍然有效','损坏'],1,''],
['HOT 更新的条件是？',['不修改被索引的列且页内有空间','表没有索引','只更新一行'],0,''],
['为什么读不阻塞写？',['读者看旧版本，写者创建新版本','读者加共享锁','写入先缓冲'],0,'']]);
