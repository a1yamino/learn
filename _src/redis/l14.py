TITLE='Sentinel：自动故障切换';DESC='复制本身不会在主库宕机时自动切换。Sentinel 是一组监控进程，负责发现主库故障、投票选出领导者、挑选并提升新的主库，再通知客户端。本课讲主观下线与客观下线、quorum 与多数派的区别、新主库如何挑选，以及脑裂时为什么会丢数据。';NEXT='Cluster：槽、重定向与扩缩容';MIN=60
SUM=['Sentinel 进程（至少 3 个，部署在不同的机器/可用区）每秒向主库、副本和其他 Sentinel 发送 PING，通过主库的 <code>__sentinel__:hello</code> 频道互相发现，从主库的 INFO 发现副本。',
'<b>主观下线（SDOWN）</b>：某个 Sentinel 在 <code>down-after-milliseconds</code> 内收不到有效回复。<b>客观下线（ODOWN）</b>：至少 <b>quorum</b> 个 Sentinel 都认为主库主观下线。',
'进入 ODOWN 后，Sentinel 之间进行一次 Raft 式的领导者选举：获得<b>多数</b>（例如 3 个中的 2 个）Sentinel 投票的才能执行故障切换。所以 quorum 只决定“判定故障”，真正切换还需要多数派存活。',
'领导者挑选新主库：排除断线太久的副本，然后按 <code>replica-priority</code>（越小越优先，0 表示永不提升）、复制偏移量（数据最新）、run ID 依次选择；对它执行 <code>REPLICAOF NO ONE</code>，让其他副本改为复制新主库，并把旧主库记录为新主库的副本（恢复后自动降级）。',
'客户端不应写死主库地址，而是询问 Sentinel：<code>SENTINEL get-master-addr-by-name mymaster</code>，并订阅 <code>+switch-master</code> 事件或在连接出错时重新查询。主流客户端库都内置支持。',
'<b>脑裂</b>：旧主库与 Sentinel 隔离但仍能接受部分客户端的写入，切换后它被降级为副本，期间的写入全部丢失。用 <code>min-replicas-to-write 1</code> 和 <code>min-replicas-max-lag 10</code> 让被隔离的旧主库在失去副本后停止写入，把丢失窗口限制在约 10 秒。']
def secs(prac,E):
    return [
('一次故障切换','从发现故障到客户端切到新主库。','<div id="p1"></div>'),
('动手：几个 Sentinel 挂了还能切换','部署 5 个 Sentinel，quorum = 2。选择存活的 Sentinel 数量。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:70px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('脑裂','旧主库被隔离但还在接受写入。','<div id="p2"></div>'),
('相关命令','查询与管理 Sentinel。','<div id="t4"></div>'),
('在你的电脑上练习','在上一课的 rnet 网络中（主库 m、副本 r1）再加一个副本和三个 Sentinel。',prac([
 ('再启动一个副本，写 Sentinel 配置。','docker run -d --name r2 --network rnet redis:8.10 redis-server --replicaof m 6379\nprintf "sentinel resolve-hostnames yes\\nsentinel monitor mymaster m 6379 2\\nsentinel down-after-milliseconds mymaster 5000\\nsentinel failover-timeout mymaster 30000\\n" > s.conf','…'),
 ('启动三个 Sentinel（配置文件要可写，每个复制一份）。','for i in 1 2 3; do cp s.conf s$i.conf; docker run -d --name s$i --network rnet -v $PWD/s$i.conf:/s.conf redis:8.10 redis-sentinel /s.conf; done','…'),
 ('询问主库地址。','docker exec s1 redis-cli -p 26379 SENTINEL get-master-addr-by-name mymaster','1) "172.18.0.2"\n2) "6379"'),
 ('停掉主库，观察日志。','docker stop m; sleep 15\ndocker logs s1 2>&1 | grep -E "sdown|odown|switch"','+sdown master mymaster 172.18.0.2 6379\n+odown master mymaster 172.18.0.2 6379 #quorum 3/2\n+switch-master mymaster 172.18.0.2 6379 172.18.0.4 6379'),
 ('新主库地址变了。','docker exec s1 redis-cli -p 26379 SENTINEL get-master-addr-by-name mymaster','1) "172.18.0.4"\n2) "6379"'),
 ('旧主库恢复后变成副本。','docker start m; sleep 5; docker exec m redis-cli ROLE','1) "slave"\n2) "172.18.0.4"\n3) (integer) 6379\n4) "connected"\n…')],
 ('设计一个跨可用区的 Sentinel 部署','有两个可用区 A、B 和一台可以放在第三个可用区 C 的小机器。一主两从。要求：任意一个可用区整体故障后仍能自动切换；网络把 A 与其他区隔开时尽量少丢数据。给出各节点和 Sentinel 放在哪里、quorum、关键配置，并说明“只有 A、B 两个区”时为什么做不到。',
 '<ul><li>主库在 A，副本在 A 和 B 各一个（或 B 一个、C 不放数据节点）；Sentinel 三个：A、B、C 各一个，<code>quorum 2</code>。</li><li>任一区故障：剩下两个 Sentinel 构成 3 个中的多数，能判定 ODOWN（2 ≥ quorum）并选出领导者执行切换。</li><li>A 被隔离：B、C 的 Sentinel 把 B 的副本提升为主库；A 中的旧主库设置 <code>min-replicas-to-write 1</code>、<code>min-replicas-max-lag 10</code>，A 内的副本仍连着它，所以这条规则不会阻止它写入——要让副本只放在 B（以及 C）中，或者设为 <code>min-replicas-to-write 2</code> 以要求跨区副本也确认（代价是任一副本故障主库就停止写）。权衡后常见做法是一主在 A、一从在 B、一从在 C。</li><li>只有两个区时，Sentinel 总有一个区占多数（如 A 放 2 个、B 放 1 个）：A 整体故障后只剩 1 个，达不到多数，无法切换；平均放置则偶数个时任何一边断开都没有多数。必须有第三个位置做仲裁。</li><li>客户端都通过 Sentinel 获取主库地址；<code>replica-priority</code> 控制优先提升的副本。</li></ul>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
