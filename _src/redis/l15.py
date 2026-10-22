TITLE='Cluster：槽、重定向与扩缩容';DESC='单个 Redis 的内存和写入能力有上限。Redis Cluster 把键空间切成 16384 个槽分布到多个主节点上，每个主节点有自己的副本。本课讲键如何映射到槽、客户端如何处理 MOVED 和 ASK、哈希标签与多键操作的限制、节点间如何用 gossip 发现故障并自动切换，以及迁移槽的过程。';NEXT='缓存模式：Cache-Aside 与读写策略';MIN=65
SUM=['<code>slot = CRC16(key) mod 16384</code>。每个主节点负责一部分槽，例如三主时 0–5460、5461–10922、10923–16383。键名中有 <code>{…}</code> 时只用花括号里的内容计算，这就是<b>哈希标签</b>。',
'客户端可以连接任意节点。如果键不在该节点，返回 <code>MOVED 3999 10.0.0.2:6379</code>；智能客户端缓存“槽 → 节点”映射（用 <code>CLUSTER SHARDS</code> 获取），收到 MOVED 后更新，所以正常情况下一次往返就到对的节点。',
'<b>多键命令</b>（MGET、事务、Lua、SUNIONSTORE…）要求所有键在同一个槽，否则报 <code>CROSSSLOT</code>。用哈希标签把需要一起操作的键放在一起，例如 <code>cart:{u42}</code> 和 <code>cart:{u42}:items</code>；但不要用同一个标签装太多数据，否则形成热点槽。Cluster 只有 db 0。',
'<b>迁移槽</b>：源节点标记 MIGRATING、目标节点标记 IMPORTING，逐批 <code>MIGRATE</code> 键。迁移期间请求的键已经搬走时，源节点返回 <code>ASK</code>，客户端只对这一次请求先发 <code>ASKING</code> 再访问目标节点，不更新缓存的映射；全部完成后槽归属改变，此后返回 MOVED。<code>redis-cli --cluster reshard/rebalance</code> 自动完成这些步骤（Redis 8.2 起还有更快的原子槽迁移）。',
'节点之间通过集群总线（端口 +10000）用 gossip 交换状态。某节点被多数主节点在 <code>cluster-node-timeout</code> 内标记为 PFAIL 后升级为 FAIL，它的副本发起选举，获得多数主节点投票后接管槽。无需 Sentinel。',
'默认 <code>cluster-require-full-coverage yes</code>：任何槽没有可用节点时整个集群拒绝服务；设为 no 则其他槽继续工作。复制仍是异步的，故障切换时同样可能丢失最近的写入。']
def secs(prac,E):
    return [
('键 → 槽 → 节点','以及 MOVED 重定向。','<div id="p1"></div>'),
('动手：计算槽','输入键名，看它落在哪个槽、哪个节点，多键操作是否可行。','<div class="chal"><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px"><input id="hk" value="user:{42}:profile" style="background:var(--bg2,transparent);color:inherit;border:1px solid var(--line,#555);border-radius:8px;padding:8px 10px;font-family:monospace;font-size:14px;flex:1;min-width:200px"><input id="hk2" value="user:{42}:cart" style="background:var(--bg2,transparent);color:inherit;border:1px solid var(--line,#555);border-radius:8px;padding:8px 10px;font-family:monospace;font-size:14px;flex:1;min-width:200px"></div><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:90px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('迁移槽与 ASK','扩容时把一个槽从 A 搬到 D。','<div id="p2"></div>'),
('相关命令','观察集群。','<div id="t4"></div>'),
('在你的电脑上练习','用 host 网络启动 6 个节点（Linux；Mac/Windows 的 Docker Desktop 需另用 bitnami 等镜像或 docker compose 配置公告地址）。',prac([
 ('启动 6 个集群模式节点。','for p in 7001 7002 7003 7004 7005 7006; do docker run -d --name c$p --network host redis:8.10 redis-server --port $p --cluster-enabled yes --appendonly yes; done','…'),
 ('创建三主三从集群。','docker exec -it c7001 redis-cli --cluster create 127.0.0.1:7001 127.0.0.1:7002 127.0.0.1:7003 127.0.0.1:7004 127.0.0.1:7005 127.0.0.1:7006 --cluster-replicas 1 --cluster-yes','>>> Performing hash slots allocation on 6 nodes...\nMaster[0] -> Slots 0 - 5460\nMaster[1] -> Slots 5461 - 10922\nMaster[2] -> Slots 10923 - 16383\n…\n[OK] All 16384 slots covered.'),
 ('不带 -c 时看到 MOVED。','docker exec c7001 redis-cli -p 7001 SET foo bar','(error) MOVED 12182 127.0.0.1:7003'),
 ('-c 让 redis-cli 自动跟随重定向。','docker exec c7001 redis-cli -c -p 7001 SET foo bar\ndocker exec c7001 redis-cli -c -p 7001 CLUSTER KEYSLOT foo','OK\n(integer) 12182'),
 ('跨槽多键命令失败，哈希标签解决。','docker exec c7001 redis-cli -c -p 7001 MSET a 1 b 2\ndocker exec c7001 redis-cli -c -p 7001 MSET {u}a 1 {u}b 2','(error) CROSSSLOT Keys in request don\'t hash to the same slot\nOK'),
 ('停掉一个主节点，副本接管。','docker stop c7003; sleep 10\ndocker exec c7001 redis-cli -p 7001 CLUSTER NODES | grep master','… 127.0.0.1:7001@17001 myself,master - 0 0 1 connected 0-5460\n… 127.0.0.1:7002@17002 master - 0 … connected 5461-10922\n… 127.0.0.1:7003@17003 master,fail - …\n… 127.0.0.1:7006@17006 master - 0 … connected 10923-16383')],
 ('为购物车和排行榜设计键','电商要把 Redis 迁到 6 主 Cluster。现有键：<code>cart:&lt;uid&gt;</code>（哈希）与 <code>cart_ver:&lt;uid&gt;</code>（字符串），需要在一个 Lua 脚本里同时修改；全站排行榜 <code>rank:global</code>（ZSET，2000 万成员，每秒 3 万次 ZINCRBY）；按日期的 <code>pv:&lt;yyyymmdd&gt;:&lt;page&gt;</code> 有时需要 MGET 同一天所有页面。给出新的键名和理由，指出哪个设计有热点风险以及如何处理。',
 '<ul><li><code>cart:{&lt;uid&gt;}</code> 和 <code>cart_ver:{&lt;uid&gt;}</code>：用用户 ID 作哈希标签，脚本中的两个键同槽；不同用户分散在所有槽，没有热点。</li><li><code>pv:{&lt;yyyymmdd&gt;}:&lt;page&gt;</code> 能让 MGET 生效，但同一天的所有 PV 计数集中在一个槽 = 一个节点，当天写入全部打到这个节点，形成热点。更好的做法：不加标签，客户端按槽分组并行 MGET（多数客户端库会自动拆分），或者把同一天的数据放进一个哈希 <code>pv:&lt;day&gt;</code> 并按 <code>hash(page) % 16</code> 分成 16 个分片键。</li><li><code>rank:global</code> 是一个 2000 万成员的大 key，只能在一个节点上：可以先在应用里按 <code>uid % N</code> 拆分成 <code>rank:global:0..N-1</code>（分布在不同节点），写入分散；查询 Top 100 时每个分片取 Top 100 再在应用中合并。第 19、21 课会再讨论。</li></ul>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
