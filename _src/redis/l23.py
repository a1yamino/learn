TITLE='可观测性与调优：延迟、内存与慢日志';DESC='Redis 出问题时通常表现为“变慢了”或“内存满了”。本课建立一套排查方法：需要监控哪些指标、如何用 SLOWLOG、LATENCY 和 --latency 定位延迟来源，如何从 INFO memory 和 MEMORY DOCTOR 分析内存，以及常见的操作系统层面配置（透明大页、overcommit、swap）。';NEXT='综合项目：一个高并发商品服务的缓存层';MIN=60
SUM=['核心指标：<code>instantaneous_ops_per_sec</code>、命中率（keyspace_hits/misses）、<code>connected_clients</code> 与 <code>rejected_connections</code>、<code>used_memory</code> 与 maxmemory 的比例、<code>evicted_keys</code>、<code>mem_fragmentation_ratio</code>、复制延迟、<code>latest_fork_usec</code>、主线程 CPU。用 redis_exporter + Prometheus 采集并设告警。',
'<b>延迟排查顺序</b>：先确认是网络还是服务端（<code>redis-cli --latency</code> 在本机和应用服务器上分别测；<code>--intrinsic-latency</code> 测宿主机本身的调度延迟）；再看服务端：<code>SLOWLOG GET</code> 找执行慢的命令，<code>LATENCY LATEST</code>/<code>LATENCY DOCTOR</code> 看 fork、AOF fsync、过期、淘汰等事件。',
'SLOWLOG 只记录命令<b>执行</b>时间（不含排队和网络），超过 <code>slowlog-log-slower-than</code>（默认 10000 微秒，建议 1000）记录。单线程意味着一条慢命令会让所有排队的请求都变慢，所以客户端看到的延迟常常比 SLOWLOG 高得多。',
'常见原因：O(N) 命令（KEYS、HGETALL 大 key、SMEMBERS、SORT、大范围 ZRANGE）；大 key 的 DEL；大量键同时过期；fork（内存越大越慢，虚拟机上更慢）；AOF fsync 被磁盘阻塞；swap；CPU 被其他进程抢占；客户端连接数暴涨或输出缓冲区过大。',
'<b>内存分析</b>：<code>INFO memory</code> 看 used_memory、dataset/overhead、碎片率；<code>MEMORY DOCTOR</code> 给出建议；<code>--bigkeys</code>/<code>--memkeys</code> 找大户；<code>CLIENT LIST</code> 中 <code>omem</code> 看输出缓冲区占用。碎片率高时开启 <code>activedefrag yes</code>。',
'操作系统：关闭透明大页（<code>echo never &gt; /sys/kernel/mm/transparent_hugepage/enabled</code>，否则 fork 后写时复制以 2 MB 为单位，延迟和内存都会飙升）；<code>vm.overcommit_memory = 1</code>（避免 fork 失败）；避免 swap（<code>vm.swappiness</code> 调低并留足内存）；<code>net.core.somaxconn</code> 不小于 <code>tcp-backlog</code>。']
def secs(prac,E):
    return [
('延迟从哪里来','一条请求经过的各个环节。','<div id="p1"></div>'),
('动手：根据现象判断原因','选择一个现象，看应该查什么、可能的原因。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:110px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('相关命令','诊断工具一览。','<div id="t4"></div>'),
('在你的电脑上练习','在 redis-cli 中。',prac([
 ('把慢日志阈值调到 1 毫秒并制造一条慢命令。','CONFIG SET slowlog-log-slower-than 1000\nDEBUG SLEEP 0.05\nSLOWLOG GET 1','OK\nOK\n1) 1) (integer) 0\n   2) (integer) 1761118800\n   3) (integer) 50123\n   4) 1) "DEBUG"\n      2) "SLEEP"\n      3) "0.05"\n   5) "172.17.0.1:53122"\n   6) ""'),
 ('开启延迟监控并查看事件。','CONFIG SET latency-monitor-threshold 10\nDEBUG SLEEP 0.05\nLATENCY LATEST','OK\nOK\n1) 1) "command"\n   2) (integer) 1761118810\n   3) (integer) 50\n   4) (integer) 50'),
 ('让 Redis 分析延迟。','LATENCY DOCTOR','Dave, I have observed latency spikes in this Redis instance…\n1. command: 1 latency spikes (average 50ms, mean deviation 0ms…)\n…'),
 ('测量往返延迟（在宿主机终端）。','docker exec redis redis-cli --latency -i 1','min: 0, max: 1, avg: 0.11 (98 samples)'),
 ('内存概况与建议。','INFO memory\nMEMORY DOCTOR','used_memory_human:1.05M\nused_memory_rss_human:9.80M\nmem_fragmentation_ratio:9.32\n…\nHi Sam, this instance is empty or is using very little memory, my issues detector can\'t be used in these conditions…'),
 ('查看客户端的缓冲区占用。','CLIENT LIST','id=5 addr=172.17.0.1:53122 … qbuf=26 … omem=0 tot-mem=22426 … cmd=client|list')],
 ('排查一次延迟抖动','线上 Redis（24 GB 数据，开启 AOF everysec 和每小时 RDB，运行在云虚拟机上）每隔约一小时出现 P99 从 1 ms 升到 300 ms、持续几秒的抖动，其余时间正常。SLOWLOG 里没有超过 10 ms 的命令。写出你的排查步骤、最可能的原因和修复方法。',
 '<ol><li>SLOWLOG 没有慢命令，说明不是某条命令执行慢，而是主线程被别的事情阻塞或请求在排队。周期约一小时，与 RDB 的 <code>save 3600 …</code> 吻合。</li><li>验证：<code>INFO stats</code> 中 <code>latest_fork_usec</code>（24 GB 在虚拟机上 fork 可能数百毫秒）；<code>LATENCY LATEST</code> 中的 <code>fork</code>、<code>aof-fsync-always</code>/<code>aof-write-pending-fsync</code> 事件；同时检查透明大页是否开启、<code>rdb_last_cow_size</code> 是否很大、是否发生 swap（<code>/proc/&lt;pid&gt;/smaps</code> 中的 Swap）。RDB 写盘时磁盘繁忙也会让 AOF 的 fsync 变慢，主线程在 write 时被阻塞（<code>aof_delayed_fsync</code> 增长）。</li><li>修复：关闭透明大页；在主库上关闭 RDB（AOF 已足够，或只在副本上生成 RDB 备份）；设置 <code>no-appendfsync-on-rewrite yes</code> 减少重写期间的 fsync 阻塞（接受此期间稍大的丢失窗口）；使用更好的磁盘；将实例拆小（多个分片，每个几 GB），降低单次 fork 的代价。</li><li>修复后对比 <code>latest_fork_usec</code> 和 P99 监控确认。</li></ol>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
