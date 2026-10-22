TITLE='分布式事务：两阶段提交与精确一次';DESC='第 8 章最后一部分。当一个事务涉及多个节点（多个分片，或者数据库加消息队列），如何保证所有节点要么都提交、要么都中止？本课讲两阶段提交（2PC）的流程与“提交点”，协调者故障时参与者为何只能干等（存疑事务），跨异构系统的 XA 事务的问题，数据库内部的分布式事务如何用共识复制协调者来避免阻塞，以及用原子提交实现“精确一次”的消息处理。练习中用 PostgreSQL 的 PREPARE TRANSACTION 亲手扮演协调者。';NEXT='分布式系统的麻烦：网络、超时与部分失效';MIN=65
SUM=['<b>为什么单节点的提交不够</b>：单节点上，提交是否成功取决于提交记录是否写入了磁盘——一个确定的时刻。多节点时，如果简单地让每个节点各自提交，可能一些节点成功、另一些因违反约束、冲突或崩溃而失败，结果不一致。而提交一旦生效就不能撤回（其他事务已经看到了它）。',
'<b>两阶段提交（2PC）</b>：协调者先向所有参与者发送<b>准备</b>请求；参与者把事务的所有写入持久化、检查约束，回答“是”就意味着放弃了中止的权利——无论之后发生什么（包括崩溃重启），只要被要求就必须能提交。协调者收到所有“是”后，把<b>提交决定</b>写入自己的日志——这就是<b>提交点</b>，然后通知所有参与者提交，失败就一直重试。任何一个参与者回答“否”或超时，协调者决定中止。',
'<b>协调者故障</b>：参与者投了“是”之后，如果协调者崩溃，参与者既不能自行提交（别人可能投了否），也不能自行中止（协调者可能已决定提交），只能等待协调者恢复——这些<b>存疑事务</b>一直持有锁，相关的行无法被其他事务修改。如果协调者的日志丢失，就需要人工介入。所以 2PC 是一种<b>阻塞</b>的原子提交协议。',
'<b>跨异构系统的分布式事务</b>（XA）：数据库和消息队列等不同的技术通过 XA 接口参与 2PC。问题：协调者通常是应用进程中的一个库，应用服务器就成了带持久状态的单点；存疑事务锁住数据；XA 是所有参与者能力的最小公分母，无法检测跨系统的死锁，也与 SSI 不兼容；性能开销大。实际中越来越少用。',
'<b>数据库内部的分布式事务</b>（Spanner、CockroachDB、TiDB、YugabyteDB、FoundationDB）：所有参与者是同一个系统的分片，协议可以针对性优化；协调者的状态和每个分片一样，用<b>共识</b>（第 24 课）复制到多个节点，协调者节点故障时其他副本接替，不再永久阻塞。',
'<b>再谈精确一次</b>：消息处理要做到“效果上精确一次”，需要把<b>确认消息已处理</b>和<b>处理产生的写入</b>原子地提交——可以用跨系统的分布式事务，但更常见的做法是在同一个系统内完成：Kafka 事务把消费位移和输出消息放在同一个事务中（<a href="../kafka/l11.html">Kafka 第 11 课</a>）；或者把消费位移和处理结果存到同一个数据库事务中；或者用幂等写入（消息 ID 去重）。第 27 课会从端到端的角度再讨论。']
def secs(prac,E):
    return [
('两阶段提交','准备、提交点、提交。','<div id="p1"></div>'),
('动手：协调者在何时崩溃','选择崩溃时刻，看参与者的状态。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:110px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('精确一次的消息处理','位移与结果在同一个事务中提交。','<div id="p2"></div>'),
('存疑事务','查看已准备但未决定的事务。','<div id="t4"></div>'),
('在你的电脑上练习','启动一个允许预备事务的 PostgreSQL：<code>docker run -d --name pgx -e POSTGRES_PASSWORD=pw postgres:18 -c max_prepared_transactions=10</code>，打开两个窗口 <code>docker exec -it pgx psql -U postgres</code>。你来扮演协调者，两个“参与者”用两张表模拟（真实场景是两台数据库）。',prac([
 ('准备数据。','CREATE TABLE acct(id int PRIMARY KEY, balance int);\nINSERT INTO acct VALUES (1, 100), (2, 0);','CREATE TABLE\nINSERT 0 2'),
 ('第一阶段：参与者执行写入并 PREPARE。之后这个会话可以断开，事务仍持久存在。','BEGIN;\nUPDATE acct SET balance = balance - 30 WHERE id = 1;\nPREPARE TRANSACTION \'tx-42-p1\';','BEGIN\nUPDATE 1\nPREPARE TRANSACTION'),
 ('查看已准备的事务。','SELECT gid, prepared FROM pg_prepared_xacts;','   gid    |           prepared\n----------+-------------------------------\n tx-42-p1 | 2026-10-23 …'),
 ('“协调者崩溃”期间，另一个窗口试图修改这一行：被存疑事务的锁阻塞。','UPDATE acct SET balance = 0 WHERE id = 1;','（一直等待……按 Ctrl-C 取消）\nCancel request sent\nERROR:  canceling statement due to user request'),
 ('即使重启数据库，已准备的事务仍然存在、仍然持有锁。','docker restart pgx; sleep 3\ndocker exec pgx psql -U postgres -c "SELECT gid FROM pg_prepared_xacts;"','   gid\n----------\n tx-42-p1'),
 ('第二阶段：协调者恢复，按日志中的决定提交。','COMMIT PREPARED \'tx-42-p1\';\nSELECT * FROM acct ORDER BY id;','COMMIT PREPARED\n id | balance\n----+---------\n  1 |      70\n  2 |       0')],
 ('设计一个跨两个数据库的转账','账户分布在两个 PostgreSQL 分片上（A 库、B 库）。用 PREPARE TRANSACTION 实现跨库转账：① 写出协调者的伪代码，包括它自己需要持久化什么；② 协调者在每一步崩溃后如何恢复；③ 为什么生产环境中更推荐其他方案，有哪些替代方案？',
 '<pre style="overflow-x:auto">def transfer(txid, from_db, to_db, amt):\n    log.write(txid, "started")                         # 协调者自己的持久日志\n    try:\n        A.exec("BEGIN; UPDATE acct SET balance = balance - %s WHERE id = … AND balance &gt;= %s", amt, amt)\n        B.exec("BEGIN; UPDATE acct SET balance = balance + %s WHERE id = …", amt)\n        A.exec(f"PREPARE TRANSACTION \'{txid}-a\'")\n        B.exec(f"PREPARE TRANSACTION \'{txid}-b\'")\n    except Exception:\n        log.write(txid, "abort"); rollback_all(txid); return False\n    log.write(txid, "commit")    # ← 提交点：fsync 之后决定不可更改\n    commit_all(txid)             # 对 A、B 执行 COMMIT PREPARED，失败就重试直到成功\n    log.write(txid, "done")\n\ndef recover():                   # 协调者重启时\n    for txid, state in log.unfinished():\n        if state == "commit": commit_all(txid)      # 必须提交\n        else: rollback_all(txid)                   # started 或 abort：ROLLBACK PREPARED（若存在）</pre><ol><li>崩溃在提交点之前：恢复时中止，各库上可能存在的已准备事务被 <code>ROLLBACK PREPARED</code>。崩溃在提交点之后：恢复时必须重试 <code>COMMIT PREPARED</code> 直到两边都成功。协调者日志丢失 = 存疑事务无人能决定，只能人工处理。</li><li>不推荐：协调者是单点且带持久状态，存疑期间锁住账户；还需要监控 <code>pg_prepared_xacts</code> 中的“孤儿”事务。</li><li>替代方案：① 把同一笔转账涉及的账户放在同一分片（按客户分片）；② 使用内部实现了分布式事务的数据库（CockroachDB、YugabyteDB、Citus 的 2PC 由数据库自身管理）；③ Saga：A 库扣款并通过 outbox 发出事件，B 库幂等入账，失败时发补偿事件退款——放弃原子性的中间状态，换取无阻塞（第 27 课）。</li></ol>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
