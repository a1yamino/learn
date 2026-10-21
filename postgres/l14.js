const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,c='',w=230,h=34)=>({w,h,cls:'blk '+c,html:t});
const e={h1:P('会话 1','mute'),h2:P('会话 2','mute'),a1:B('SELECT stock → 1'),b1:B('SELECT stock → 1'),a2:B('UPDATE stock = 0（应用算的）'),b2:B('UPDATE stock = 0 · 等待会话 1'),a3:B('COMMIT'),b3:B('继续：写入 0 · COMMIT'),r:P('卖出 2 件，库存只减 1：丢失更新','bad'),f:B('UPDATE … SET stock = stock − 1 WHERE stock >= 1','ok',460),f2:P('会话 2 等待后重读最新版本：stock = 0，不满足条件 → UPDATE 0','ok')};
const H={h1:[0,0],h2:[260,0]};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'都读到 1',p:'两个请求同时读取库存，各自在应用里判断“有货”。',set:{...H,a1:[0,40],b1:[260,40]}},
 {t:'都写回',p:'会话 1 写回 0。会话 2 的 UPDATE 遇到被锁定的行，等待。',d:3800,set:{...H,a1:[0,40],b1:[260,40],a2:[0,80,{cls:'blk sig'}],b2:[260,80,{cls:'blk mute'}]}},
 {t:'丢失',p:'会话 1 提交后，会话 2 继续，写入的仍是它自己算好的 0。READ COMMITTED 只保证不覆盖未提交的数据，不能替应用重算。',d:4200,set:{...H,a1:[0,40],b1:[260,40],a2:[0,80],b2:[260,80],a3:[0,120,{cls:'blk ok'}],b3:[260,120,{cls:'blk bad'}],r:[0,170]}},
 {t:'原子更新',p:'把计算放进 UPDATE。会话 2 等待结束后会读取最新提交的版本，重新检查 WHERE，于是正确地更新 0 行。',d:4400,set:{f:[0,40],f2:[0,90]}}]});
const e2={h1:P('事务 1（alice 请假）','mute'),h2:P('事务 2（bob 请假）','mute'),a1:B('在班人数 = 2 ✓'),b1:B('在班人数 = 2 ✓'),a2:B('UPDATE alice → 不在班'),b2:B('UPDATE bob → 不在班'),a3:B('COMMIT','ok'),b3:B('COMMIT'),r:P('两行不同，没有写冲突 → 都提交 → 0 人在班','bad'),s:P('SERIALIZABLE：检测到读写依赖环 → 事务 2 报 40001','ok')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'都检查条件',p:'规则：至少一名医生在班。两个事务各自查询，都看到 2 人在班。',set:{...H,h1:[0,0],h2:[260,0],a1:[0,40],b1:[260,40]}},
 {t:'各写各的',p:'修改的是不同的行，所以没有行锁冲突。',d:3600,set:{h1:[0,0],h2:[260,0],a1:[0,40],b1:[260,40],a2:[0,80],b2:[260,80]}},
 {t:'都提交',p:'在 READ COMMITTED 和 REPEATABLE READ 下都能提交。每个事务单独看都正确，合在一起违反了规则。',d:4000,set:{h1:[0,0],h2:[260,0],a1:[0,40],b1:[260,40],a2:[0,80],b2:[260,80],a3:[0,120],b3:[260,120,{cls:'blk bad'}],r:[0,170]}},
 {t:'SERIALIZABLE',p:'SSI 记录每个事务读了什么、写了什么。事务 1 读的数据被事务 2 修改，反之亦然，任何串行顺序都不会得到这个结果，于是后提交的一方失败。',d:4400,set:{h1:[0,0],h2:[260,0],a1:[0,40],b1:[260,40],a2:[0,80],b2:[260,80],a3:[0,120],b3:[260,120,{cls:'blk bad'}],s:[0,170]}}]});
