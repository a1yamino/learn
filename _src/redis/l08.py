TITLE='内存管理与淘汰策略';DESC='内存是 Redis 最贵的资源。本课讲 used_memory 由哪些部分组成、碎片率怎么看、为什么一定要设置 maxmemory，以及内存达到上限后八种淘汰策略的区别、Redis 近似 LRU 与 LFU 的实现方式和适用场景。';NEXT='持久化：RDB 与 AOF';MIN=60
SUM=['<code>used_memory</code> 是分配器（jemalloc）分配出去的字节数：数据集 + 键空间字典开销 + 客户端输入/输出缓冲区 + 复制积压缓冲区 + AOF 缓冲区等。<code>used_memory_rss</code> 是操作系统看到的常驻内存。二者之比为<b>碎片率</b>：明显大于 1.5 表示碎片多（可开启 <code>activedefrag</code>），小于 1 说明发生了 swap。',
'单个 Lua 脚本执行期间不会逐条触发淘汰，可能暂时超过上限；实验要从客户端分批写入。<b>一定要设置 <code>maxmemory</code></b>，并给 fork 时的写时复制、缓冲区和操作系统留出余量（通常为物理内存的 60%–75%）。默认 0 表示不限制，最终会被 OOM killer 杀掉或开始 swap。',
'达到 maxmemory 后，每条可能增加内存的写命令执行前都会尝试淘汰。策略 <code>maxmemory-policy</code>：<code>noeviction</code>（默认，写命令报 OOM 错误）；<code>allkeys-lru / allkeys-lfu / allkeys-random</code>（在所有键中选）；<code>volatile-lru / volatile-lfu / volatile-random / volatile-ttl</code>（只在设置了过期时间的键中选）。',
'纯缓存用 <code>allkeys-lru</code> 或 <code>allkeys-lfu</code>；Redis 同时存放缓存和不能丢的数据时用 <code>volatile-*</code>，但没有过期时间的键过多时，可淘汰的键不够，仍会 OOM。更好的做法是把两类数据放到不同的实例。',
'<b>近似 LRU</b>：每个对象只存 24 位的最近访问时钟；淘汰时随机抽样 <code>maxmemory-samples</code>（默认 5）个键，放入大小为 16 的淘汰池，删除最久未访问的。样本越大越接近真实 LRU，CPU 越高。',
'<b>LFU</b>：同一个 24 位字段改存 16 位时间 + 8 位对数计数器（最大 255，访问越多增加概率越小，<code>lfu-log-factor</code>），计数随时间衰减（<code>lfu-decay-time</code> 分钟）。LFU 能抵抗一次性批量扫描把热点数据挤出去。']
def secs(prac,E):
    return [
('达到 maxmemory 之后','一次写入触发的淘汰。','<div id="p1"></div>'),
('LRU 与 LFU','一次扫描会不会挤掉热点。','<div id="p2"></div>'),
('动手：选择淘汰策略','选择一种部署场景，看推荐的策略和原因。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:70px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('相关命令','内存分析与配置。','<div id="t4"></div>'),
('在你的电脑上练习','本实验使用独立容器和 Python 客户端（pip install redis），避免第 5 课的大数据集影响 10 MB 上限。',prac([
 ('在宿主机启动实验容器。','docker run -d --name learn-review-rmem -p 127.0.0.1:6388:6379 redis:8.10 redis-server --save ""\ndocker exec -it learn-review-rmem redis-cli','127.0.0.1:6379>'),
 ('内存概况。','INFO memory','used_memory_human:1.05M\nused_memory_rss_human:9.12M\nused_memory_peak_human:24.30M\nmem_fragmentation_ratio:8.69\nmaxmemory_human:0B\nmaxmemory_policy:noeviction\nmem_allocator:jemalloc-5.3.0'),
 ('设置 10 MB 上限，默认策略下写满会报错。','CONFIG SET maxmemory 10mb\nCONFIG SET maxmemory-policy noeviction\n# 输入 exit 退出 redis-cli，再在宿主机运行：\npython3 - <<\'PY\'\nimport redis\nr = redis.Redis(port=6388)\nfor i in range(200000):\n    try: r.set(f"k:{i}", "x" * 100)\n    except redis.exceptions.ResponseError as e:\n        print(type(e).__name__, str(e))\n        break\nPY','OutOfMemoryError command not allowed when used memory > \'maxmemory\'.'),
 ('改为 allkeys-lru，再写：旧键被淘汰。','python3 - <<\'PY\'\nimport redis\nr = redis.Redis(port=6388)\nr.config_set("maxmemory-policy", "allkeys-lru")\nfor i in range(200000): r.set(f"k:{i}", "x" * 100)\nprint("keys", r.dbsize())\nprint("evicted_keys", r.info("stats")["evicted_keys"])\nPY\n# 重新进入实验实例，继续后面的命令：\ndocker exec -it learn-review-rmem redis-cli','keys 约 50000\nevicted_keys 逐渐增长（具体值随版本和分配器不同）'),
 ('看一个键的空闲时间。','GET k:199999\nOBJECT IDLETIME k:199999','"xxxx…"\n(integer) 0'),
 ('切换到 LFU，看访问频率计数。','CONFIG SET maxmemory-policy allkeys-lfu\nGET k:199999\nGET k:199999\nOBJECT FREQ k:199999','OK\n…\n(integer) 6'),
 ('内存诊断；完成后退出并删除实验容器。','MEMORY DOCTOR\n# 以下在宿主机执行：\ndocker rm -f learn-review-rmem','Sam, I detected a few issues in this Redis instance memory implants:\n\n * High total RSS: This instance has a memory fragmentation and RSS overhead greater than 1.4 …')],
 ('一台缓存实例频繁淘汰热点','商品缓存实例 8 GB，<code>allkeys-lru</code>。每晚 2 点有一个离线任务遍历全部商品写入缓存（大部分是冷门商品）。之后几十分钟里缓存命中率从 98% 降到 70%，数据库压力剧增。解释原因，给出至少两种改进。',
 '<p>LRU 只看“最近一次访问时间”：离线任务把几百万个冷门商品依次写入，每一个都比白天的热点商品“更新”，于是热点被大量淘汰。早上热点重新回源，命中率要很久才能恢复。</p><ul><li>改用 <code>allkeys-lfu</code>：热点商品的访问计数高，批量写入的冷门商品计数很低（新键初始计数为 5，且会衰减），淘汰时优先淘汰它们。</li><li>离线任务不要写入在线缓存：它真正需要的通常只是读取数据，或者写入另一个实例。</li><li>如果必须预热，只预热访问量排名靠前的商品，并给它们较短的过期时间。</li><li>按需扩容：观察 <code>evicted_keys</code> 的增长速度和命中率（<code>keyspace_hits / (hits + misses)</code>），淘汰持续发生说明内存不足以容纳工作集。</li></ul>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
