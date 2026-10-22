TITLE='分布式锁';DESC='多个服务实例需要互斥地做一件事时，常用 Redis 实现分布式锁。本课从 SET NX EX 开始，逐步补上锁的各种缺陷：防止误删别人的锁、业务没做完锁就过期（续期）、主从切换导致锁丢失，并讨论 Redlock 的争议、fencing token，以及什么时候不该用 Redis 锁。';NEXT='限流、排行榜与计数器';MIN=65
SUM=['加锁：<code>SET lock:order:42 &lt;唯一值&gt; NX PX 30000</code>。NX 保证互斥，过期时间保证持有者崩溃后锁能释放。不要用 SETNX + EXPIRE 两条命令：中间崩溃会留下永不过期的锁。',
'解锁：只能删除自己的锁。值用唯一 ID（UUID + 线程 ID），解锁用 Lua 原子地“比较再删除”：<code>if redis.call("GET",KEYS[1])==ARGV[1] then return redis.call("DEL",KEYS[1]) end return 0</code>。直接 DEL 可能删掉锁过期后别人拿到的锁。',
'<b>续期</b>：业务耗时可能超过过期时间。持有者启动一个“看门狗”定时任务（如每 10 秒）把 TTL 延长到 30 秒（同样用 Lua 校验值），业务完成或进程退出后停止。Redisson 等客户端库已实现；进程卡顿（GC 停顿）时看门狗也会卡住，锁仍可能过期。',
'<b>主从切换丢锁</b>：锁写在主库后、复制到副本前主库宕机，副本被提升后锁不存在，另一个客户端也能加锁。<b>Redlock</b> 在 N 个（通常 5 个）独立主库上加锁，多数成功且总耗时小于有效期才算成功；但它依赖时钟和进程停顿的假设，Martin Kleppmann 等人认为它不足以保证正确性。',
'对<b>正确性</b>有要求时（同时两个持有者会造成数据错误），锁必须配合 <b>fencing token</b>：每次获得锁时同时得到一个单调递增的号码；令牌授予要与锁所有权绑定，令牌序列跨故障不能回退。单独在 SET 成功后执行 INCR 不满足这一点，写存储时带上号码，存储拒绝比已见过的更小的号码；或者直接用数据库的行锁/唯一约束/乐观锁版本号，或使用 etcd/ZooKeeper 这类基于共识的协调服务。',
'Redis 锁适合<b>效率</b>场景：避免重复计算、避免同一定时任务在多个实例上同时运行，偶尔两个实例同时执行只是浪费资源。还要考虑：可重入（哈希记录持有者和次数）、等待锁时用退避重试或 Pub/Sub 通知而不是忙等、锁的粒度要小。']
def secs(prac,E):
    return [
('一把锁需要的几个部分','逐步补上缺陷。','<div id="p1"></div>'),
('动手：没有 fencing token 时','客户端 1 拿到锁后发生 GC 停顿。选择保护手段，看存储里的结果。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:130px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('主从切换丢锁','异步复制再次出现。','<div id="p2"></div>'),
('相关命令','加锁、解锁、续期的脚本。','<div id="t4"></div>'),
('在你的电脑上练习','两个 redis-cli 终端扮演两个客户端。',prac([
 ('客户端 A 加锁成功，B 失败。','SET lock:job a-7f3c NX PX 30000\nSET lock:job b-91d2 NX PX 30000','OK\n(nil)'),
 ('B 不能删除 A 的锁（比较再删除）。','EVAL "if redis.call(\'GET\',KEYS[1])==ARGV[1] then return redis.call(\'DEL\',KEYS[1]) end return 0" 1 lock:job b-91d2','(integer) 0'),
 ('A 的看门狗续期。','EVAL "if redis.call(\'GET\',KEYS[1])==ARGV[1] then return redis.call(\'PEXPIRE\',KEYS[1],ARGV[2]) end return 0" 1 lock:job a-7f3c 30000\nPTTL lock:job','(integer) 1\n(integer) 29996'),
 ('A 完成后释放。','EVAL "if redis.call(\'GET\',KEYS[1])==ARGV[1] then return redis.call(\'DEL\',KEYS[1]) end return 0" 1 lock:job a-7f3c','(integer) 1'),
 ('INCR 只演示递增号码，不是可靠的 fencing 实现。','INCR lock:job:token','(integer) 1'),
 ('观察过期：设置很短的锁，等它过期后再看。','SET lock:x me NX PX 2000\n# 手工等待至少 3 秒后再输入：\nGET lock:x','OK\n(nil)')],
 ('判断哪些场景可以用 Redis 锁','对下面四个需求，判断能否只用 Redis 锁（SET NX PX + 比较删除 + 续期），不能的话给出方案：① 每天凌晨的报表任务在 10 个实例上只运行一次；② 用户提现时防止同一用户并发提交两笔导致超额；③ 缓存重建时只让一个请求回源；④ 多个工作进程修改对象存储中同一个文件，同时写会损坏文件。',
 '<ol><li><b>可以</b>。偶尔两个实例都执行只是重复计算；报表写入最好按日期幂等（覆盖同一份结果）。</li><li><b>不能只靠 Redis 锁</b>。可以用它挡住绝大多数并发提交，但正确性必须由数据库保证：在事务中 <code>SELECT … FOR UPDATE</code> 锁定账户行并检查余额，或用 <code>UPDATE … SET balance = balance - x WHERE id = ? AND balance &gt;= x</code> 判断影响行数；提现请求带幂等号并有唯一约束。</li><li><b>可以</b>。失败的代价只是多一次回源（第 18 课）。</li><li><b>不能只靠 Redis 锁</b>。GC 停顿或网络延迟时，锁过期后的旧持有者仍会写入。需要 fencing：由具备共识和持久化保证的锁服务在授予锁时生成单调 token，存储原子校验并记录最高 token。普通 Redis 的异步故障切换可能让 INCR 回退，不能据此保证正确性。写入时使用存储的条件写（如对象存储的 If-Match/版本号，或在元数据中记录最大 token，小于它的写入被拒绝）；或改用 etcd/ZooKeeper 的租约加 revision。</li></ol>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
