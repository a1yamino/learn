TITLE='过期：惰性删除与定期删除';DESC='缓存几乎都带过期时间，但一个键过期后并不会在那一刻被删除。本课讲过期时间存在哪里、Redis 如何组合“访问时检查”和“后台抽样清理”两种策略、为什么过期的键仍可能占着内存、哪些命令会悄悄清除过期时间，以及过期在复制和持久化中的处理方式。';NEXT='内存管理与淘汰策略';MIN=50
SUM=['设置了过期时间的键，除了在键空间中，还登记在每个数据库的<b>过期字典</b>（expires）里：键 → 毫秒级的绝对过期时间戳。<code>EXPIRE</code>/<code>PEXPIRE</code> 设置相对时间，<code>EXPIREAT</code> 设置绝对时间；Redis 7 起支持 <code>NX/XX/GT/LT</code> 条件。',
'<b>惰性删除</b>：每次访问键之前检查是否已过期，过期则删除并当作不存在。只靠它，从不被访问的过期键会永远占着内存。',
'<b>定期删除</b>：serverCron 中的主动过期循环逐步扫描各数据库的过期字典，删除已过期的键；如果某次扫描中过期键比例较高就继续，并限制总耗时（约占 CPU 的 25%，<code>active-expire-effort</code> 可调）。每轮事件循环之前还有一个耗时很短的快速循环。',
'所以过期键会在内存中“滞留”一段时间。大量键在同一时刻过期时，主动清理会占用较多 CPU，同时缓存突然集体失效还会压垮数据库——给过期时间加随机抖动（第 18 课）。',
'会<b>清除过期时间</b>的操作：<code>SET</code>（未带 <code>KEEPTTL</code>）、<code>GETSET</code>、<code>PERSIST</code>、对整个键重新赋值的命令。<code>INCR</code>、<code>HSET</code>、<code>LPUSH</code>、<code>RENAME</code>（过期时间随键转移）保留原过期时间。<code>TTL</code> 返回 -1 表示没有过期时间，-2 表示键不存在。',
'<b>副本</b>不会自己删除过期键，而是等主库删除后通过复制流收到 <code>DEL</code>；但副本上读取逻辑上已过期的键会返回空。AOF 中过期以 <code>PEXPIREAT</code> 绝对时间记录；加载 RDB 时，主库会跳过已过期的键。']
def secs(prac,E):
    return [
('两种删除方式','访问时检查与后台抽样。','<div id="p1"></div>'),
('过期键为什么还占着内存','惰性 + 定期的空档。','<div id="p2"></div>'),
('动手：这个键的 TTL 还在吗','键 <code>session:1</code> 设置了 <code>EX 600</code>。选择接下来的操作，看 TTL 的变化。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:70px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('相关命令','设置与观察过期。','<div id="t4"></div>'),
('在你的电脑上练习','在 redis-cli 中执行。',prac([
 ('设置与查看过期时间。','SET token abc EX 30\nTTL token\nPTTL token\nEXPIRETIME token','OK\n(integer) 30\n(integer) 29712\n(integer) 1761103830'),
 ('SET 会清除 TTL，KEEPTTL 保留。','SET token def\nTTL token\nEXPIRE token 30\nSET token ghi KEEPTTL\nTTL token','OK\n(integer) -1\n(integer) 1\nOK\n(integer) 27'),
 ('条件过期：只在新的过期时间更长时更新。','EXPIRE token 10 GT\nTTL token\nEXPIRE token 100 GT\nTTL token','(integer) 0\n(integer) 25\n(integer) 1\n(integer) 100'),
 ('写入 10 万个 1 秒后过期的键，观察主动清理。','EVAL "for i=1,100000 do redis.call(\'SET\',\'tmp:\'..i,i,\'EX\',1) end return 1" 0\nINFO keyspace','(integer) 1\n# Keyspace\ndb0:keys=100023,expires=100001,avg_ttl=812,subexpiry=0'),
 ('几秒后再看：已被后台清理。','INFO keyspace\nINFO stats','# Keyspace\ndb0:keys=22,expires=0,avg_ttl=0,subexpiry=0\n…\nexpired_keys:100001\nexpired_stale_perc:0.00\nexpired_time_cap_reached_count:0'),
 ('Hash 字段级过期（Redis 7.4+）。','HSET sess:1 user 42 csrf x1\nHEXPIRE sess:1 5 FIELDS 1 csrf\nHTTL sess:1 FIELDS 2 user csrf','(integer) 2\n1) (integer) 1\n1) (integer) -1\n2) (integer) 5')],
 ('排查“设了过期时间却永不过期”','一个服务把用户的会话存成 <code>SET session:{id} {json} EX 1800</code>，每次请求时更新会话中的最后访问时间：<code>SET session:{id} {新 json}</code>。运行几周后内存不断增长，<code>INFO keyspace</code> 中 <code>expires</code> 远小于 <code>keys</code>。找出原因并修复，说明如何清理存量。',
 '<p>更新时的 <code>SET</code> 没有带过期参数，会<b>清除</b>原有的过期时间：用户第一次请求后，会话就变成了永久键。<code>expires</code> 远小于 <code>keys</code> 正是这个症状。</p><pre class="cmd">SET session:{id} {新 json} EX 1800        # 滑动过期：每次续期 30 分钟\n# 或者只想保留原来的过期时间：\nSET session:{id} {新 json} KEEPTTL\n# 更好的结构：Hash，只更新一个字段，TTL 不受影响\nHSET session:{id} last_seen 1761103900\nEXPIRE session:{id} 1800</pre><p>清理存量：用 SCAN 遍历 <code>session:*</code>，对 <code>TTL</code> 为 -1 的键补设过期时间（例如 <code>EXPIRE key 1800 NX</code>，NX 表示只在没有过期时间时设置），分批执行，避免一次处理太多。之后在监控中加入 keys 与 expires 比例的告警。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
