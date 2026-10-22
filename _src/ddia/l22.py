CL_='# 节点 B 的时钟比 A 慢 3 毫秒；LWW 按时间戳保留“最新”的写入\nreal = 0.0\nskew = {"A": 0.0, "B": -0.003}\ndef ts(node): return real + skew[node]\nstore = {}\ndef lww_write(node, k, v):\n    t = ts(node)\n    if k not in store or t > store[k][1]: store[k] = (v, t)\nreal = 1.000; lww_write("A", "x", 1)        # 真实时间 1.000 s，A 写 x=1\nreal = 1.002; lww_write("B", "x", 2)        # 真实时间晚 2 ms，B 写 x=2\nprint("最终 x =", store["x"][0], "（后发生的 x=2 被丢弃了）")'
FE_='class Storage:\n    def __init__(self): self.max_token, self.data = 0, []\n    def write(self, token, value):\n        if token < self.max_token:\n            return f"拒绝 {value!r}：令牌 {token} < 已见过的 {self.max_token}"\n        self.max_token = token; self.data.append(value); return f"接受 {value!r}（令牌 {token}）"\n\nclass LockService:\n    def __init__(self): self.token = 32\n    def acquire(self): self.token += 1; return self.token\n\nlock, disk = LockService(), Storage()\nt1 = lock.acquire()                       # 客户端 1 拿到租约，令牌 33\n# …客户端 1 发生 15 秒的 GC 停顿，租约过期…\nt2 = lock.acquire()                       # 客户端 2 拿到租约，令牌 34\nprint(disk.write(t2, "客户端2的数据"))\nprint(disk.write(t1, "客户端1的数据"))     # 客户端 1 醒来，以为自己仍持有锁'
TITLE='不可靠的时钟、进程暂停与多数决';DESC='第 9 章后半部分。除了网络，时间是分布式系统中的另一个不确定来源：每台机器的时钟都有误差，进程可能在任意时刻被暂停数秒而自己毫不知情。本课讲单调时钟与日历时钟的区别、时钟同步的精度、依赖同步时钟的危险（LWW 丢数据）与置信区间（Spanner 的 TrueTime），进程暂停对租约的影响，以及节点如何“由多数决定真相”：分布式锁、租约与 fencing 令牌，拜占庭故障，系统模型与正确性的定义，以及形式化方法与确定性仿真测试。'
NEXT='线性一致性';MIN=70
SUM=['<b>两种时钟</b>：<b>日历时钟</b>（<code>clock_gettime(CLOCK_REALTIME)</code>、<code>time.time()</code>）返回自 1970 年起的时间，会被 NTP 调整，可能<b>向后跳</b>，不适合测量时长；<b>单调时钟</b>（<code>CLOCK_MONOTONIC</code>、<code>time.monotonic()</code>）保证只增不减，适合测量超时和耗时，但其绝对值没有意义，不能跨机器比较。',
'<b>时钟同步的精度</b>：石英钟漂移约 200 ppm（每天 17 秒）；NTP 同步精度受网络延迟限制，通常是几毫秒到几十毫秒；时钟可能因与 NTP 相差太大而被拒绝同步或强行重置；闰秒；虚拟机暂停后时钟突然跳变；用户设备的时钟根本不可信。使用 GPS 与原子钟、PTP 协议可以达到微秒级，云服务商也提供高精度时钟服务。',
'<b>依赖同步时钟的危险</b>：多主或无主复制中用时间戳实现 LWW（第 13、14 课）时，时钟慢的节点写入的值会被时钟快的节点之前写入的值覆盖——<b>后发生的写入被静默丢弃</b>。时钟读数应该看作一个<b>置信区间</b>：[最早, 最晚]。Spanner 的 TrueTime API 直接返回这个区间，提交时<b>等待</b>区间的宽度，保证提交时间戳反映真实的先后顺序。',
'<b>进程暂停</b>：GC 停顿、虚拟机被挂起或迁移、笔记本合盖、操作系统换页、SIGSTOP、同步磁盘 I/O……一个线程可能在任意两行代码之间被暂停几秒甚至几分钟，醒来后完全不知道。经典错误：持有租约的节点检查“租约还剩 10 秒”，然后发生 15 秒的停顿，醒来后在租约已过期的情况下继续执行写入——此时另一个节点已经拿到了租约。',
'<b>多数决与 fencing 令牌</b>：节点不能相信自己对情况的判断（“我是主节点”“我持有锁”），因为它可能被暂停、被网络隔离。决定由<b>法定多数</b>（quorum）做出。分布式锁每次授予时附带一个单调递增的<b>fencing 令牌</b>，受保护的存储服务记录见过的最大令牌，拒绝更小令牌的写入——这样，醒来的旧持有者也无法造成破坏。<b>拜占庭故障</b>是指节点可能撒谎或发送任意错误的消息；在一个组织内部的数据中心通常不考虑，但区块链与某些航天系统需要。',
'<b>系统模型与正确性</b>：时序模型分为同步、<b>部分同步</b>（大多数时候有界，偶尔无界，最贴近现实）、异步；节点故障模型分为崩溃—停止、<b>崩溃—恢复</b>（最常用）、拜占庭。算法的性质分为<b>安全性</b>（坏事永远不会发生，如“不会有两个主节点”）与<b>活性</b>（好事最终会发生，如“请求最终得到响应”）。<b>形式化方法</b>（TLA+ 模型检查）、<b>故障注入</b>（Jepsen）和<b>确定性仿真测试</b>（FoundationDB、TigerBeetle：把网络、时钟、磁盘都换成可重放的模拟，在一台机器上探索海量故障组合）是验证这些算法的手段。']
def secs(prac,E):
    return [
('租约与进程暂停','醒来时，租约已经属于别人了。','<div id="p1"></div>'),
('动手：时钟偏差与 LWW','选择两个节点的时钟偏差，看后写入的值是否幸存。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:90px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('fencing 令牌','存储服务拒绝过时的令牌。','<div id="p2"></div>'),
('两种时钟','在 Python 与 Linux 中查看。','<div id="t4"></div>'),
('在你的电脑上练习','只需要 Python 3（Linux/macOS 上的 <code>chronyc</code> 可选）。',prac([
 ('保存为 <code>clock.py</code>：时钟慢 3 ms 的节点，后写入的值被丢弃。',CL_,'最终 x = 1 （后发生的 x=2 被丢弃了）'),
 ('保存为 <code>fence.py</code>：fencing 令牌阻止被暂停的旧锁持有者写入。',FE_,"接受 '客户端2的数据'（令牌 34）\n拒绝 '客户端1的数据'：令牌 33 < 已见过的 34"),
 ('测量时长要用单调时钟。','python3 -c "import time; a=time.monotonic(); time.sleep(0.2); print(round(time.monotonic()-a, 2))"','0.2'),
 ('查看本机与 NTP 服务器的偏差（Linux，若装有 chrony）。','chronyc tracking','Reference ID    : …\nSystem time     : 0.000012345 seconds fast of NTP time\nRoot dispersion : 0.000543 seconds\n…'),
 ('在 Redis 中实现租约：SET NX PX 是带过期时间的锁，但它本身不提供 fencing 令牌，可以用 INCR 生成一个。','docker exec rd redis-cli SET lock:job worker1 NX PX 10000\ndocker exec rd redis-cli INCR lock:job:token','OK\n(integer) 1')],
 ('审查一个基于 Redis 的分布式锁','代码：<pre style="overflow-x:auto">if redis.set("lock:report", me, nx=True, px=30000):\n    data = build_report()          # 可能需要 10–60 秒\n    s3.put("report.csv", data)     # 覆盖写\n    redis.delete("lock:report")</pre>请指出至少三个问题并给出修复。',
 '<ol><li><b>租约过期仍在执行</b>：<code>build_report</code> 超过 30 秒（或 GC 停顿）时锁已过期，另一个实例拿到锁，两者同时写 S3，旧实例的结果可能覆盖新实例的。修复：使用 fencing 令牌——获取锁时 <code>INCR</code> 得到递增令牌，写入时把令牌写进对象元数据/路径，由存储端（或写入前的条件检查）拒绝更小的令牌；S3 可以用条件写入（If-Match ETag / If-None-Match）实现比较并设置。</li><li><b>误删别人的锁</b>：<code>delete</code> 时锁可能已过期并被别人持有。修复：用 Lua 脚本检查值等于 <code>me</code> 再删除。</li><li><b>单个 Redis 实例</b>：Redis 主从异步复制，主节点故障切换后锁可能丢失，两个客户端同时持有锁。若要求正确性（而不只是效率），应使用基于共识的协调服务（etcd、ZooKeeper），它们提供会话租约和单调递增的版本号（可作 fencing 令牌）。</li><li><b>续租</b>：长任务应在后台续租（看门狗），并在续租失败时主动停止工作；但续租不能代替 fencing——进程暂停时看门狗也一起暂停了。</li><li>如果锁只是为了避免重复劳动（效率），偶尔两人同时执行可以接受，单 Redis 锁即可；如果是为了正确性，必须有 fencing。</li></ol>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
