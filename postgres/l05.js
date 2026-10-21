const S=(t,s,c='',w=120)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});const P=(t,c='sig')=>({cls:'pill '+c,html:t});
Player(document.getElementById('p1'),{els:{a:S('A','100 元'),b:S('B','100 元'),s1:P('UPDATE A − 30','mute'),s2:P('UPDATE B + 30','mute'),x:P('数据库崩溃','bad'),r:P('结果：钱凭空少了 30','bad'),ok:P('重启后：WAL 中没有 COMMIT 记录 → 两条修改都不可见','ok'),c:P('COMMIT：WAL 刷盘后才返回成功','ok')},scenes:[
 {t:'两条语句',p:'转账 = A 减 30、B 加 30。两条都成功才算正确。',set:{a:[0,0],b:[0,60],s1:[200,10],s2:[200,70]}},
 {t:'没有事务',p:'autocommit 下每条语句单独提交。第一条已经提交，此时进程崩溃，第二条永远不会执行。',d:4000,set:{a:[0,0,S('A','70 元','bad')],b:[0,60],s1:[200,10,{cls:'pill ok'}],x:[200,70],r:[0,130]}},
 {t:'放进事务',p:'BEGIN 之后的修改在 COMMIT 前都只是“未提交”。崩溃时事务未提交，重启恢复后它的修改全部不可见（原子性）。',d:4200,set:{a:[0,0,S('A','70 元（未提交）','dim')],b:[0,60],s1:[200,10,{cls:'pill sig'}],x:[200,70],ok:[0,130]}},
 {t:'提交',p:'COMMIT 写入提交记录并把 WAL 刷到磁盘后才返回。之后即使断电，修改也会在恢复时重放（持久性，第 8 课）。',d:4000,set:{a:[0,0,S('A','70 元','ok')],b:[0,60,S('B','130 元','ok')],s1:[200,10,{cls:'pill ok'}],s2:[200,70,{cls:'pill ok'}],c:[0,130]}}]});
const st={w:{w:700,cls:'tag'}};const L=['BEGIN','UPDATE … 成功','INSERT … 违反唯一约束','SELECT 1','COMMIT'];L.forEach((t,i)=>st['l'+i]={w:220,h:34,cls:'blk',html:t});
st.e1=P('ERROR: duplicate key','bad');st.e2=P('ERROR: current transaction is aborted','bad');st.e3=P('ROLLBACK（不是 COMMIT）','bad');st.sp=P('SAVEPOINT s1 在 INSERT 之前','sig');st.rb=P('ROLLBACK TO s1 → 事务恢复正常，UPDATE 保留','ok');
const ln=(n,c={})=>{const o={};for(let i=0;i<n;i++)o['l'+i]=[0,i*44,c[i]?{cls:'blk '+c[i]}:{cls:'blk'}];return o};
Player(document.getElementById('p2'),{els:st,scenes:[
 {t:'正常执行',p:'事务开始，第一条 UPDATE 成功。',set:ln(2,{1:'ok'})},
 {t:'一条语句出错',p:'INSERT 违反唯一约束，报错。PostgreSQL 不会只撤销这一条：整个事务被标记为 aborted。',d:3800,set:{...ln(3,{1:'ok',2:'bad'}),e1:[260,92]}},
 {t:'之后的语句都被拒绝',p:'连 SELECT 1 都会失败。COMMIT 也只会返回 ROLLBACK，前面成功的 UPDATE 一起丢掉。应用要在出错后立即回滚。',d:4400,set:{...ln(5,{1:'mute',2:'bad',3:'bad',4:'bad'}),e2:[260,136],e3:[260,180]}},
 {t:'保存点',p:'在可能失败的语句前设 SAVEPOINT。失败后 ROLLBACK TO SAVEPOINT 只撤销保存点之后的修改，事务可以继续并提交。',d:4400,set:{...ln(3,{1:'ok',2:'bad'}),sp:[260,48],rb:[260,136]}}]});
