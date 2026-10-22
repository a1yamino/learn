TITLE='弱隔离级别：读已提交与快照隔离';DESC='可串行化代价高，所以大多数数据库默认使用更弱的隔离级别——PostgreSQL 默认读已提交，MySQL InnoDB 默认可重复读。弱隔离会导致真实的 bug（甚至造成过资金损失）。本课讲读已提交防止什么（脏读、脏写）以及怎样实现；快照隔离如何用多版本并发控制（MVCC）让每个事务看到一致的快照；以及“丢失更新”这一经典问题的五种防止方法。练习需要开两个 psql 窗口，亲手制造这些异常。';NEXT='写偏斜、幻读与可串行化';MIN=65
SUM=['<b>读已提交</b>保证两点：① <b>没有脏读</b>——只能读到已提交的数据；② <b>没有脏写</b>——只能覆盖已提交的数据（并发写同一行时，后者等待前者提交或中止，通常用行锁实现）。防止脏读通常不用读锁，而是为每个被修改的对象保存旧的已提交值，其他事务读旧值。',
'读已提交下仍有<b>不可重复读</b>（读偏差）：同一事务中两次读取，中间别人提交了修改，看到的数据不一致。例如：转账进行中你查询两个账户余额，一个是转账前、一个是转账后，总额少了 100。对普通请求来说这只是暂时的，但对<b>备份</b>、<b>分析查询</b>、<b>完整性检查</b>这类长时间读取来说是不可接受的。',
'<b>快照隔离</b>：每个事务从开始时起，读取的是数据库在那一刻的一致快照，看不到之后其他事务的提交。实现是 <b>MVCC</b>：每行保存多个版本，每个版本标记创建它的事务 ID（PostgreSQL 的 <code>xmin</code>）和删除它的事务 ID（<code>xmax</code>）；读取时按可见性规则判断：版本由已在快照前提交的事务创建、且没有被快照前提交的事务删除，才可见。原则是<b>读不阻塞写，写不阻塞读</b>。旧版本由垃圾回收清理（PostgreSQL 的 VACUUM）。SQL 标准中的“可重复读”定义含糊，PostgreSQL 的可重复读就是快照隔离。',
'<b>丢失更新</b>：两个事务并发执行“读—改—写”（计数器加一、修改 JSON 文档中的一个字段、两个人同时编辑维基页面），后写入的覆盖了前一个的修改。快照隔离本身不一定能防止。',
'<b>五种对策</b>：① <b>原子写操作</b>——<code>UPDATE … SET v = v + 1</code>，数据库内部加锁执行，首选；② <b>显式加锁</b>——<code>SELECT … FOR UPDATE</code>，应用逻辑太复杂、无法用原子操作表达时使用，容易忘记；③ <b>自动检测</b>——PostgreSQL 可重复读检测到并发更新同一行时让后者报错（MySQL InnoDB 的可重复读不检测）；④ <b>比较并设置</b>——<code>UPDATE … WHERE v = 旧值</code>，注意在快照下 WHERE 可能读到旧快照；⑤ 多副本（多主/无主）环境下锁和 CAS 都不适用，只能保留并发值后合并，或使用可交换的原子操作（CRDT，第 13 课），LWW 会丢失更新。']
def secs(prac,E):
    return [
('读偏差与快照','转账进行中，读到的总额少了 100。','<div id="p1"></div>'),
('动手：选择隔离级别','两个并发的“计数器加一”，在不同实现下的结果。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:130px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('MVCC 的可见性','同一行的多个版本与 xmin / xmax。','<div id="p2"></div>'),
('查看行版本','PostgreSQL 的系统列 xmin、xmax。','<div id="t4"></div>'),
('在你的电脑上练习','打开两个终端，各自运行 <code>docker exec -it pg psql -U postgres</code>，记作 T1 与 T2。使用第 17 课的 <code>acct</code> 表，先执行 <code>UPDATE acct SET balance = 500;</code>。',prac([
 ('T1（读已提交）：第一次读取。','BEGIN;\nSELECT balance FROM acct WHERE id = 1;',' balance\n---------\n     500'),
 ('T2：修改并提交。','UPDATE acct SET balance = 400 WHERE id = 1;','UPDATE 1'),
 ('T1：再次读取，看到了新值（不可重复读）。','SELECT balance FROM acct WHERE id = 1;\nCOMMIT;',' balance\n---------\n     400'),
 ('T1 改用可重复读（快照隔离）：快照在第一条语句时确定。','BEGIN ISOLATION LEVEL REPEATABLE READ;\nSELECT balance FROM acct WHERE id = 1;',' balance\n---------\n     400'),
 ('T2：再次修改并提交。T1 再读，仍然是快照中的值。','-- T2:\nUPDATE acct SET balance = 300 WHERE id = 1;\n-- T1:\nSELECT balance FROM acct WHERE id = 1;',' balance\n---------\n     400'),
 ('T1 尝试基于旧值写入：PostgreSQL 检测到丢失更新，中止 T1。','UPDATE acct SET balance = balance - 50 WHERE id = 1;\nROLLBACK;','ERROR:  could not serialize access due to concurrent update'),
 ('显式锁：在读已提交下用 FOR UPDATE 串行化“读—改—写”。','-- T1:\nBEGIN; SELECT balance FROM acct WHERE id = 1 FOR UPDATE;\n-- T2（会阻塞，直到 T1 提交）:\nBEGIN; SELECT balance FROM acct WHERE id = 1 FOR UPDATE;\n-- T1:\nUPDATE acct SET balance = balance - 50 WHERE id = 1; COMMIT;\n-- T2 此时返回 250，而不是 300\nCOMMIT;','（T1）300\n（T2 等待……然后）250')],
 ('修复一个丢失更新的 bug','代码（读已提交）：<pre style="overflow-x:auto">doc = db.query("SELECT data FROM docs WHERE id = %s", id)\ndoc["likes"] += 1\ndoc["last_liked_by"] = user\ndb.execute("UPDATE docs SET data = %s WHERE id = %s", doc, id)</pre>高峰时点赞数明显少于实际点赞次数。请给出三种修复方式并比较。',
 '<ol><li><b>原子操作</b>（首选）：<pre style="overflow-x:auto">UPDATE docs SET data = jsonb_set(jsonb_set(data, \'{likes}\', to_jsonb((data-&gt;&gt;\'likes\')::int + 1)), \'{last_liked_by}\', to_jsonb(%s::text)) WHERE id = %s;</pre>在数据库内部完成读—改—写，持有行锁，没有竞争窗口。更好的做法是把 likes 拆成单独的整数列，<code>SET likes = likes + 1</code>。</li><li><b>显式锁</b>：在事务中 <code>SELECT data FROM docs WHERE id = %s FOR UPDATE</code>，后续并发请求排队。正确，但热门文档上会形成锁等待，吞吐受限；容易被后来的代码修改遗漏。</li><li><b>乐观并发（CAS / 版本号）</b>：增加 <code>version</code> 列，<code>UPDATE … SET data = %s, version = version + 1 WHERE id = %s AND version = %s</code>，影响行数为 0 时重新读取再试。不提前显式加锁，适合冲突少的场景；UPDATE 本身仍会取得行锁，冲突多时会等待或大量重试。也可以把事务改为可重复读，让 PostgreSQL 检测并报错，再重试。</li></ol><p>如果点赞量极大，可以把点赞记录为独立的行（或事件），计数作为派生数据异步汇总。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
