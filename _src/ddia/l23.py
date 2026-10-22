LIN_='from itertools import permutations\n# 每个操作：(客户端, 类型, 值, 开始时间, 结束时间)；寄存器初始值为 0\ndef linearizable(history):\n    for order in permutations(history):\n        # 1) 实时顺序：若 a 结束早于 b 开始，a 必须排在 b 前面\n        if any(order.index(a) > order.index(b) for a in history for b in history if a[4] < b[3]):\n            continue\n        # 2) 按这个顺序执行，每次读都要读到最近一次写入的值\n        v, ok = 0, True\n        for c, op, val, s, e in order:\n            if op == "w": v = val\n            elif val != v: ok = False; break\n        if ok: return " → ".join(f"{c}:{op}({val})" for c, op, val, s, e in order)\n    return None\n\nh1 = [("A", "w", 1, 0, 10), ("B", "r", 1, 5, 6), ("C", "r", 1, 7, 8)]\nh2 = [("A", "w", 1, 0, 10), ("B", "r", 1, 2, 3), ("C", "r", 0, 4, 5)]   # B 读到新值之后，C 又读到旧值\nfor name, h in (("历史 1", h1), ("历史 2", h2)):\n    r = linearizable(h)\n    print(name, "可线性化：" + r if r else "不可线性化")'
TITLE='线性一致性';DESC='第 10 章开篇。最终一致性下，同时问两个副本可能得到两个不同的答案。线性一致性（也叫原子一致性、强一致性）提供最强的单对象保证：让系统看起来只有一份数据，所有操作都是原子的。本课讲它的精确定义（时间线上的“生效点”）、它与可串行化的区别、哪些场景真正依赖它（选主与锁、唯一性约束、跨通道的时序依赖），哪些复制方式能实现它，以及它的代价：CAP 定理与性能。练习里你会写一个小程序判断一段执行历史是否可线性化。';NEXT='逻辑时钟、ID 生成与共识'
MIN=65
SUM=['<b>定义</b>：每个操作在其开始与结束之间的某个时刻<b>原子地生效</b>（线性化点）。一旦某个读返回了新值，之后开始的所有读（无论哪个客户端）都必须返回新值或更新的值——不能“回到过去”。这是一种<b>新近性保证</b>：读到的总是最新的值。直观地说：系统表现得像只有一个副本。',
'<b>与可串行化的区别</b>：可串行化是<b>事务</b>的隔离属性（多对象），保证结果等价于某个串行顺序，但这个顺序不必与真实时间一致；线性一致性是<b>单个对象</b>读写的新近性保证，不涉及事务。两者都满足叫<b>严格可串行化</b>。基于 2PL 或真正串行执行的可串行化通常也是线性一致的；SSI 不是（从快照读）。',
'<b>依赖线性一致性的场景</b>：① <b>选主与锁</b>——所有节点必须就“谁持有锁”达成一致（etcd、ZooKeeper 提供线性一致的写操作）；② <b>唯一性约束</b>——用户名、文件路径、座位不能重复分配，相当于对一个“锁”的线性一致的比较并设置；③ <b>跨通道的时序依赖</b>——网站把图片写入存储后，通过消息队列通知缩略图服务；如果存储不是线性一致的，缩略图服务可能读到旧图片——消息队列比存储复制更快，形成竞争。',
'<b>实现方式</b>：<b>单主复制</b>——从主节点（或同步更新的从节点）读，有可能线性一致，但前提是确实知道谁是主（脑裂时不成立），异步复制的故障切换会丢失已确认的写入，也违反线性一致性；<b>共识算法</b>——是的（正确实现时），第 24 课；<b>多主复制</b>——不是；<b>无主复制</b>——通常不是：即使 w + r &gt; n，读写并发时也可能违反（除非读时同步执行读修复、写前先读 Quorum，代价很高），LWW 基于时钟更不可能。',
'<b>CAP 定理</b>：网络分区时，系统要么保持线性一致（某些节点无法服务请求，不可用），要么保持可用（返回可能过时的数据，非线性一致）。不需要线性一致性的应用可以容忍分区。CAP 常被误读为“三选二”——分区不是可以选择的，它总会发生；而且 CAP 只考虑一种一致性和一种故障，实际意义有限。更现实的考量是<b>性能</b>：线性一致的读写的响应时间至少与网络延迟的不确定性成正比，跨区域时尤其慢。很多系统放弃线性一致性不是为了容错，而是为了性能。']
def secs(prac,E):
    return [
('新近性保证','一旦有人读到新值，之后的读就不能再读到旧值。','<div id="p1"></div>'),
('动手：这段历史可线性化吗','选择一段执行历史，判断它是否可线性化。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:110px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('跨通道的时序依赖','消息比存储复制先到。','<div id="p2"></div>'),
('线性一致的操作','etcd 与 PostgreSQL 中的例子。','<div id="t4"></div>'),
('在你的电脑上练习','Python 3。以及第 12 课的一主一从（<code>pg1</code>、<code>pg2</code>）。',prac([
 ('保存为 <code>lin.py</code>：暴力枚举顺序，检查一段读写历史是否可线性化。',LIN_,'历史 1 可线性化：A:w(1) → B:r(1) → C:r(1)\n历史 2 不可线性化'),
 ('改一改：把历史 2 中 C 的读改为在 B 之前开始（开始时间 1、结束时间 2），再运行。为什么这次可以了？','sed -i \'s/("C", "r", 0, 4, 5)/("C", "r", 0, 1, 2)/\' lin.py && python3 lin.py','历史 1 可线性化：A:w(1) → B:r(1) → C:r(1)\n历史 2 可线性化：C:r(0) → A:w(1) → B:r(1)'),
 ('用 PostgreSQL 主从复现非线性一致：从节点暂停重放后，主节点写入，客户端 B 从主节点读到新值，随后客户端 C 从从节点读到旧值。','docker exec pg2 psql -U postgres -c "SELECT pg_wal_replay_pause();"\ndocker exec pg1 psql -U postgres -c "CREATE TABLE IF NOT EXISTS reg(id int PRIMARY KEY, v int); INSERT INTO reg VALUES (1, 1) ON CONFLICT (id) DO UPDATE SET v = reg.v + 1 RETURNING v;"\ndocker exec pg2 psql -U postgres -Atc "SELECT v FROM reg WHERE id = 1;"','（主节点）v = 新值\n（从节点）旧值或报错：表尚未复制到从节点'),
 ('恢复重放。若需要线性一致的读，就从主节点读，或在主节点上使用同步复制 remote_apply 并从同步从节点读。','docker exec pg2 psql -U postgres -c "SELECT pg_wal_replay_resume();"','')],
 ('判断这些需求是否需要线性一致性','对每一项说明是否需要线性一致性，以及推荐的做法：① 用户名注册不能重复；② 社交网络的点赞数显示；③ 秒杀活动中库存不能超卖；④ 用户修改头像后，好友的页面在几秒后显示新头像即可；⑤ 后台任务调度：同一个任务同一时间只能由一个工作节点执行。',
 '<ol><li><b>需要</b>（唯一性约束）：用单主数据库的唯一索引（在主节点上检查），或线性一致的比较并设置。</li><li><b>不需要</b>：近似计数，最终一致即可，甚至可以用 CRDT 计数器或异步汇总。</li><li><b>需要</b>（对库存的原子扣减）：在单个主节点上原子地 <code>UPDATE stock SET n = n - 1 WHERE id = … AND n &gt; 0</code>，或 Redis 单实例上的 DECR/Lua；热点商品可以把库存拆成多个分桶，每个桶内线性一致。</li><li><b>不需要</b>：最终一致 + 缓存过期即可；但上传者本人应满足读己之写（第 12 课）。</li><li><b>需要</b>（锁/选主）：使用 etcd/ZooKeeper 等基于共识的协调服务获取租约，并在执行副作用时使用 fencing 令牌（第 22 课）。</li></ol>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