(()=>{const Q=[['正常转账',"BEGIN;\nUPDATE accounts SET balance=balance-30 WHERE name='A';  -- UPDATE 1\nUPDATE accounts SET balance=balance+30 WHERE name='B';  -- UPDATE 1\nCOMMIT;                                                 -- COMMIT\n\nA=70  B=130",'ok','两条都成功，提交。'],
['中间出错仍执行 COMMIT',"BEGIN;\nUPDATE accounts SET balance=balance-30 WHERE name='A';  -- UPDATE 1\nUPDATE accounts SET balance=balance+'x' WHERE name='B'; -- ERROR: invalid input syntax\nCOMMIT;                                                 -- ROLLBACK\n\nA=100  B=100",'bad','出错后事务已 aborted，COMMIT 被当作 ROLLBACK。A 的扣款也被撤销，这正是我们想要的。应用要注意：COMMIT 返回的是 ROLLBACK，不能当作成功。'],
['忘了 BEGIN',"UPDATE accounts SET balance=balance-30 WHERE name='A';  -- UPDATE 1（已自动提交）\nUPDATE accounts SET balance=balance+'x' WHERE name='B'; -- ERROR\n\nA=70  B=100",'bad','autocommit 下第一条已经单独提交。钱少了 30。'],
['保存点',"BEGIN;\nUPDATE accounts SET balance=balance-30 WHERE name='A';  -- UPDATE 1\nSAVEPOINT s1;\nUPDATE accounts SET balance=balance+'x' WHERE name='B'; -- ERROR\nROLLBACK TO SAVEPOINT s1;\nUPDATE accounts SET balance=balance+30 WHERE name='B';  -- UPDATE 1\nCOMMIT;\n\nA=70  B=130",'ok','只撤销了保存点之后的失败语句，事务继续并成功提交。'],
['显式 ROLLBACK',"BEGIN;\nUPDATE accounts SET balance=balance-30 WHERE name='A';\nUPDATE accounts SET balance=balance+30 WHERE name='B';\nROLLBACK;\n\nA=100  B=100",'','主动放弃，所有修改撤销。'],
['DDL 也在事务中',"BEGIN;\nDROP TABLE accounts;\nROLLBACK;\nSELECT count(*) FROM accounts;   -- 2\n",'ok','PostgreSQL 的 DDL 是事务性的（与 MySQL 不同）：DROP TABLE、ALTER TABLE 都能回滚。迁移脚本可以整体放进一个事务。例外：CREATE INDEX CONCURRENTLY、VACUUM、CREATE DATABASE 不能在事务块中执行。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent=Q[i][1];m.className='msg '+Q[i][2];m.innerHTML=Q[i][3]});q.appendChild(b)});
 m.className='msg';m.innerHTML='初始余额：A=100，B=100。'})();
Term(document.getElementById('t4'),[
['BEGIN ISOLATION LEVEL REPEATABLE READ;','BEGIN','开启事务时可以指定隔离级别（第 14 课）。START TRANSACTION 与 BEGIN 等价。'],
['SELECT txid_current(), pg_current_xact_id();',' txid_current | pg_current_xact_id\n--------------+--------------------\n          812 |                812','当前事务的事务 ID。只读事务在首次写入前不分配 ID。'],
['\\set ON_ERROR_ROLLBACK interactive','','psql 中交互输入时，每条语句前自动设保存点，打错一条不会废掉整个事务。'],
['SET idle_in_transaction_session_timeout = \'60s\';','SET','空闲事务超过 60 秒自动断开。也可以在角色或数据库级别设置。'],
['SELECT pid, state, xact_start, query FROM pg_stat_activity WHERE xact_start < now() - interval \'5 min\';','  pid  |        state        |          xact_start           | query\n-------+---------------------+-------------------------------+-------\n  1873 | idle in transaction | 2026-10-22 10:01:12.33+08     | SELECT …','找出运行超过 5 分钟的事务。'],
['SELECT pg_terminate_backend(1873);',' pg_terminate_backend\n----------------------\n t','断开该连接，它的事务被回滚。']]);
Quiz(document.getElementById('qs'),[
['事务中一条语句报错后执行 COMMIT，结果是？',['提交成功的部分','整个事务回滚','报错并保持事务打开'],1,'aborted 事务的 COMMIT 等同于 ROLLBACK。'],
['没有 BEGIN 时，单条 UPDATE 是？',['不提交，直到断开','自动作为一个事务提交','只在内存中'],1,'autocommit。'],
['持久性主要由什么保证？',['COMMIT 前把 WAL 刷到磁盘','每次写入都刷数据文件','备份'],0,'数据页可以稍后写，WAL 必须先落盘。'],
['PostgreSQL 中 ALTER TABLE 能回滚吗？',['能','不能','只有 ADD COLUMN 能'],0,'DDL 是事务性的。'],
['idle in transaction 的连接主要危害是？',['占 CPU','持有锁、阻止 VACUUM 清理、占连接','没有危害'],1,'应设置超时。']]);
