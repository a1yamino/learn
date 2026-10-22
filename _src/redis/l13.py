TITLE='主从复制';DESC='副本让 Redis 可以分担读流量、在主库故障时接管，也是 Sentinel 和 Cluster 的基础。本课讲 REPLICAOF 之后发生了什么：全量同步如何用 RDB 加缓冲区建立一致的副本、复制积压缓冲区如何让断线重连只做部分同步，以及异步复制带来的数据丢失和读到旧数据的问题。';NEXT='Sentinel：自动故障切换';MIN=60
SUM=['副本执行 <code>REPLICAOF host port</code> 后发送 <code>PSYNC replid offset</code>。主库每个数据集历史有一个 <b>replication ID</b>，写入命令流按字节累计 <b>offset</b>。',
'<b>全量同步</b>：主库 BGSAVE 生成 RDB（或 <code>repl-diskless-sync yes</code> 直接通过套接字发送，Redis 7 起默认开启），同时把这期间的写命令缓存在该副本的输出缓冲区；副本清空自己的数据、加载 RDB，再执行缓冲的命令，之后持续接收命令流。',
'<b>部分同步</b>：主库维护一个环形的<b>复制积压缓冲区</b>（<code>repl-backlog-size</code>，默认 1 MB）。副本短暂断线后带着 replid 和 offset 重连，如果缺的那段还在缓冲区里，只补发这一段。缓冲区太小会导致每次网络抖动都触发全量同步：按“写入速率 × 可容忍断线时间”设置，常见 64–512 MB。',
'复制是<b>异步</b>的：主库回复客户端后才把命令发给副本。主库崩溃时，尚未传到副本的写入会在故障切换后丢失。<code>WAIT numreplicas timeout</code> 可以等待指定数量的副本确认，降低但不能消除这种风险；<code>min-replicas-to-write</code> 让主库在健康副本不足时拒绝写入。',
'从副本读要接受<b>复制延迟</b>：刚写完马上从副本读可能读到旧值。需要“读自己的写”的请求读主库。副本默认 <code>replica-read-only yes</code>。',
'危险组合：主库关闭持久化并配置了自动重启，重启后数据为空，副本会同步这个空数据集。还要注意全量同步时主库的 fork 和副本加载期间的不可用（<code>replica-serve-stale-data</code>）。']
def secs(prac,E):
    return [
('全量同步','副本第一次连接或差距太大时。','<div id="p1"></div>'),
('部分同步与积压缓冲区','短暂断线后只补缺的那一段。','<div id="p2"></div>'),
('动手：断线多久会触发全量同步','主库每秒写入 2 MB 命令流。选择积压缓冲区大小和断线时长。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:70px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('相关命令','观察复制状态。','<div id="t4"></div>'),
('在你的电脑上练习','用 Docker 网络启动一主一从。',prac([
 ('创建网络并启动主库和副本。','docker network create rnet\ndocker run -d --name m --network rnet redis:8.10\ndocker run -d --name r1 --network rnet redis:8.10 redis-server --replicaof m 6379','…（两个容器 ID）'),
 ('在主库写，在副本读。','docker exec m redis-cli SET k v1\ndocker exec r1 redis-cli GET k','OK\n"v1"'),
 ('副本只读。','docker exec r1 redis-cli SET k v2','(error) READONLY You can\'t write against a read only replica.'),
 ('查看复制信息。','docker exec m redis-cli INFO replication','role:master\nconnected_slaves:1\nslave0:ip=172.18.0.3,port=6379,state=online,offset=420,lag=0\nmaster_replid:8f2c…\nmaster_repl_offset:420\nrepl_backlog_size:1048576\n…'),
 ('在同一个 redis-cli 连接中写入并等待副本确认；检查 WAIT 返回的副本数量，未达到要求不等于写入回滚。','docker exec -it m redis-cli\nSET k v3\nWAIT 1 100','OK\n(integer) 1'),
 ('断开副本几秒再恢复，看日志中的部分同步。','docker network disconnect rnet r1; sleep 5; docker network connect rnet r1; sleep 3\ndocker logs m 2>&1 | tail -n 3','… Replica 172.18.0.3:6379 asks for synchronization\n… Partial resynchronization request from 172.18.0.3:6379 accepted. Sending 0 bytes of backlog starting from offset 435.')],
 ('配置一个读写分离的主从','一主两从，主库写入峰值 5 MB/s，网络偶尔中断最长 60 秒；业务要求：用户下单后立刻在订单列表看到新订单；商品浏览可以接受 1 秒内的旧数据；希望主库在两个副本都失联时停止接受写入以免故障切换后大量丢数据。给出关键配置和应用侧读路由规则。',
 '<ul><li><code>repl-backlog-size 512mb</code>：5 MB/s × 60 s = 300 MB，再留余量，保证 60 秒内断线可部分同步。</li><li><code>min-replicas-to-write 1</code>，<code>min-replicas-max-lag 10</code>：至少一个副本在 10 秒内确认过，否则主库拒绝写入（返回 NOREPLICAS）。</li><li>主库开启持久化（AOF everysec），不要在无持久化的情况下自动重启。</li><li>副本 <code>replica-read-only yes</code>；<code>client-output-buffer-limit replica 1gb 512mb 60</code> 防止全量同步期间缓冲区超限导致同步反复失败。</li><li>读路由：下单后的订单列表读主库（或在下单后一段时间内对该用户读主库）；商品浏览读副本，客户端监测 <code>master_last_io_seconds_ago</code>/偏移差，延迟超过 1 秒的副本暂时摘除。</li><li>关键写入后可用 <code>WAIT 1 50</code> 提高持久性，但这只是降低丢失概率。</li></ul>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
