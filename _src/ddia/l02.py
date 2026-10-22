TITLE='非功能需求：以社交网络时间线为例';DESC='DDIA 第 2 章用一个社交网络的“首页时间线”贯穿始终：用户发帖、关注别人、打开首页看到关注对象的最新帖子。本课用这个例子说明如何描述负载（每秒发帖数、读写比、粉丝分布），比较“读时合并”与“写时扇出”两种实现及其对名人账号的处理，再讲如何描述性能：响应时间与延迟的区别、为什么看百分位而不是平均值、尾延迟放大，以及 SLO 的写法。';NEXT='可靠性、可扩展性与可维护性';MIN=55
SUM=['<b>数据模型</b>：<code>users</code>、<code>posts(user_id, text, ts)</code>、<code>follows(follower, followee)</code>。首页时间线 = 我关注的所有人最近的帖子，按时间倒序。',
'<b>方案一：读时合并</b>（pull）。打开首页时执行“查我关注的人 → 取他们的最新帖子 → 归并排序”。写很便宜，读很贵：关注 200 人的用户每次刷新都要查 200 个人的帖子。读远多于写时（首页刷新量可能是发帖量的数百倍），数据库扛不住。',
'<b>方案二：写时扇出</b>（push，物化时间线）。每个用户有一个预先算好的时间线缓存；发帖时把帖子 ID 写入每个粉丝的时间线。读变成一次按键读取，写的代价与粉丝数成正比。时间线是<b>派生数据</b>（第 1 课），可以从 posts 和 follows 重建。',
'<b>名人问题</b>：粉丝 1 亿的账号发一条帖子要写 1 亿次。混合方案：普通用户写时扇出；名人的帖子不扇出，读时单独查询再合并。这里描述负载的关键参数不是平均粉丝数，而是<b>粉丝数的分布</b>——偏斜的分布决定了架构。',
'<b>描述性能</b>：<b>响应时间</b>是客户端看到的总时长（含排队、网络）；<b>延迟</b>是请求等待处理的时间。响应时间是一个分布，要看<b>百分位</b>：p50（中位数）代表典型体验，p95/p99/p999 是<b>尾延迟</b>。平均值会被少数极端值拉偏，也不对应任何真实用户的体验。最慢的请求往往来自数据最多的用户——也就是最有价值的用户。',
'<b>尾延迟放大</b>：假设页面必须等全部后端返回，且各后端变慢相互独立：并行调用 100 个后端，每个后端有 1% 的请求慢，页面变慢的概率为 1 − 0.99<sup>100</sup> ≈ 63%。<b>排队</b>放大尾延迟：少数慢请求占住处理能力，后面的请求排队等待（队头阻塞），所以要在客户端测量。<b>SLO</b> 示例：“99% 的首页请求在 200 ms 内完成，月可用性 99.9%”；SLA 是附带赔偿条款的合同。计算百分位要用直方图（HdrHistogram、t-digest），不能把各机器的百分位求平均。']
def secs(prac,E):
    return [
('两种时间线实现','读时合并与写时扇出。','<div id="p1"></div>'),
('动手：选择扇出策略','选择一个账号的粉丝数，比较两种方案每次发帖与每次读的代价。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:110px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('尾延迟放大','一个请求依赖多个后端时。','<div id="p2"></div>'),
('计算百分位','用 Python 看平均值与百分位的差别。','<div id="t4"></div>'),
('在你的电脑上练习','需要 Python 3 和 Docker。时间线部分用 Redis（<code>docker run -d --name rd redis:8</code>，<code>docker exec -it rd redis-cli</code>），对应 <a href="../redis/index.html">Redis 课程</a>中的列表操作。',prac([
 ('保存为 <code>lat.py</code> 并运行：一万个正常请求加 50 个极慢请求。','import random, statistics\nrandom.seed(42)\nlat = [random.lognormvariate(3, 0.6) for _ in range(10000)]   # 毫秒\nlat += [random.uniform(500, 2000) for _ in range(50)]          # 少量极慢请求\nlat.sort()\ndef pct(p): return lat[int(len(lat) * p / 100) - 1]\nprint(f"平均  {statistics.mean(lat):7.1f} ms")\nfor p in (50, 95, 99, 99.9):\n    print(f"p{p:<5} {pct(p):7.1f} ms")','平均     30.0 ms\np50       20.0 ms\np95       57.1 ms\np99       93.1 ms\np99.9   1620.5 ms'),
 ('保存为 <code>fan.py</code> 并运行：尾延迟放大。','import random\nrandom.seed(7)\ndef slow_rate(n):   # 页面并行调用 n 个后端，每个后端 1% 的概率很慢\n    slow = sum(1 for _ in range(100000) if any(random.random() < 0.01 for _ in range(n)))\n    return slow / 100000\nfor n in (1, 10, 100):\n    print(f"调用 {n:3} 个后端：页面变慢的概率 {slow_rate(n):.1%}")','调用   1 个后端：页面变慢的概率 1.0%\n调用  10 个后端：页面变慢的概率 9.6%\n调用 100 个后端：页面变慢的概率 63.4%'),
 ('写时扇出：alice 发帖，写入她的两个粉丝的时间线。','SADD followers:alice bob carol\nSET post:1 "alice: 你好"\nLPUSH timeline:bob 1\nLPUSH timeline:carol 1','(integer) 2\nOK\n(integer) 1\n(integer) 1'),
 ('读时间线是一次按键读取；用 LTRIM 只保留最近 800 条。','LTRIM timeline:bob 0 799\nLRANGE timeline:bob 0 9\nGET post:1','OK\n1) "1"\n"alice: 你好"'),
 ('名人的帖子不扇出，读时合并。','ZADD celeb_posts:star 1761100000 post:99\nZREVRANGE celeb_posts:star 0 9','(integer) 1\n1) "post:99"')],
 ('为一个短视频应用设计首页 Feed','数据：日活 5000 万，平均每人关注 150 个账号，每天发布 500 万条视频；粉丝数中位数 30，最大 8000 万；首页 Feed 读取约 5 万次/秒。要求：p99 &lt; 300 ms。请：① 估算纯写时扇出每天的写入量；② 设计混合方案及阈值；③ 写出 SLO 并说明如何正确测量 p99。',
 '<ol><li>只有对同一个完整用户集合统计时，平均粉丝数才等于平均关注数；日活用户的平均关注数不能直接推出发帖账号的平均粉丝数。准确写入量是 <code>Σ（账号发帖数 × 该账号参与扇出的粉丝数）</code>。若额外假设每条视频的作者平均有 150 个粉丝，纯扇出才约为 500 万 × 150 = 7.5 亿次/天（约 8700 次/秒）；这只是示意估算，需要按实际发帖分布验证。偏斜使峰值更高：一个 8000 万粉丝的账号发一条就是 8000 万次写入。</li><li>粉丝数 &lt; 某阈值（如 10 万）的账号写时扇出到粉丝时间线（Redis 列表或专用存储，只保留最近 N 条 ID）；超过阈值的账号不扇出，读取 Feed 时取“我关注的名人”的最近内容（通常只有几个到几十个）与预计算时间线归并。还可以只为近期活跃的粉丝扇出，不活跃用户登录时再重建。</li><li>SLO：“滚动 30 天内，99% 的 Feed 请求在客户端测得的响应时间 &lt; 300 ms；可用性 ≥ 99.9%”。测量：在客户端或网关记录每个请求的耗时，按时间窗口写入直方图（HdrHistogram / t-digest），合并直方图后再算百分位；不要对各机器的 p99 求平均；同时监控各下游的 p99，以发现尾延迟放大。</li></ol>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
