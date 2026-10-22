TITLE='热 key 与大 key';DESC='Redis 的性能问题很多来自“个别键”：一个被集中访问的热 key 会让单个分片的 CPU 或网卡打满，一个几百 MB 的大 key 会在读取、删除、迁移时阻塞主线程。本课讲如何发现它们、它们分别造成什么问题，以及拆分、本地缓存、读副本、异步删除等处理方法。';NEXT='分布式锁';MIN=60
SUM=['<b>热 key</b>：少数键承受了大部分访问（爆款商品、热门直播间、全局配置）。在 Cluster 中一个键只能在一个分片上，加机器也无法分担它的流量；单个分片可能 CPU 100%、网卡打满，进而影响同分片的其他键。',
'发现热 key：<code>redis-cli --hotkeys</code>（要求 LFU 淘汰策略，扫描全库）、<code>MONITOR</code> 抽样（开销大，只能短时间用）、客户端或代理层统计、云厂商的热 key 分析。',
'处理热 key：① 进程内本地缓存（短 TTL，如 1–5 秒）挡住绝大部分读；② 复制成 N 份 <code>k:0..k:N-1</code>，读时随机选一个，写时全部更新；③ 读写分离，从副本读；④ 热点写（如计数）在本地聚合后批量 INCRBY。',
'<b>大 key</b>：单个字符串几 MB 以上，或集合类型有几十万、上百万个元素。问题：<code>HGETALL</code>、<code>SMEMBERS</code>、<code>LRANGE 0 -1</code> 一次返回大量数据，阻塞主线程并占满带宽；<code>DEL</code> 释放内存可能耗时数百毫秒；Cluster 迁移槽时 MIGRATE 阻塞；内存分布不均。',
'发现大 key：<code>redis-cli --bigkeys</code> 或 <code>--memkeys</code>（SCAN 遍历，可在副本上执行），<code>MEMORY USAGE key</code>，离线分析 RDB 文件。',
'处理大 key：按字段或 ID 哈希<b>拆分</b>为多个键；用 <code>HSCAN</code>/<code>SSCAN</code>/<code>ZRANGE … LIMIT</code> 分批读取；删除用 <code>UNLINK</code>（后台线程释放），并开启 <code>lazyfree-lazy-user-del</code>、<code>lazyfree-lazy-expire</code> 等；大值压缩或不放在 Redis 中（放对象存储，Redis 只存引用）。']
def secs(prac,E):
    return [
('热 key 打满一个分片','加分片也没有用。','<div id="p1"></div>'),
('动手：处理热 key','一个热 key 每秒 30 万次读，单个分片约能处理 10 万次。选择方案，看各分片的负载。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:90px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('大 key 的代价','读、删、迁移都会阻塞。','<div id="p2"></div>'),
('相关命令','发现与处理。','<div id="t4"></div>'),
('在你的电脑上练习','构造一个大 key 并观察。',prac([
 ('写入一个有 100 万个字段的哈希（用 Lua 生成，约几秒）。','EVAL "for i=1,1000000 do redis.call(\'HSET\',KEYS[1],\'f\'..i,i) end return 1" 1 big:h','(integer) 1'),
 ('查看内存。','MEMORY USAGE big:h','(integer) 72388728'),
 ('用 --bigkeys 扫描（在另一个终端）。','docker exec redis redis-cli --bigkeys','…\nBiggest   hash found "big:h" has 1000000 fields\n…'),
 ('HGETALL 会一次返回 200 万行，改用 HSCAN 分批。','HSCAN big:h 0 COUNT 100','1) "1024"\n2) 1) "f531"\n   2) "531"\n   …'),
 ('看慢日志，再用 UNLINK 删除。','SLOWLOG GET 2\nUNLINK big:h','1) 1) (integer) 12\n   2) (integer) 1761104300\n   3) (integer) 1873211\n   4) 1) "EVAL"\n…\n(integer) 1'),
 ('查看热 key（需要 LFU 策略）。','CONFIG SET maxmemory-policy allkeys-lfu\n# 在宿主机另一个终端执行：\ndocker exec redis redis-cli --hotkeys','OK\n…\nhot key found with counter: 12\tkeyname: shop:product:1001:v1')],
 ('处理一个直播间的热 key 和大 key','某直播间同时 200 万人在线：① 直播间信息 <code>live:9527</code>（字符串，2 KB）每秒 50 万次读；② 在线观众集合 <code>live:9527:viewers</code>（SET，200 万成员）用来显示在线人数和随机展示 50 个头像；③ 直播结束后需要清理这些数据。现在 Cluster 有 8 个分片。给出改造方案。',
 '<ol><li><b>直播间信息</b>：应用实例本地缓存 1–2 秒（变化时通过 Pub/Sub 广播失效），绝大多数读不到 Redis；回源时读 <code>live:9527:{n}</code> 中随机一份（n=0..7，分布在不同分片，写入时更新全部 8 份）。</li><li><b>在线观众</b>：在线人数不需要整个集合：不能用 HyperLogLog 统计“当前在线”（HLL 不能移除离线用户）；可用带心跳超时的有序集合，或用经过连接去重、断线补偿的 <code>INCR/DECR</code> 计数器（按分片拆成 <code>live:9527:cnt:0..15</code> 后求和）；观众集合按 <code>uid % 64</code> 拆为 64 个 SET，每个约 3 万成员；随机头像从随机一个分片 <code>SRANDMEMBER k 50</code>。</li><li><b>清理</b>：对每个分片键执行 <code>UNLINK</code>，并开启 <code>lazyfree-lazy-user-del yes</code>、<code>lazyfree-lazy-expire yes</code>；也可以直接给这些键设 TTL，结束后自然过期。</li><li>上线前用 <code>--bigkeys</code>/<code>--memkeys</code> 和压测验证，监控各分片 CPU 是否均衡。</li></ol>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
