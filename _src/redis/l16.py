TITLE='缓存模式：Cache-Aside 与读写策略';DESC='从这一课开始讲缓存设计。先回答几个基本问题：什么数据值得缓存、命中率如何决定收益、应用如何读写缓存。本课比较 Cache-Aside、Read-Through、Write-Through 和 Write-Behind 四种模式，并讲键名、序列化、TTL 和缓存空间的设计。';NEXT='缓存一致性：更新数据库与删除缓存';MIN=60
SUM=['缓存的收益取决于<b>命中率</b>：平均延迟 ≈ 命中率 × 缓存延迟 + (1 − 命中率) × (缓存延迟 + 数据库延迟)。命中率从 90% 提到 99%，回源到数据库的请求减少 10 倍。读多写少、计算代价高、能容忍短暂旧数据的数据最适合缓存。',
'<b>Cache-Aside（旁路缓存）</b>：读时先查缓存，未命中再查数据库并写入缓存（带 TTL）；写时先更新数据库，再<b>删除</b>缓存。应用自己控制，最常用；缓存宕机时可以退化为直接读数据库。',
'<b>Read-Through / Write-Through</b>：应用只和缓存层打交道，由缓存层（库或代理）负责回源和同步写数据库。<b>Write-Behind</b>：先写缓存，异步批量写回数据库，写入快、能合并，但缓存故障会丢数据，适合计数、点赞等可以容忍少量丢失的数据。',
'键名：<code>&lt;服务&gt;:&lt;实体&gt;:&lt;id&gt;[:版本]</code>，例如 <code>shop:product:1001:v3</code>；版本号便于修改数据结构时整体切换。值：小对象可以用 JSON 字符串一次读写；字段多、部分更新频繁时用哈希。注意序列化体积，压缩大于几 KB 的值。',
'TTL：每个缓存键都要有 TTL，作为一致性的最后保障和内存回收手段；在基准值上加随机抖动（如 ±10%）避免同时过期（第 18 课）。给缓存实例设置 <code>maxmemory</code> 和 <code>allkeys-lru</code> 或 <code>allkeys-lfu</code>。',
'本地缓存（进程内，如 Caffeine）+ Redis 组成两级缓存，可以挡住极热的键，但多实例之间一致性更难：用较短 TTL，或通过 Pub/Sub 广播失效消息，或使用 Redis 的客户端缓存追踪（<code>CLIENT TRACKING</code>）。']
def secs(prac,E):
    return [
('Cache-Aside 的读和写','读：查缓存→回源→填充；写：更新数据库→删除缓存。','<div id="p1"></div>'),
('动手：命中率与延迟','缓存 0.5 ms，数据库 20 ms，数据库最多承受 3000 QPS，总请求 20000 QPS。选择命中率。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:90px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('四种模式对比','谁负责读写数据库，什么时候写。','<div id="p2"></div>'),
('相关命令','缓存常用的命令。','<div id="t4"></div>'),
('在你的电脑上练习','用 redis-cli 模拟一次 Cache-Aside（数据库部分用注释表示）。',prac([
 ('读：缓存未命中。','GET shop:product:1001:v1','(nil)'),
 ('从数据库读到后写入缓存，TTL 600 秒加随机抖动。','SET shop:product:1001:v1 \'{"id":1001,"name":"键盘","price":399}\' EX 637','OK'),
 ('再次读取命中。','GET shop:product:1001:v1\nTTL shop:product:1001:v1','"{\\"id\\":1001,\\"name\\":\\"键盘\\",\\"price\\":399}"\n(integer) 631'),
 ('写：先更新数据库（UPDATE products SET price=349 …），再删除缓存。','DEL shop:product:1001:v1','(integer) 1'),
 ('统计命中率。','INFO stats','…\nkeyspace_hits:1\nkeyspace_misses:1\n…'),
 ('配置缓存实例。','CONFIG SET maxmemory 1gb\nCONFIG SET maxmemory-policy allkeys-lfu','OK\nOK')],
 ('为一个商品详情接口加缓存','接口 <code>GET /products/:id</code> 每秒 2 万次，组装结果需要查 4 张表（约 25 ms）；商品信息每天改动几次，价格改动后 5 秒内必须生效；库存实时变化，单独有接口。写出：缓存哪些内容、键名与值格式、TTL、读路径和写路径的伪代码，以及 Redis 不可用时的行为。',
 '<ul><li>缓存组装好的商品详情（不含库存）：<code>shop:product:{id}:v1</code>，值为 JSON（压缩可选），TTL 3600 s ± 10% 随机抖动。</li><li>读路径：<pre>v = redis.get(key)            // 设置 50 ms 超时\nif v: return decode(v)\nv = db.load_product(id)       // 4 张表\nredis.set(key, encode(v), ex=3600 + rand(-360, 360))\nreturn v</pre></li><li>写路径（价格等变更）：在事务提交<b>之后</b> <code>redis.del(key)</code>；删除失败则放入重试队列，或者依赖订阅 binlog 的异步删除（第 17 课），保证 5 秒内生效。</li><li>库存不进这个缓存，避免高频变更让详情缓存频繁失效。</li><li>Redis 超时或不可用：捕获异常直接读数据库，同时用限流/熔断保护数据库（2 万 QPS × 25 ms 数据库扛不住，需要降级为只返回核心字段或本地缓存的旧值）。</li></ul>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
