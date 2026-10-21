const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=190)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={tb:{w:120,h:44,cls:'blk',html:'表 orders'},q1:B('长查询（报表）','持有 ACCESS SHARE · 运行 10 min','ok'),al:B('ALTER TABLE','等待 ACCESS EXCLUSIVE','sig'),s1:B('SELECT','排在 ALTER 后面','bad',140),s2:B('SELECT','排队','bad',140),s3:B('UPDATE','排队','bad',140),pool:P('连接池被占满 → 接口超时','bad'),fix:P('SET lock_timeout = \'3s\'：拿不到锁就放弃，稍后重试','ok')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'正在运行',p:'一个报表查询正在读 orders，持有 ACCESS SHARE。它和其他 SELECT、UPDATE 都不冲突。',set:{tb:[0,0],q1:[150,0]}},
 {t:'ALTER TABLE 到来',p:'ADD COLUMN 需要 ACCESS EXCLUSIVE，和 ACCESS SHARE 冲突，开始等待。',d:3600,set:{tb:[0,0],q1:[150,0],al:[150,60]}},
 {t:'后面的请求全部排队',p:'新的 SELECT 本来和报表查询不冲突，但它和排在前面的 ALTER 冲突。锁队列是先来先服务的，于是所有人都在等。',d:4400,set:{tb:[0,0],q1:[150,0],al:[150,60],s1:[0,120],s2:[150,120],s3:[300,120],pool:[0,180]}},
 {t:'lock_timeout',p:'DDL 设置较短的 lock_timeout：等不到就报错退出，队列马上恢复。在循环里重试，直到碰上一个没有长查询的空档。',d:4000,set:{tb:[0,0],q1:[150,0],s1:[0,120,{cls:'blk ok'}],s2:[150,120,{cls:'blk ok'}],s3:[300,120,{cls:'blk ok'}],fix:[0,180]}}]});
const e2={t1:P('T1','mute'),t2:P('T2','mute'),a:B('行 A','','',120),b:B('行 B','','',120),l1:P('T1 锁住 A','sig'),l2:P('T2 锁住 B','sig'),w1:P('T1 等待 B','bad'),w2:P('T2 等待 A','bad'),dt:P('1 秒后检测到环：回滚 T2（40P01），T1 继续','ok'),fx:P('预防：总是按 id 顺序加锁','ok')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'各锁一行',p:'T1 更新 A，T2 更新 B。互不影响。',set:{a:[0,40],b:[260,40],l1:[0,100],l2:[260,100]}},
 {t:'交叉请求',p:'T1 接着要更新 B，等待 T2；T2 要更新 A，等待 T1。谁也不会先结束。',d:3800,set:{a:[0,40],b:[260,40],l1:[0,100],l2:[260,100],w1:[0,140],w2:[260,140]}},
 {t:'检测',p:'等待超过 deadlock_timeout 后，等待中的进程检查等待图，发现环就回滚其中一方。应用收到 40P01，可以重试整个事务。',d:4200,set:{a:[0,40],b:[260,40,{cls:'blk ok'}],l1:[0,100],dt:[0,140]}},
 {t:'预防',p:'死锁检测只是兜底。批量更新时先按主键排序（UPDATE … WHERE id IN (…) 的顺序不保证，可以先 SELECT … ORDER BY id FOR UPDATE），所有代码路径就不会交叉等待。',d:4200,set:{a:[0,40],b:[260,40],fx:[0,140]}}]});