(()=>{const Q=[['不可重复读 · READ COMMITTED',"T1: BEGIN;\nT1: SELECT balance FROM accounts WHERE name='A';   → 100\nT2: UPDATE accounts SET balance = 50 WHERE name='A'; COMMIT;\nT1: SELECT balance FROM accounts WHERE name='A';   → 50\nT1: COMMIT;",'sig','每条语句一个新快照，看到了 T2 已提交的修改。对大多数在线请求没问题，但同一事务里前后不一致会让报表数字对不上。'],
['不可重复读 · REPEATABLE READ',"T1: BEGIN ISOLATION LEVEL REPEATABLE READ;\nT1: SELECT balance … → 100\nT2: UPDATE … SET balance = 50; COMMIT;\nT1: SELECT balance … → 100\nT1: SELECT sum(balance) FROM accounts; → 与第一次一致的快照",'ok','整个事务一个快照。'],
['并发 +1 · READ COMMITTED',"T1: BEGIN; UPDATE counters SET n = n + 1 WHERE id = 1;   -- n: 10 → 11\nT2: BEGIN; UPDATE counters SET n = n + 1 WHERE id = 1;   -- 等待\nT1: COMMIT;\nT2:   继续：重读最新版本 n = 11 → 12\nT2: COMMIT;   最终 n = 12",'ok','原子的自增在 READ COMMITTED 下是正确的。'],
['并发 +1 · REPEATABLE READ',"T1: BEGIN ISOLATION LEVEL REPEATABLE READ; UPDATE counters SET n = n + 1 WHERE id = 1;\nT2: BEGIN ISOLATION LEVEL REPEATABLE READ; UPDATE counters SET n = n + 1 WHERE id = 1;  -- 等待\nT1: COMMIT;\nT2: ERROR: could not serialize access due to concurrent update\nT2: ROLLBACK; → 应用重试 → n = 12",'sig','T2 的快照里 n = 10，它不能基于快照之外的新版本修改，只能报错。结果正确，但应用必须重试。'],
['幻读 · REPEATABLE READ',"T1: BEGIN ISOLATION LEVEL REPEATABLE READ;\nT1: SELECT count(*) FROM orders WHERE user_id = 42;  → 118\nT2: INSERT INTO orders (user_id, …) VALUES (42, …); COMMIT;\nT1: SELECT count(*) FROM orders WHERE user_id = 42;  → 118",'ok','SQL 标准允许 REPEATABLE READ 出现幻读，PostgreSQL 的快照实现不会。'],
['写偏斜 · REPEATABLE READ',"T1: SELECT count(*) FROM oncall WHERE on_duty;  → 2\nT2: SELECT count(*) FROM oncall WHERE on_duty;  → 2\nT1: UPDATE oncall SET on_duty = false WHERE doctor = 'alice';\nT2: UPDATE oncall SET on_duty = false WHERE doctor = 'bob';\nT1: COMMIT;  T2: COMMIT;   → 0 人在班",'bad','快照隔离防不住写偏斜。可以用 SERIALIZABLE，或在 READ COMMITTED 下 SELECT … FOR UPDATE 锁住被检查的行。'],
['写偏斜 · SERIALIZABLE',"…同样的步骤…\nT1: COMMIT;\nT2: COMMIT;\nERROR: could not serialize access due to read/write dependencies among transactions",'ok','检测到危险结构，T2 失败，重试时会看到只剩 1 人在班，从而拒绝请假。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent=Q[i][1];m.className='msg '+Q[i][2];m.innerHTML=Q[i][3]});q.appendChild(b)});
 m.className='msg';m.innerHTML='T1、T2 是两个并发会话，按从上到下的时间顺序执行。'})();
Term(document.getElementById('t4'),[
['SHOW default_transaction_isolation;',' default_transaction_isolation\n-------------------------------\n read committed','默认隔离级别。'],
['BEGIN ISOLATION LEVEL SERIALIZABLE READ ONLY DEFERRABLE;','BEGIN','只读的 SERIALIZABLE 事务加 DEFERRABLE：等待一个安全的快照后开始，之后不会因序列化失败而中止。适合长报表。'],
['SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;','SET','在事务的第一条语句之前设置。'],
['ALTER DATABASE shop SET default_transaction_isolation = \'serializable\';','ALTER DATABASE','把整个库改为 SERIALIZABLE，新连接生效。所有代码都必须处理 40001。'],
['SELECT mode, count(*) FROM pg_locks WHERE mode = \'SIReadLock\' GROUP BY 1;','    mode    | count\n------------+-------\n SIReadLock |   312','SSI 的谓词“锁”，只记录不阻塞。过多时会合并为页级或表级，增加误报。'],
['SHOW max_pred_locks_per_transaction;',' max_pred_locks_per_transaction\n--------------------------------\n 64','谓词锁的容量。']]);
Quiz(document.getElementById('qs'),[
['READ COMMITTED 下快照在何时获取？',['事务开始时','每条语句开始时','提交时'],1,''],
['REPEATABLE READ 下更新已被并发修改的行，会？',['覆盖','报 40001，需要重试','读最新版本继续'],1,''],
['哪种隔离级别能防止写偏斜？',['READ COMMITTED','REPEATABLE READ','SERIALIZABLE'],2,''],
['PostgreSQL 中有脏读吗？',['有，在 READ UNCOMMITTED','没有','只在复制中有'],1,''],
['库存扣减最简单可靠的写法？',['先 SELECT 再 UPDATE 写回','UPDATE … SET stock = stock - n WHERE stock >= n','提高隔离级别不重试'],1,'']]);
