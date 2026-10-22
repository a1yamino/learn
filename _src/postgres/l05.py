TITLE='事务基础：ACID 与 BEGIN / COMMIT';DESC='事务把多条语句变成一个不可分割的整体：要么全部生效，要么全部不生效。本课讲 ACID 四个性质各自由什么机制保证、BEGIN / COMMIT / ROLLBACK 和保存点、出错后事务进入的 aborted 状态，以及长事务为什么危险。隔离级别和 MVCC 的细节留到第 14、15 课。';NEXT='从应用连接：驱动、参数化查询与连接池';MIN=50
SUM=['事务是一组要么全部提交、要么全部回滚的语句。没有显式 <code>BEGIN</code> 时，PostgreSQL 把每条语句当作一个单独的事务自动提交（autocommit）。',
'<b>A</b>tomicity 原子性：靠回滚和 WAL 保证；<b>C</b>onsistency 一致性：约束、外键和触发器在提交前必须成立；<b>I</b>solation 隔离性：MVCC 与锁，默认级别 READ COMMITTED；<b>D</b>urability 持久性：COMMIT 返回前 WAL 已刷到磁盘（<code>synchronous_commit = on</code>）。',
'事务中任何一条语句出错，整个事务进入 <b>aborted</b> 状态：之后的语句都会报 <code>current transaction is aborted, commands ignored until end of transaction block</code>，只能 ROLLBACK。COMMIT 也只会变成回滚。',
'<code>SAVEPOINT s</code> / <code>ROLLBACK TO SAVEPOINT s</code> 只撤销保存点之后的部分，事务可以继续。psql 的 <code>\\set ON_ERROR_ROLLBACK interactive</code> 就是给每条语句自动加保存点。',
'事务尽量短：长事务持有锁、阻止 VACUUM 清理旧版本（表膨胀），空闲的 <code>idle in transaction</code> 连接还占着连接槽。用 <code>idle_in_transaction_session_timeout</code> 和 <code>pg_stat_activity</code> 防范。',
'事务里不要做网络调用、等待用户输入或发邮件这类外部副作用；外部动作无法随 ROLLBACK 撤销。']
def secs(prac,E):
    return [
('转账：为什么需要事务','两条 UPDATE 之间出了故障会怎样。','<div id="p1"></div>'),
('出错后的事务状态','aborted 状态与保存点。','<div id="p2"></div>'),
('动手：这个事务最后提交了什么','accounts 表中 A、B 各有 100 元。选择一段事务脚本，看每条语句的结果和最终余额。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:70px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('相关命令','控制事务、观察事务状态。','<div id="t4"></div>'),
('在你的电脑上练习','在 shop 库中建一张 accounts 表。打开两个 psql 窗口（窗口 1、窗口 2）。',prac([
 ('准备数据。','CREATE TABLE accounts (name text PRIMARY KEY, balance int NOT NULL CHECK (balance >= 0));\nINSERT INTO accounts VALUES (\'A\',100),(\'B\',100);','CREATE TABLE\nINSERT 0 2'),
 ('窗口 1：开启事务但不提交。注意提示符变成 *。','BEGIN;\nUPDATE accounts SET balance = balance - 30 WHERE name = \'A\';','BEGIN\nUPDATE 1\nshop=*#'),
 ('窗口 2：看不到未提交的修改。','SELECT * FROM accounts;',' name | balance\n------+---------\n A    |     100\n B    |     100'),
 ('窗口 1：回滚，修改消失。','ROLLBACK;\nSELECT * FROM accounts WHERE name = \'A\';','ROLLBACK\n name | balance\n------+---------\n A    |     100'),
 ('违反 CHECK 约束后，事务进入 aborted 状态。','BEGIN;\nUPDATE accounts SET balance = balance - 500 WHERE name = \'A\';\nSELECT 1;\nCOMMIT;','BEGIN\nERROR:  new row for relation "accounts" violates check constraint "accounts_balance_check"\nERROR:  current transaction is aborted, commands ignored until end of transaction block\nROLLBACK'),
 ('用保存点只撤销一部分。','BEGIN;\nUPDATE accounts SET balance = balance + 10 WHERE name = \'B\';\nSAVEPOINT s1;\nUPDATE accounts SET balance = balance - 500 WHERE name = \'A\';\nROLLBACK TO SAVEPOINT s1;\nCOMMIT;\nSELECT * FROM accounts ORDER BY name;','BEGIN\nUPDATE 1\nSAVEPOINT\nERROR:  new row for relation "accounts" violates check constraint "accounts_balance_check"\nROLLBACK\nCOMMIT\n name | balance\n------+---------\n A    |     100\n B    |     110'),
 ('窗口 1 开着事务不动，窗口 2 查看。',"-- 窗口 1\nBEGIN; SELECT * FROM accounts;\n-- 窗口 2\nSELECT pid, state, now() - xact_start AS age FROM pg_stat_activity WHERE state LIKE 'idle in%';\n-- 观察完后回到窗口 1，结束本练习事务\nROLLBACK;",'  pid  |        state        |       age\n-------+---------------------+-----------------\n  1873 | idle in transaction | 00:00:41.20391')],
 ('写一个安全的转账','写一段转账脚本：从 A 转 30 给 B。要求：任何一步失败都整体回滚；余额不足时不能出现负数；并发执行两次也不会多扣。说明每一点由什么保证。',
 '<pre class="cmd">BEGIN;\nUPDATE accounts SET balance = balance - 30 WHERE name = \'A\' AND balance &gt;= 30;\n-- 应用检查受影响行数：为 0 则 ROLLBACK，提示余额不足\nUPDATE accounts SET balance = balance + 30 WHERE name = \'B\';\nCOMMIT;</pre><pre class="out">BEGIN\nUPDATE 1\nUPDATE 1\nCOMMIT</pre><p>整体回滚由事务的原子性保证：中途任何错误都会让事务进入 aborted，最终只能回滚。不出现负数有两层：<code>WHERE balance &gt;= 30</code> 让余额不足时更新 0 行，CHECK 约束兜底。并发安全来自行锁：两个事务同时更新 A 的那一行，第二个会等待第一个提交，然后在 READ COMMITTED 下重新读取最新的行再判断条件，所以不会基于旧余额扣两次（第 14、17 课详细讲）。不要先 SELECT 余额、在应用里判断、再 UPDATE 写回计算值，那样两个并发请求会读到同一个旧值。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
