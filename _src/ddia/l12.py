TITLE='复制延迟带来的问题与对策';DESC='异步从节点总会落后主节点一点点——通常不到一秒，但在负载高、网络差或从节点在恢复时，可能落后几分钟。只要应用从从节点读取，就会看到“过去”。本课讲三种典型异常：读不到自己刚写的数据、时间倒流（单调读被破坏）、看到答案却看不到问题（一致前缀被破坏），以及每种异常的对策，包括用 PostgreSQL 的 LSN 实现“读己之写”。';NEXT='多主复制、同步引擎与冲突解决';MIN=60
SUM=['<b>最终一致性</b>：停止写入并等待足够久，所有从节点最终会与主节点一致。但“最终”没有上限，应用要考虑：延迟增加到几秒、几分钟时，用户会看到什么？如果答案是“会出问题”，就需要比最终一致更强的保证。',
'<b>读己之写</b>（read-after-write / read-your-writes）：用户提交了一条评论，刷新后却看不到，因为读请求被发到了落后的从节点。对策：用户自己可能修改的数据（自己的个人资料）从主节点读；写入后的一段时间（如 1 分钟）内从主节点读；客户端记住最近一次写入的<b>日志位置</b>（LSN 或时间戳），读取时只用已经追上该位置的从节点，或者等它追上。跨设备时，这个位置要放在服务端，而不是某台设备的本地。',
'<b>单调读</b>：用户刷新两次，第一次请求落到较新的从节点，第二次落到较旧的，数据好像<b>时间倒流</b>。单调读保证不会看到比已经看过的更旧的数据。对策：同一用户总是读同一个副本（按用户 ID 哈希选择副本）；副本故障时需要重新路由，同时带上已读位置。',
'<b>一致前缀读</b>：A 提问、B 回答，两条写入在不同分区（第 15 课）中以不同的延迟复制，观察者先看到回答、后看到问题。一致前缀读保证：如果一系列写入按某个顺序发生，读到它们的人也按同样的顺序看到。对策：有因果关系的写入放在同一个分区；或者显式跟踪因果依赖（第 24 课）。',
'<b>根本的取舍</b>：在应用层处理这些问题复杂且容易出错。这正是数据库提供更强保证（事务、线性一致性）的价值所在。另一个方向是让应用天然容忍延迟：例如写入后在本地乐观地显示结果。<b>跨区域</b>部署时延迟更大，这些问题会更常见。']
def secs(prac,E):
    return [
('三种异常','读己之写、单调读、一致前缀读。','<div id="p1"></div>'),
('动手：读到了什么','选择读取策略，看用户刷新页面时看到的结果。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:110px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('用 LSN 实现读己之写','写入时记下位置，读取时等从节点追上。','<div id="p2"></div>'),
('相关函数','PostgreSQL 中与复制位置有关的函数。','<div id="t4"></div>'),
('在你的电脑上练习','需要一主一从：按第 11 课练习的步骤 1–3 重新创建 <code>pg1</code>、<code>pg2</code>（先 <code>docker rm -f pg1 pg2</code>）。用“暂停重放”模拟复制延迟。',prac([
 ('暂停从节点的 WAL 重放，模拟延迟。','docker exec pg2 psql -U postgres -c "SELECT pg_wal_replay_pause();"',' pg_wal_replay_pause\n---------------------\n'),
 ('用户发表评论（写主节点），然后从从节点读取：读不到自己的写入。','docker exec pg1 psql -U postgres -c "CREATE TABLE IF NOT EXISTS comments(id serial, body text); INSERT INTO comments(body) VALUES (\'我的评论\');"\ndocker exec pg2 psql -U postgres -c "SELECT * FROM comments;"','INSERT 0 1\nERROR:  relation "comments" does not exist\n（或者表存在但没有这一行：从节点还停留在过去）'),
 ('确认上一步写入已提交，再单独查询主节点的 LSN。输出是示意值；后两步必须用本机实际返回的值替换 <code>0/3021A58</code>。','docker exec pg1 psql -U postgres -Atc "SELECT pg_current_wal_lsn();"','0/3021A58'),
 ('读之前检查从节点是否已追上该位置。','docker exec pg2 psql -U postgres -Atc "SELECT pg_last_wal_replay_lsn() >= \'0/3021A58\'::pg_lsn;"','f\n（没追上：应该等待、换一个副本，或者改从主节点读）'),
 ('恢复重放后再检查。','docker exec pg2 psql -U postgres -c "SELECT pg_wal_replay_resume();"\nsleep 1\ndocker exec pg2 psql -U postgres -Atc "SELECT pg_last_wal_replay_lsn() >= \'0/3021A58\'::pg_lsn;"\ndocker exec pg2 psql -U postgres -c "SELECT * FROM comments;"','t\n id |   body\n----+----------\n  1 | 我的评论')],
 ('为一个问答社区设计读路由','架构：一个主库、三个异步从库，最大延迟偶尔达到 30 秒。需求：① 用户发帖或回答后，立即在自己的页面和帖子页看到；② 同一用户反复刷新，看到的回答数不能变少；③ 不能出现“先看到回答、后看到问题”。请写出路由规则（伪代码），并说明用户在手机上发帖、在电脑上查看时如何处理。',
 '<pre style="overflow-x:auto">write(user, sql):\n    primary.begin()\n    primary.exec(sql)\n    primary.commit()                       # 先等待 COMMIT 成功\n    lsn = primary.scalar("SELECT pg_current_wal_insert_lsn()")  # 提交后、同一主库另发查询\n    session_store.atomic_max(f"lsn:{user}", lsn, ttl=60s)  # 按 pg_lsn 数值比较；服务端跨设备共享\n\nread(user, sql):\n    need = session_store.get(f"lsn:{user}")        # 可能为空\n    seen = session_store.get(f"seen:{user}")       # 单调读：已读到的位置\n    floor = max(need, seen)\n    r = replicas[hash(user) % 3]                   # 粘性路由：同一用户读同一副本\n    if floor and r.replay_lsn() &lt; floor:\n        r = first(x for x in replicas if x.replay_lsn() &gt;= floor) or primary\n    rows, pos = r.exec(sql), r.replay_lsn()\n    session_store.atomic_max(f"seen:{user}", pos)  # 避免并发读取覆盖更大的位置\n    return rows</pre><ol><li>读己之写：必须先提交，再单独查询包含提交记录的 WAL 位置；把写入与取位置放在同一隐式事务或在 COMMIT 前查询，屏障可能先于提交记录。位置按 pg_lsn 数值比较，并在同一复制时间线内使用；故障切换时重新确认可用位置与已确认写入的保留情况。写入位置保存在<b>服务端</b>（Redis 等），不是设备本地，所以手机发帖后电脑也能读到；也可以简单地“写后 60 秒内读主库”。</li><li>单调读：粘性路由 + 记录已读位置，副本切换时也不会倒退。</li><li>一致前缀：问题和回答在同一个数据库（单一的复制日志）中按提交顺序复制，从节点按顺序重放，天然满足；如果将来按帖子分片，要保证同一帖子的问题与回答在同一分片。</li></ol>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
