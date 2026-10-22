TITLE='哈希表与渐进式 rehash、有序集合与跳表';DESC='Redis 的键空间本身就是一个巨大的哈希表，大 Hash、大 Set 也是。本课讲 Redis 字典的结构、负载因子与扩缩容，为什么 rehash 要分摊到很多次操作中完成，SCAN 为什么在 rehash 期间也不会漏掉元素；然后讲有序集合如何同时用跳表和字典实现 O(log N) 的排序操作。';NEXT='事件循环、单线程与 I/O 线程';MIN=60
SUM=['字典 = 桶数组 + 链地址法解决冲突。键经过哈希函数（SipHash）定位到桶。<b>负载因子</b> = 元素数 / 桶数；达到 1 时扩容为 ≥ 2 倍的 2 的幂（正在 fork 子进程做持久化时放宽到 4，避免写时复制产生大量内存拷贝），低于 1/8 时缩容。',
'扩容时一次性迁移几百万个元素会阻塞主线程几百毫秒，所以 Redis 采用<b>渐进式 rehash</b>：同时持有新旧两张表，之后每次对该字典的增删查改顺带迁移一个桶，空闲时 serverCron 也每毫秒迁移一批。期间查找要查两张表，新元素只写入新表。',
'<b>SCAN</b> 用游标遍历桶，游标按“反向二进制位”递增。这样无论表在两次 SCAN 之间扩容还是缩容，所有在遍历全程都存在的元素至少返回一次（可能重复，应用要能去重）。<code>COUNT</code> 只是提示，每次返回的数量不固定。',
'<b>Sorted Set</b>（大于阈值时）= <b>跳表</b> + <b>字典</b>：字典负责成员 → 分数的 O(1) 查找（ZSCORE）；跳表按（分数, 成员）有序，负责范围查询和排名，平均 O(log N)。',
'跳表是多层有序链表：每个节点随机获得层数（每层概率 1/4，最多 32 层），高层是低层的“快速通道”。查找从最高层开始向右走，走不动就下降一层。每层记录跨度（span），因此 <code>ZRANK</code> 也是 O(log N)。',
'为什么不用平衡树：跳表实现简单，范围遍历只需在最底层链表上顺序前进，插入只修改局部指针、不需要旋转。']
def secs(prac,E):
    return [
('渐进式 rehash','扩容被分摊到之后的每一次操作。','<div id="p1"></div>'),
('跳表查找','从高层快速逼近目标。','<div id="p2"></div>'),
('动手：复杂度与耗时','一个有 100 万成员的 ZSet <code>rank</code>。选择命令，看复杂度和大致耗时。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:70px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('相关命令','观察字典与有序集合。','<div id="t4"></div>'),
('在你的电脑上练习','以下只在临时本地容器中启用 DEBUG，不改课程主容器；实验结束后删除它。',prac([
 ('启动隔离的调试实例并进入 redis-cli。','docker run -d --name learn-review-rdebug redis:8.10 redis-server --enable-debug-command local\ndocker exec -it learn-review-rdebug redis-cli','127.0.0.1:6379>'),
 ('造 100 万个键（DEBUG POPULATE 在官方镜像中默认禁用，这里用 Lua）。','EVAL "for i=1,1000000 do redis.call(\'SET\',\'key:\'..i,i) end return 1" 0','(integer) 1'),
 ('看键空间的哈希表：桶数与元素数。','DEBUG HTSTATS 0','[Dictionary HT]\n Hash table 0 stats (main hash table):\n table size: 1048576\n number of elements: 1000000\n …'),
 ('SCAN 每次返回的数量不固定。','SCAN 0 COUNT 10\n# 每次使用上一条返回的游标继续，直到返回 0；下面的游标只是示意。\nSCAN 393216 COUNT 10','1) "393216"\n2)  1) "key:5521"\n    …\n   11) "key:90213"\n1) "720896"\n2) 1) "key:12"\n   …'),
 ('造一个 10 万成员的 ZSet，编码为 skiplist。','EVAL "for i=1,100000 do redis.call(\'ZADD\',\'rank\',math.random(1,1000000),\'u\'..i) end return 1" 0\nOBJECT ENCODING rank','(integer) 1\n"skiplist"'),
 ('O(1) 与 O(log N) 的操作。','ZSCORE rank u42\nZREVRANK rank u42\nZRANGE rank 0 4 REV WITHSCORES','"873120"\n(integer) 12699\n1) "u71203"\n2) "999987"\n…'),
 ('用 SLOWLOG 看 O(N) 命令。','CONFIG SET slowlog-log-slower-than 1000\nZRANGE rank 0 -1\nSLOWLOG GET 1','…\n1) 1) (integer) 0\n   2) (integer) 1761101230\n   3) (integer) 38211\n   4) 1) "ZRANGE"\n      2) "rank"\n      3) "0"\n      4) "-1"'),
 ('退出 redis-cli 后清理实验容器。','exit\ndocker rm -f learn-review-rdebug','learn-review-rdebug')],
 ('分页读取一个大排行榜','排行榜 ZSet 有 500 万成员，前端要按名次分页，每页 50 条，用户经常跳到第 2 万页附近。<code>ZRANGE rank 1000000 1000049 REV</code> 的复杂度是多少？还有什么需要注意的？如果要“从我的名次附近开始显示”，怎么写？',
 '<p>ZRANGE 按下标取范围的复杂度是 O(log N + M)：借助每层的跨度信息，跳表可以在 O(log N) 内定位到第 100 万名，再顺序取 M = 50 个。所以深分页在 Redis 的 ZSet 里依然很快（和数据库 OFFSET 不同），不需要特殊处理。</p><pre class="cmd">ZREVRANK rank u42          → (integer) 812345\nZRANGE rank 812320 812370 REV WITHSCORES</pre><p>注意：两条命令之间排名可能变化，对展示通常无妨；需要一致时可以用 Lua 把两步放在一起执行。分数相同的成员按成员名的字典序排列，排名会因此看起来“不公平”，常见做法是把时间编码进分数（先根据分数和时间的取值范围分配整数位，确保编码不超过 2<sup>53</sup> − 1；第 21 课给出示例），让先达到的排在前面。不要用 ZRANGE 0 -1 取全部。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
