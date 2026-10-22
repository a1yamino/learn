Q_='import random\nrandom.seed(5)\nN = 3\nnodes = [{"v": 0, "ver": 0} for _ in range(N)]\n\ndef write(val, ver, w):\n    up = random.sample(range(N), N)        # 随机顺序\n    for i in up[:w]: nodes[i] = {"v": val, "ver": ver}   # 只有 w 个节点及时收到\ndef read(r):\n    got = [nodes[i] for i in random.sample(range(N), r)]\n    return max(got, key=lambda x: x["ver"])["v"]  # 取版本号最大的\n\nfor w, r in [(1, 1), (2, 1), (2, 2), (3, 1)]:\n    stale = 0\n    for t in range(1, 10001):\n        for n in nodes: n.update(v=0, ver=0)\n        write(t, t, w)\n        if read(r) != t: stale += 1\n    print(f"n={N} w={w} r={r}  w+r>n: {str(w + r > N):5}  读到旧值 {stale/100:.1f}%")'
VV_='def compare(a, b):\n    keys = set(a) | set(b)\n    le = all(a.get(k, 0) <= b.get(k, 0) for k in keys)\n    ge = all(a.get(k, 0) >= b.get(k, 0) for k in keys)\n    if le and ge: return "相同"\n    if le: return "a 发生在 b 之前（b 可以覆盖 a）"\n    if ge: return "b 发生在 a 之前（a 可以覆盖 b）"\n    return "并发（需要保留两者或合并）"\nprint(compare({"A": 1}, {"A": 2}))\nprint(compare({"A": 2, "B": 1}, {"A": 1}))\nprint(compare({"A": 2}, {"A": 1, "B": 1}))'
TITLE='无主复制：Quorum 与并发写';DESC='Amazon 的 Dynamo 论文让另一种复制方式流行起来：没有主节点，客户端直接把写入发给多个副本，读取时也从多个副本读取并取最新值。Cassandra、ScyllaDB、Riak 都是这种风格。本课讲 Quorum 读写（w + r &gt; n）、读修复与反熵、Quorum 一致性的局限、宽松 Quorum，单主与无主在性能与多区域上的比较，以及如何用版本向量检测并发写入。'
NEXT='分片：按键范围、按哈希与热点';MIN=65
SUM=['<b>无主复制</b>：每个键存在 n 个副本上。客户端（或一个协调节点）把写入并行发给全部 n 个副本，收到 w 个确认即算成功；读取时并行读 r 个副本，按版本号取最新的值。某个副本宕机时，写入照常进行，不需要故障切换。',
'<b>Quorum 条件</b>：只要 <b>w + r &gt; n</b>，读到的 r 个副本中至少有一个包含最新成功写入的值。常见配置 n=3、w=2、r=2，可以容忍一个节点不可用。读多写少可以用 w=n、r=1，但任何一个节点故障都会让写入失败。',
'<b>追赶</b>：宕机后恢复的节点缺少一些写入。<b>读修复</b>——读取时发现某个副本是旧值，就把新值写回去（只修复被读到的键）。<b>反熵</b>——后台进程比较副本之间的差异（用 Merkle 树快速定位不同的键范围）并复制缺失的数据。<b>提示移交</b>——写入时某个副本不可达，先写到另一个节点并附上“提示”，目标恢复后再转交。',
'<b>Quorum 的局限</b>：即使 w + r &gt; n，也可能读到旧值——写入只在部分副本成功（总体判定失败）却没有回滚；读写并发时，读可能只碰到已经写好的部分副本；节点从旧副本恢复数据；LWW 下时钟偏差使较新的写入被丢弃。所以 Quorum 不提供线性一致性（第 23 课），更不提供读己之写等保证，除非额外处理。<b>宽松 Quorum</b>允许把写入暂存到不属于这个键的 n 个“家”节点之外的节点，提高写可用性，但连 w + r &gt; n 的保证都没有了。',
'<b>性能与多区域</b>：无主复制没有故障切换的停顿；读写都发给多个副本、取最快的 w 或 r 个响应，天然降低尾延迟（类似<b>请求对冲</b>）。但每个请求消耗更多资源，并且副本越多，碰到慢节点的概率越大。多区域部署时，可以让 n 包含所有区域的副本，而 w、r 只等待本地区域（Cassandra 的 LOCAL_QUORUM）。',
'<b>检测并发写入</b>：两个客户端并发写同一个键，各副本收到的顺序可能不同，必须用相同的规则收敛。“并发”不是指时间上同时，而是指彼此都<b>不知道</b>对方的存在（没有 happens-before 关系）。<b>版本号</b>：服务器为每个键维护版本号，客户端写入时带上自己读到的版本，服务器据此判断哪些旧值可以覆盖、哪些是并发的<b>兄弟值</b>需要保留。多副本时每个副本一个计数器，合起来就是<b>版本向量</b>。']
def secs(prac,E):
    return [
('Quorum 读写','n=3、w=2、r=2，一个副本宕机时。','<div id="p1"></div>'),
('动手：调整 w 与 r','选择配置，看读到旧值的概率与可用性。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:110px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('版本向量','判断两个写入是先后关系还是并发。','<div id="p2"></div>'),
('Cassandra 的一致性级别','cqlsh 中按请求设置 w 和 r。','<div id="t4"></div>'),
('在你的电脑上练习','只需要 Python 3。',prac([
 ('保存为 <code>quorum.py</code>：每次写入只有 w 个节点及时收到，随后读 r 个节点。',Q_,'n=3 w=1 r=1  w+r>n: False  读到旧值 66.9%\nn=3 w=2 r=1  w+r>n: False  读到旧值 34.0%\nn=3 w=2 r=2  w+r>n: True   读到旧值 0.0%\nn=3 w=3 r=1  w+r>n: True   读到旧值 0.0%'),
 ('保存为 <code>vv.py</code>：比较两个版本向量。',VV_,'a 发生在 b 之前（b 可以覆盖 a）\nb 发生在 a 之前（a 可以覆盖 b）\n并发（需要保留两者或合并）'),
 ('想一想：在 quorum.py 中，如果把 read() 中“取版本号最大的”改成“取第一个读到的”，w=2、r=2 时还能保证读到新值吗？为什么无主复制必须给值附带版本？','','')],
 ('为一个全球用户会话存储选择 Quorum 配置','三个区域（上海、法兰克福、弗吉尼亚），每个区域 3 个副本（共 n=9，Cassandra 风格）。会话数据：登录时写入，之后每个请求读取，用户通常只在一个区域活动；要求区域内单节点故障不影响读写，区域间网络中断时各区域仍能服务本区域用户；读延迟 p99 &lt; 10 ms。请选择写和读的一致性级别，并分析它提供和不提供哪些保证。',
 '<ol><li>写 <code>LOCAL_QUORUM</code>（本区域 3 个副本中的 2 个确认），读 <code>LOCAL_QUORUM</code>：本区域内 w + r = 4 &gt; 3，同一区域的读能看到同一区域已成功的写；只等待本地副本，延迟低；区域内一个节点故障仍满足 2/3；区域间断网时各区域独立工作。其他区域的副本异步获得数据（以及读修复、反熵）。</li><li>不提供的保证：用户切换到另一个区域（例如漫游、DNS 切换）后可能读不到刚登录写入的会话——可以在客户端带上会话令牌（自包含的签名令牌）兜底，或在读不到时退回 <code>EACH_QUORUM</code>/跨区读取。</li><li>不提供线性一致性：并发的“登出”与“刷新会话”可能以 LWW 方式解决，取决于时间戳；如果登出必须立即全局生效（安全要求），应该用单独的、强一致的吊销列表或短有效期令牌。</li><li>若用 <code>QUORUM</code>（9 个中的 5 个）就必须跨区域等待，延迟无法满足 10 ms，且区域间断网时可能无法凑足 5 个。</li></ol>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
