const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=150)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={a:B('账户 1','500'),b:B('账户 2','500'),r1:P('读账户 1 = 500','sig'),t:P('转账 100：1 → 2，提交','sig'),r2:P('读账户 2 = 600？','bad'),sum:P('总额 1100 ≠ 1000','bad'),ok:P('快照：账户 2 = 500，总额 1000','ok')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'第一次读',p:'Alice 的长查询先读账户 1。',set:{a:[0,0],b:[200,0],r1:[0,70]}},
 {t:'并发转账',p:'另一个事务从账户 1 转 100 到账户 2 并提交。',d:3200,set:{a:[0,0,B('账户 1','400','sig')],b:[200,0,B('账户 2','600','sig')],r1:[0,70],t:[0,110]}},
 {t:'读已提交',p:'读已提交下，接着读账户 2 看到的是新值：总额对不上。',d:3400,set:{a:[0,0,B('账户 1','400')],b:[200,0,B('账户 2','600')],r1:[0,70],r2:[0,110],sum:[0,150]}},
 {t:'快照隔离',p:'快照隔离下，整个查询都读开始时的快照：结果一致。',d:3400,set:{a:[0,0,B('账户 1','400')],b:[200,0,B('账户 2','600')],r1:[0,70],ok:[0,110]}}]});
const V=(t,s,c='')=>({w:220,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e2={v1:V('版本 1：balance=500','xmin=100  xmax=—'),v2:V('版本 2：balance=400','xmin=105  xmax=—'),t1:P('事务 103（快照在 105 之前）','sig'),t2:P('事务 107（快照在 105 提交之后）','sig')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'一个版本',p:'事务 100 创建了这一行。',set:{v1:[0,0]}},
 {t:'更新 = 新版本',p:'事务 105 更新：不修改原行，而是把旧版本的 xmax 设为 105，再插入一个新版本。',d:3600,set:{v1:[0,0,V('版本 1：balance=500','xmin=100  xmax=105')],v2:[0,60,V('版本 2：balance=400','xmin=105  xmax=—','sig')]}},
 {t:'各看各的',p:'快照早于 105 的事务看到版本 1；之后的事务看到版本 2。读不阻塞写。',d:3800,set:{v1:[0,0,V('版本 1：balance=500','xmin=100  xmax=105','ok')],v2:[0,60,V('版本 2：balance=400','xmin=105  xmax=—','ok')],t1:[240,10],t2:[240,70]}}]});
(()=>{const S=[['应用中读—改—写（读已提交）',['T1 读 v=5        T2 读 v=5','T1 写 v=6        ','T1 提交          T2 写 v=6','                 T2 提交','结果 v=6：丢失了一次加一'],'bad'],['原子操作 v = v + 1',['T1 UPDATE（取得行锁）','T2 UPDATE 等待锁……','T1 提交 v=6','T2 读到已提交的 6，写 v=7','结果 v=7 ✓'],'ok'],['SELECT … FOR UPDATE',['T1 SELECT FOR UPDATE（锁住）读 5','T2 SELECT FOR UPDATE 等待……','T1 写 6 并提交','T2 读到 6，写 7','结果 v=7 ✓'],'ok'],['PostgreSQL 可重复读',['T1 读 v=5        T2 读 v=5','T1 写 v=6 并提交','T2 写 → ERROR: could not serialize access due to concurrent update','T2 重试：读 6，写 7','结果 v=7 ✓（需要重试逻辑）'],'ok'],['LWW（多副本）',['副本 A：T1 写 6','副本 B：T2 写 6','合并：取时间戳较大者 6','结果 v=6：丢失更新'],'bad']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 S.forEach(([t,r,c])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));p.textContent=r.join('\n');m.className='msg '+c;m.innerHTML=c==='ok'?'两次加一都生效。':'发生了丢失更新。'});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择一种实现。初始 v=5。'})();
Term(document.getElementById('t4'),[
['SELECT xmin, xmax, * FROM acct;',' xmin | xmax | id | balance\n------+------+----+---------\n  812 |    0 |  2 |       0\n  815 |    0 |  1 |     250','xmin：创建该版本的事务 ID；xmax = 0 表示尚未被删除或更新。'],
['SELECT txid_current();',' txid_current\n--------------\n          816','当前事务 ID。'],
['SELECT n_live_tup, n_dead_tup FROM pg_stat_user_tables WHERE relname = \'acct\';',' n_live_tup | n_dead_tup\n------------+------------\n          2 |         11','每次更新都会留下一个旧版本（死元组），由 VACUUM 回收。']]);
Quiz(document.getElementById('qs'),[
['读已提交防止什么？',['脏读与脏写','不可重复读','丢失更新'],0,''],
['快照隔离下事务读到的是？',['最新提交的数据','事务开始时的一致快照','未提交的数据'],1,''],
['MVCC 中 UPDATE 的实现？',['原地修改','标记旧版本并插入新版本','加表锁'],1,''],
['防止丢失更新的首选方式？',['原子写操作','LWW','增加副本'],0,''],
['PostgreSQL 可重复读遇到并发更新同一行？',['静默覆盖','后提交者报序列化错误','死锁'],1,'']]);
