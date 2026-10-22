TITLE='事件循环、单线程与 I/O 线程';DESC='“Redis 是单线程的”只说对了一半：执行命令的确只有一个主线程，但网络读写可以交给 I/O 线程，文件关闭、AOF 刷盘和大对象释放在后台线程完成，持久化则由 fork 出的子进程完成。本课讲 ae 事件循环怎样处理文件事件和时间事件、I/O 线程解决了什么问题，以及哪些情况会让主线程停顿。';NEXT='过期：惰性删除与定期删除';MIN=55
SUM=['<b>事件循环</b>（ae）：主线程反复执行 <code>epoll_wait</code> 等待就绪的套接字（文件事件：新连接、可读、可写），处理完后执行到期的<b>时间事件</b>，主要是 <code>serverCron</code>（默认每秒 <code>hz = 10</code> 次）：清理过期键、渐进 rehash、检查持久化、统计等。',
'每轮循环进入等待之前（beforeSleep），会把各连接输出缓冲区中的回复尽量直接写出，并执行 AOF 写入等工作。',
'<b>I/O 线程</b>（Redis 6 引入，Redis 8 重新实现）：读请求、解析协议、写回复这些与网络相关的工作可以分给多个线程并行，<b>命令执行仍然只在主线程</b>，所以语义不变。适合连接多、回复大、单核网络处理成为瓶颈的场景，通常在 4 核以上的机器开启 <code>io-threads 4</code> 左右。Valkey 8 也大幅改进了 I/O 线程。',
'<b>后台线程</b>（bio）：关闭文件、AOF 的 fsync、惰性释放（<code>UNLINK</code>、<code>FLUSHALL ASYNC</code>、<code>lazyfree-lazy-*</code>）在后台执行，避免阻塞主线程。',
'<b>fork</b>：BGSAVE、BGREWRITEAOF、全量复制时 fork 子进程，利用写时复制（COW）得到内存快照。fork 本身要复制页表，数据集越大越慢（每 GB 约 10–20 ms），期间主线程停顿；开启透明大页（THP）会让 COW 复制 2 MB 的页，导致延迟和内存暴涨，应关闭。',
'主线程停顿的常见来源：O(N) 命令、大 key 的删除或序列化、Lua 脚本执行时间过长、fork、内存交换（swap）、AOF 在 <code>appendfsync always</code> 下等待磁盘。']
def secs(prac,E):
    return [
('事件循环的一轮','等待、处理就绪连接、执行定时任务。','<div id="p1"></div>'),
('I/O 线程','把网络读写并行化，执行仍然串行。','<div id="p2"></div>'),
('动手：谁在阻塞主线程','线上 Redis 的延迟监控出现尖刺。选择一条线索，看它指向的原因和处理办法。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:70px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('相关命令','线程、延迟与 fork 的观测。','<div id="t4"></div>'),
('在你的电脑上练习','在宿主机终端和 redis-cli 中执行。',prac([
 ('查看 Redis 进程的线程。','docker exec redis sh -c \'ls /proc/1/task | wc -l; cat /proc/1/task/*/comm\'','5\nredis-server\nbio_close_file\nbio_aof\nbio_lazy_free\njemalloc_bg_thd'),
 ('事件循环的频率。','CONFIG GET hz','1) "hz"\n2) "10"'),
 ('在本地实验容器开启 I/O 线程和 DEBUG（重建会清空前面练习的数据；DEBUG 仅允许容器内回环连接）。','docker rm -f redis\ndocker run -d --name redis -p 6379:6379 redis:8.10 redis-server --io-threads 4 --enable-debug-command local\ndocker exec redis sh -c \'cat /proc/1/task/*/comm\'','redis-server\nio_thd_1\nio_thd_2\nio_thd_3\nbio_close_file\n…'),
 ('用 redis-benchmark 制造 50 个并发连接的负载，比较 io-threads 1 和 4。','docker exec redis redis-benchmark -q -t get -n 1000000 -c 50 -P 16 --threads 4','GET: 1612903.25 requests per second, p50=0.391 msec'),
 ('开启延迟监控，制造一次慢命令。','CONFIG SET latency-monitor-threshold 50\nDEBUG SLEEP 0.2\nLATENCY LATEST','OK\nOK\n1) 1) "command"\n   2) (integer) 1761103320\n   3) (integer) 200\n   4) (integer) 200'),
 ('看最近一次 fork 的耗时（微秒）。','BGSAVE\nINFO stats','Background saving started\n…\nlatest_fork_usec:3120')],
 ('解释一次 120 ms 的延迟尖刺','一台 16 GB 数据的 Redis 每小时整点 p99 延迟从 1 ms 跳到 120 ms，持续一两秒。<code>INFO stats</code> 显示 <code>latest_fork_usec:118342</code>，配置中有 <code>save 3600 1</code>。服务器开启了透明大页。分析原因并给出改进。',
 '<p>整点的尖刺对应 RDB 定时保存：BGSAVE 需要 fork，fork 复制 16 GB 数据集的页表，主线程停顿约 118 ms，这期间所有命令都在排队。透明大页让情况更糟：子进程存在期间，主线程每写一个页都触发写时复制，大页意味着每次复制 2 MB 而不是 4 KB，既增加延迟又让内存暴涨。</p><ul><li>关闭 THP：<code>echo never &gt; /sys/kernel/mm/transparent_hugepage/enabled</code>（Redis 启动时也会在日志中警告）。</li><li>减少 fork：如果有副本，主库可以关闭 RDB 定时保存，在副本上做持久化和备份；或者延长间隔、避开高峰。</li><li>缩小单实例：把 16 GB 拆成多个较小的实例或 Cluster 分片，每个实例的 fork 时间与其内存成正比。</li><li>物理机通常比某些虚拟化平台 fork 更快；用 <code>latest_fork_usec</code> 和延迟监控持续观察。</li></ul>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
