TITLE='持久化：RDB 与 AOF';DESC='Redis 的数据在内存里，进程重启或机器断电后要靠持久化文件恢复。本课讲 RDB 快照如何借助 fork 和写时复制在不停服务的情况下生成、AOF 如何记录每一条写命令以及三种刷盘策略、Redis 7 的多文件 AOF 与重写，以及两者混合使用时的恢复过程和取舍。';NEXT='事务、Lua 脚本与 Functions';MIN=60
SUM=['<b>RDB</b>：某一时刻整个数据集的紧凑二进制快照。<code>BGSAVE</code> fork 子进程写临时文件，完成后原子地重命名为 <code>dump.rdb</code>；主进程继续服务，借助写时复制（COW），只有被修改的页才会复制。<code>save 3600 1 300 100 60 10000</code> 表示满足任一“秒数内至少多少次修改”就自动触发。',
'RDB 优点：文件小、加载快、适合备份和传输；缺点：两次快照之间的写入会在崩溃时丢失，fork 有停顿和 COW 内存开销。不要在生产中使用阻塞主线程的 <code>SAVE</code>。',
'<b>AOF</b>：以 RESP 格式追加每一条写命令。<code>appendfsync</code>：<code>always</code>（每次写都 fsync，最安全最慢）、<code>everysec</code>（默认，后台线程每秒 fsync，最多丢约 1 秒）、<code>no</code>（交给操作系统，通常 30 秒左右）。',
'AOF 会越来越大，需要<b>重写</b>（BGREWRITEAOF）：子进程根据当前内存数据生成最精简的命令集。Redis 7 起采用<b>多文件 AOF</b>：<code>appendonlydir/</code> 下有一个 base 文件（默认是 RDB 格式，即 <code>aof-use-rdb-preamble</code>）、若干 incr 增量文件和一个清单文件；重写期间新写入进入新的 incr 文件，不再需要在内存中缓存重写缓冲区。',
'启动时如果开启了 AOF，就用 AOF 恢复（更完整）；否则加载 RDB。AOF 末尾被截断（断电时写了一半）时，默认 <code>aof-load-truncated yes</code> 会丢弃最后不完整的命令并启动；中间损坏则需要 <code>redis-check-aof --fix</code>。',
'选择：纯缓存可以关闭持久化（重启后从数据库重建），或只保留 RDB 用于快速预热；不能丢的数据用 AOF everysec + RDB 备份；有副本时可以只在副本上做持久化以减轻主库负担，但要防止主库无数据重启后把空数据同步给副本（第 13 课）。']
def secs(prac,E):
    return [
('RDB：fork 与写时复制','不停服务地拍一张快照。','<div id="p1"></div>'),
('AOF：追加、刷盘与重写','每一条写命令都记下来。','<div id="p2"></div>'),
('动手：断电后会丢多少','在不同配置下，最后一次写入 2 秒后机器断电。选择配置，看重启后的数据。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:70px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('相关命令','触发与观察持久化。','<div id="t4"></div>'),
('在你的电脑上练习','以下命令全部在宿主机终端执行；用 docker exec 调用 redis-cli，不在交互式 redis-cli 中执行 shell 命令。',prac([
 ('启动开启 AOF 的实例。','docker run -d --name rp -v rpdata:/data redis:8.10 redis-server --appendonly yes --save "60 1000"','（容器 ID）'),
 ('写入一些数据，看 AOF 目录。','docker exec rp redis-cli SET a 1\ndocker exec rp redis-cli INCR a\ndocker exec rp redis-cli RPUSH l x y z\ndocker exec rp ls -l /data /data/appendonlydir','total 4\ndrwxr-xr-x 2 redis redis 4096 appendonlydir\n-rw-r--r-- 1 redis redis   88 appendonly.aof.1.base.rdb\n-rw-r--r-- 1 redis redis  142 appendonly.aof.1.incr.aof\n-rw-r--r-- 1 redis redis   88 appendonly.aof.manifest'),
 ('增量文件就是 RESP 格式的写命令。','docker exec rp cat /data/appendonlydir/appendonly.aof.1.incr.aof','*2\r\n$6\r\nSELECT\r\n$1\r\n0\r\n*3\r\n$3\r\nSET\r\n$1\r\na\r\n$1\r\n1\r\n*2\r\n$4\r\nINCR\r\n…'),
 ('重写 AOF：base 更新，旧的 incr 被清理。','docker exec rp redis-cli BGREWRITEAOF\ndocker exec rp redis-cli INFO persistence','Background append only file rewriting started\n…\naof_enabled:1\naof_rewrite_in_progress:0\naof_last_bgrewrite_status:ok\n…'),
 ('手动生成 RDB 快照。','docker exec rp redis-cli BGSAVE\ndocker exec rp redis-cli LASTSAVE\n# 等待 INFO persistence 中 rdb_bgsave_in_progress 变为 0，再查看：\ndocker exec rp ls -l /data/dump.rdb','Background saving started\n(integer) 1761104210\n-rw-r--r-- 1 redis redis 120 /data/dump.rdb'),
 ('模拟崩溃：kill -9 后重启，数据仍在。','docker exec rp sh -c \'kill -9 1\'; docker start rp\ndocker exec rp redis-cli GET a','"2"')],
 ('为三种用途设计持久化','分别为下面三个 Redis 实例给出持久化配置并说明理由：① 商品详情缓存，数据都能从 MySQL 重建，16 GB；② 用户会话和购物车，丢失会让用户重新登录、购物车清空，4 GB；③ 秒杀库存计数，扣减不能丢失也不能重复，1 GB，有一个副本。',
 '<ol><li><b>商品缓存</b>：<code>appendonly no</code>，<code>save ""</code> 关闭 RDB。重启后冷启动由回源逐步填充；如果担心冷启动压垮数据库，可以保留低频 RDB（如 <code>save 3600 1</code>）只用于快速预热，并在副本上生成以避免主库 fork。</li><li><b>会话与购物车</b>：<code>appendonly yes</code> + <code>appendfsync everysec</code>，最多丢约 1 秒；保留 RDB 并定期拷贝到异地作为备份。4 GB 的 fork 开销可以接受。</li><li><b>库存计数</b>：<code>appendfsync always</code> 能让成功回复前的写入刷到本机磁盘；这不保证跨故障切换或磁盘损坏时不丢失，代价是每次写都等磁盘（SSD 上约 0.1–1 ms），1 GB 的小实例可以承受；同时要认识到异步复制在故障切换时仍可能丢失最近的写入，必要时在同一写连接上用 <code>WAIT 1 100</code> 等待副本确认（确认数量不足需处理，WAIT 仍不是强一致承诺）。更稳妥的设计是以数据库为准：Redis 负责高并发预扣，异步落库并定期对账（第 24 课）。</li></ol>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