(()=>{const Q=[['SELECT  ×  UPDATE 同一行',"会话 1: BEGIN; SELECT * FROM orders WHERE id = 1;\n会话 2: UPDATE orders SET status = 'paid' WHERE id = 1;\n→ 立即完成",'ok','ACCESS SHARE 与 ROW EXCLUSIVE 不冲突；读不加行锁。'],
['UPDATE  ×  UPDATE 同一行',"会话 1: BEGIN; UPDATE orders SET amount = 1 WHERE id = 1;\n会话 2: UPDATE orders SET status = 'paid' WHERE id = 1;\n→ 等待会话 1 的事务结束",'bad','行锁 FOR NO KEY UPDATE 与自身冲突。'],
['UPDATE  ×  UPDATE 不同行',"会话 1: BEGIN; UPDATE orders SET amount = 1 WHERE id = 1;\n会话 2: UPDATE orders SET amount = 2 WHERE id = 2;\n→ 立即完成",'ok','行锁只锁住被修改的行。'],
['UPDATE orders  ×  INSERT 子表引用该行',"会话 1: BEGIN; UPDATE orders SET amount = 1 WHERE id = 1;\n会话 2: INSERT INTO order_items (order_id, …) VALUES (1, …);\n→ 立即完成",'ok','外键检查拿 FOR KEY SHARE，与 FOR NO KEY UPDATE 不冲突（只要不修改键列）。'],
['DELETE orders  ×  INSERT 子表引用该行',"会话 1: BEGIN; DELETE FROM orders WHERE id = 1;\n会话 2: INSERT INTO order_items (order_id, …) VALUES (1, …);\n→ 等待；会话 1 提交后报外键错误",'bad','DELETE 拿 FOR UPDATE，与 FOR KEY SHARE 冲突。'],
['SELECT  ×  CREATE INDEX',"会话 1: BEGIN; SELECT count(*) FROM orders;\n会话 2: CREATE INDEX ON orders (amount);\n→ 立即开始（SHARE 与 ACCESS SHARE 不冲突）\n但之后的 INSERT/UPDATE 会被 CREATE INDEX 阻塞",'sig','普通 CREATE INDEX 不阻塞读，阻塞写。生产用 CONCURRENTLY。'],
['SELECT  ×  ALTER TABLE ADD COLUMN',"会话 1: BEGIN; SELECT count(*) FROM orders;\n会话 2: ALTER TABLE orders ADD COLUMN note text;\n→ 等待会话 1；同时阻塞之后所有对 orders 的访问",'bad','ACCESS EXCLUSIVE 与一切冲突。ADD COLUMN 本身只改目录很快，问题全在等锁。'],
['VACUUM  ×  UPDATE',"会话 1: VACUUM orders;\n会话 2: UPDATE orders SET amount = 1 WHERE id = 1;\n→ 立即完成",'ok','VACUUM 拿 SHARE UPDATE EXCLUSIVE，不阻塞读写。两个 VACUUM 不能同时处理同一张表。'],
['FOR UPDATE SKIP LOCKED  ×  FOR UPDATE SKIP LOCKED',"会话 1: BEGIN; SELECT id FROM jobs … LIMIT 1 FOR UPDATE SKIP LOCKED;  → 1\n会话 2: BEGIN; SELECT id FROM jobs … LIMIT 1 FOR UPDATE SKIP LOCKED;  → 2",'ok','跳过已锁行，不等待。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent=Q[i][1];m.className='msg '+Q[i][2];m.innerHTML=Q[i][3]});q.appendChild(b)});
 m.className='msg';m.innerHTML='会话 1 的事务尚未提交。'})();
Term(document.getElementById('t4'),[
['SELECT locktype, relation::regclass, mode, granted, pid FROM pg_locks WHERE relation = \'orders\'::regclass;',' locktype | relation |        mode         | granted | pid\n----------+----------+---------------------+---------+------\n relation | orders   | AccessShareLock     | t       | 2001\n relation | orders   | AccessExclusiveLock | f       | 2012','granted = f 表示在等待。'],
['SELECT pid, pg_blocking_pids(pid) AS blocked_by, now() - query_start AS waiting, left(query, 50) FROM pg_stat_activity WHERE cardinality(pg_blocking_pids(pid)) > 0;','  pid  | blocked_by | waiting  | left\n-------+------------+----------+------------------------------\n  2012 | {2001}     | 00:01:12 | ALTER TABLE orders ADD …','谁被谁阻塞。沿 blocked_by 找到源头。'],
['SET lock_timeout = \'3s\';','SET','所有迁移脚本都应设置。'],
['ALTER SYSTEM SET log_lock_waits = on;','ALTER SYSTEM','等锁超过 deadlock_timeout 时写日志，便于事后分析。'],
['SELECT pg_try_advisory_xact_lock(hashtext(\'daily-report\'));',' pg_try_advisory_xact_lock\n---------------------------\n t','拿到返回 t，其他实例返回 f 并跳过本次任务。事务结束自动释放。'],
['SELECT pg_cancel_backend(2001);  -- 或 pg_terminate_backend',' pg_cancel_backend\n-------------------\n t','取消阻塞源头的查询；terminate 断开整个连接。']]);
Quiz(document.getElementById('qs'),[
['哪个语句和普通 SELECT 冲突？',['UPDATE','CREATE INDEX','ALTER TABLE … ADD COLUMN'],2,'ACCESS EXCLUSIVE。'],
['ALTER TABLE 等锁时，之后的 SELECT 会？',['正常执行','排在它后面等待','报错'],1,'锁队列。'],
['多个 worker 并发领取任务用？',['FOR UPDATE NOWAIT','FOR UPDATE SKIP LOCKED','LOCK TABLE'],1,''],
['预防死锁最有效的方法？',['加大 deadlock_timeout','按相同顺序加锁','提高隔离级别'],1,''],
['行锁存在哪里？',['共享内存锁表','元组头（xmax / infomask）','WAL'],1,'所以行锁数量不受内存限制。']]);
