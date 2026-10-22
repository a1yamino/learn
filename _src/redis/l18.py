TITLE='缓存穿透、击穿与雪崩';DESC='缓存挡住了大部分请求，数据库就会按“剩下的那部分”来配置容量。一旦大量请求绕过缓存，数据库会在几秒内被压垮。本课讲三种典型情况：查询不存在的数据（穿透）、热点键过期瞬间（击穿）、大量键同时失效或缓存整体宕机（雪崩），以及对应的防护手段。';NEXT='热 key 与大 key';MIN=65
SUM=['<b>穿透</b>：请求的数据在数据库里也不存在（恶意 ID、爬虫、已删除的商品），缓存永远未命中，每次都查数据库。对策：① 缓存空值（<code>SET k "" EX 60</code>，TTL 短）；② 布隆过滤器预先判断 ID 是否可能存在；③ 在入口校验参数格式、限流。',
'<b>布隆过滤器</b>：一个位数组和 k 个哈希函数。说“不存在”一定不存在；说“存在”有一定误判率（如 1%）。Redis 8 内置 <code>BF.RESERVE</code>/<code>BF.ADD</code>/<code>BF.EXISTS</code>；不能删除元素（需要删除用 Cuckoo 过滤器），新数据要同步加入。',
'<b>击穿</b>：一个极热的键过期瞬间，成千上万个并发请求同时未命中，同时去数据库重建同一个值。对策：① <b>互斥重建</b>：只有拿到 <code>SET lock:k 1 NX EX 10</code> 的请求回源，其他请求短暂等待后重读缓存（或返回旧值）；② <b>逻辑过期</b>：缓存不设物理 TTL，值里带过期时间，过期后由一个请求在后台刷新，其他请求继续返回旧值；③ 进程内合并（singleflight）。',
'<b>雪崩</b>：大量键在同一时刻过期（例如同一批次预热、TTL 相同），或 Redis 整体不可用，请求整体涌向数据库。对策：TTL 加随机抖动；热点数据提前刷新；Redis 用 Sentinel/Cluster 保证高可用；应用侧对数据库回源<b>限流和熔断</b>，并有本地缓存或默认值降级。',
'冷启动（新集群、全部失效后）同样是雪崩：上线前预热热点键，或逐步放量。',
'这些手段都要和监控一起用：关注命中率、回源 QPS、数据库连接数；命中率突降是最早的信号。']
def secs(prac,E):
    return [
('三种情况','请求如何绕过缓存。','<div id="p1"></div>'),
('动手：热点键过期的一秒','一个热点键每秒 5000 次请求，重建需要 200 ms。选择防护方式，看这 1 秒内数据库收到多少次查询。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:90px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('布隆过滤器','用很小的空间回答“一定不存在”。','<div id="p2"></div>'),
('相关命令','布隆过滤器与互斥锁。','<div id="t4"></div>'),
('在你的电脑上练习','Redis 8 自带布隆过滤器（Valkey 需要加载 valkey-bloom 模块）。',prac([
 ('创建布隆过滤器：误判率 1%，预计 100 万个元素。','BF.RESERVE bf:product 0.01 1000000','OK'),
 ('加入存在的商品 ID。','BF.MADD bf:product 1001 1002 1003','1) (integer) 1\n2) (integer) 1\n3) (integer) 1'),
 ('查询：存在的返回 1，不存在的绝大多数返回 0。','BF.EXISTS bf:product 1002\nBF.EXISTS bf:product 999999','(integer) 1\n(integer) 0'),
 ('查看大小。','BF.INFO bf:product','1) Capacity\n2) (integer) 1000000\n3) Size\n4) (integer) 1198…\n…'),
 ('缓存空值。','SET shop:product:999999:v1 "" EX 60','OK'),
 ('互斥重建：只有一个请求拿到锁。','SET lock:shop:product:1001 req-a NX EX 10\nSET lock:shop:product:1001 req-b NX EX 10','OK\n(nil)')],
 ('给秒杀活动页做防护','秒杀活动 20:00 开始，活动页数据（商品、规则）缓存在 Redis，20:00 整点前后会有 10 万 QPS；有人用脚本请求随机商品 ID；数据库只能承受 2000 QPS。给出防穿透、防击穿、防雪崩的具体方案（包括键、TTL、命令），以及 Redis 主节点宕机时的降级行为。',
 '<ul><li><b>防穿透</b>：网关校验 ID 格式与活动商品白名单；对其余 ID 用布隆过滤器 <code>BF.EXISTS bf:product &lt;id&gt;</code>，不存在直接返回 404；数据库查不到的结果缓存空值 <code>EX 30</code>。对单 IP/设备限流（第 21 课）。</li><li><b>防击穿</b>：活动商品在 19:50 预热，使用<b>逻辑过期</b>：缓存不设 TTL（或设到活动结束后），值中带 <code>expire_at</code>；过期时由拿到 <code>SET lock:act:&lt;id&gt; &lt;uuid&gt; NX EX 5</code> 的请求异步刷新，其他请求继续返回旧值；进程内用 singleflight 合并同 key 的并发回源。</li><li><b>防雪崩</b>：非活动数据 TTL 加 ±10% 抖动；Redis 使用 Cluster 或 Sentinel；应用对数据库回源设置全局并发上限（如令牌桶 1500 QPS）和熔断，超出时返回“活动太火爆，请稍后”。</li><li><b>Redis 主节点宕机</b>：切换期间（十几秒）读本地缓存（Caffeine，活动数据 TTL 5 s）中的旧数据；本地也没有则降级页面，不把流量放到数据库。</li></ul>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
