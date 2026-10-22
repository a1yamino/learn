TITLE='Redis 是什么：内存数据库、单线程与许可证';DESC='Redis 是一个把数据放在内存里、通过网络提供命令的键值数据库，最常见的用途是缓存，也常用作计数器、排行榜、队列和分布式锁。本课讲它为什么快、一条命令从客户端到返回经历了什么、和关系型数据库的分工，并说明 2024 年以来 Redis 与 Valkey 的许可证变化，最后在 Docker 里启动本课程使用的环境。';NEXT='基础数据类型与常用命令';MIN=40
SUM=['Redis 把所有数据放在<b>内存</b>中，读写一个键通常在微秒级完成；持久化（第 9 课）只是把内存数据保存到磁盘，用于重启后恢复。',
'执行命令的主线程是<b>单线程</b>的：命令一条接一条地执行，单条命令天然是原子的，不需要锁。代价是一条慢命令（如对百万元素的集合做 <code>SMEMBERS</code>、<code>KEYS *</code>）会阻塞其他所有客户端。',
'客户端与服务器使用 <b>RESP</b> 文本协议通过 TCP（默认端口 6379）通信。延迟大部分花在网络往返上，所以批量操作要用 Pipeline（第 3 课）。',
'Redis 不是关系型数据库的替代品：没有 SQL、没有复杂查询，内存成本高，默认持久化可能丢失最近的写入。典型分工是数据库存权威数据，Redis 存热点数据和需要极低延迟的结构。',
'<b>许可证</b>：Redis 7.2 及以前为 BSD-3-Clause；7.4 改为 RSALv2 / SSPLv1 双许可（不是 OSI 开源许可）；<b>Redis 8 起</b>增加 AGPLv3 选项，成为三选一（RSALv2 / SSPLv1 / AGPLv3），并把 JSON、搜索、时间序列、概率结构等模块并入 Redis Open Source。',
'<b>Valkey</b> 是 2024 年 3 月从 Redis 7.2.4 分叉、由 Linux 基金会托管的项目，保持 BSD-3-Clause，命令和协议与 Redis 兼容，许多云厂商的托管服务已转向它。本课程以 Redis 8（Docker 镜像 <code>redis:8.10</code>）为准，绝大多数内容同样适用于 Valkey；只在两者不同之处单独说明。']
def secs(prac,E):
    return [
('一条命令的旅程','从客户端到内存再返回。','<div id="p1"></div>'),
('为什么单线程还能这么快','内存访问、I/O 多路复用与没有锁。','<div id="p2"></div>'),
('动手：这条命令会阻塞别人吗','服务器上有一个包含 100 万个成员的集合 <code>users:all</code>。选择一条命令，看它的执行时间以及对同时到达的其他请求的影响。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:70px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('相关命令','连接、查看服务器信息。','<div id="t4"></div>'),
('在你的电脑上练习','需要 Docker。本课程所有练习都使用这个容器。',prac([
 ('启动 Redis 8。','docker run -d --name redis -p 6379:6379 redis:8.10','Unable to find image \'redis:8.10\' locally\n8.10: Pulling from library/redis\n…\n3f1c0a9e…'),
 ('用容器里的 redis-cli 连接并测试。','docker exec -it redis redis-cli\nPING','PONG'),
 ('读写一个键。','SET greeting "hello"\nGET greeting\nDEL greeting\nGET greeting','OK\n"hello"\n(integer) 1\n(nil)'),
 ('服务器版本和运行模式。','INFO server','# Server\nredis_version:8.10.2\n…\nredis_mode:standalone\nos:Linux 6.8.0 x86_64\narch_bits:64\nmultiplexing_api:epoll\n…\ntcp_port:6379'),
 ('内存占用。','INFO memory','# Memory\nused_memory:1052336\nused_memory_human:1.00M\n…\nmaxmemory:0\nmaxmemory_human:0B\nmaxmemory_policy:noeviction'),
 ('测一下往返延迟（在容器里另开一个终端）。','docker exec -it redis redis-cli --latency','min: 0, max: 1, avg: 0.07 (1520 samples)'),
 ('官方压测工具：10 万次 SET/GET。','docker exec redis redis-benchmark -q -t set,get -n 100000','SET: 142045.45 requests per second, p50=0.183 msec\nGET: 147275.40 requests per second, p50=0.175 msec')],
 ('用 Valkey 跑同样的命令','另起一个 Valkey 容器（端口 6380），对它执行本课的读写命令和 <code>INFO server</code>，比较两者的输出差异。说明在应用代码中切换两者需要改什么，以及选择时应该考虑的许可证问题。',
 '<pre class="cmd">docker run -d --name valkey -p 6380:6379 valkey/valkey:9.1\ndocker exec -it valkey valkey-cli\nSET greeting "hello"\nGET greeting\nINFO server</pre><pre class="out">OK\n"hello"\n# Server\nredis_version:7.2.4\nserver_name:valkey\nvalkey_version:9.1.2\n…</pre><p>命令、返回值和 RESP 协议相同，所以应用代码通常只需要改连接地址；Valkey 为了兼容，在 <code>redis_version</code> 字段中报告 7.2.4，真实版本在 <code>valkey_version</code>。客户端库（redis-py、Jedis、Lettuce、go-redis 等）都可以直接连接 Valkey，Valkey 也提供了自己的客户端 Valkey GLIDE。</p><p>差异主要在 Redis 7.4 / 8 之后新增的功能：Redis 8 内置的 JSON、搜索、时间序列、向量集合等在 Valkey 中需要另外的模块或不存在；Valkey 也有自己独有的改进。许可证方面：只是把 Redis 当作服务内部使用，三种许可通常都没有影响；如果你修改了 Redis 源码并作为网络服务提供给他人，选择 AGPLv3 就需要公开修改后的源码；把 Redis 作为托管服务出售则受 RSALv2/SSPLv1 的限制。对这些有顾虑的团队会选择 BSD 许可的 Valkey。具体以法务意见为准。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
