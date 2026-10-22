TITLE='基础数据类型与常用命令';DESC='Redis 的值不只是字符串。本课讲五种基础类型——String、List、Hash、Set、Sorted Set——各自的典型用途和常用命令、每个命令的时间复杂度，以及键的命名、类型检查和遍历。选对类型，比任何调优都更能决定性能和内存。';NEXT='从应用连接：客户端、连接池与 Pipeline';MIN=50
SUM=['<b>String</b>：二进制安全，最大 512 MB。用于缓存序列化对象、计数器（<code>INCR</code>、<code>INCRBY</code> 原子自增）、分布式锁（<code>SET key val NX PX 30000</code>）。',
'<b>List</b>：按插入顺序的双端列表，两端 <code>LPUSH/RPUSH/LPOP/RPOP</code> 是 O(1)，按下标访问中间元素是 O(N)。用于简单队列（<code>BLPOP</code> 阻塞等待）、最近 N 条记录（<code>LPUSH</code> + <code>LTRIM</code>）。',
'<b>Hash</b>：一个键下的字段—值映射。存对象的各个属性，可以单独读写某个字段（<code>HSET</code>、<code>HGET</code>、<code>HINCRBY</code>）。Redis 7.4+ 支持为单个字段设置过期（<code>HEXPIRE</code>）。',
'<b>Set</b>：无序、不重复。成员判断 <code>SISMEMBER</code> O(1)；交并差 <code>SINTER/SUNION/SDIFF</code> 用于共同好友、标签筛选。<b>Sorted Set</b>（ZSet）：每个成员带一个 double 分数，按分数有序，<code>ZADD</code>/<code>ZINCRBY</code> O(log N)，<code>ZRANGE … REV</code>、<code>ZRANK</code> 用于排行榜和按时间排序的索引。',
'键名用冒号分层：<code>业务:对象:id[:字段]</code>，如 <code>shop:product:1001</code>。保持简短但可读；键名本身也占内存。<code>TYPE key</code> 查看类型，对错误类型执行命令会返回 <code>WRONGTYPE</code>。',
'看文档时注意每个命令的复杂度：<code>HGETALL</code>、<code>SMEMBERS</code>、<code>LRANGE 0 -1</code>、<code>ZRANGE 0 -1</code> 都是 O(N)。元素多的集合用 <code>HSCAN/SSCAN/ZSCAN</code> 分批遍历。']
def secs(prac,E):
    return [
('五种类型','同一个“用户”，用不同的类型存储。','<div id="p1"></div>'),
('Sorted Set：排行榜','分数决定顺序。','<div id="p2"></div>'),
('动手：选哪种类型','选择一个需求，看推荐的类型、命令和理由。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:70px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('相关命令','各类型的常用命令。','<div id="t4"></div>'),
('在你的电脑上练习','<code>docker exec -it redis redis-cli</code> 后逐条执行。',prac([
 ('String 与原子计数。','SET page:home:views 0\nINCR page:home:views\nINCRBY page:home:views 10\nGET page:home:views','OK\n(integer) 1\n(integer) 11\n"11"'),
 ('List：保留最近 3 条浏览记录。','LPUSH user:1:recent p1 p2 p3 p4\nLTRIM user:1:recent 0 2\nLRANGE user:1:recent 0 -1','(integer) 4\nOK\n1) "p4"\n2) "p3"\n3) "p2"'),
 ('Hash：对象的字段。','HSET user:1 name alice city taipei visits 0\nHINCRBY user:1 visits 1\nHGET user:1 city\nHGETALL user:1','(integer) 3\n(integer) 1\n"taipei"\n1) "name"\n2) "alice"\n3) "city"\n4) "taipei"\n5) "visits"\n6) "1"'),
 ('Set：共同关注。','SADD follow:alice bob carol dave\nSADD follow:bob carol dave erin\nSINTER follow:alice follow:bob\nSISMEMBER follow:alice erin','(integer) 3\n(integer) 3\n1) "carol"\n2) "dave"\n(integer) 0'),
 ('Sorted Set：排行榜。','ZADD board 120 alice 95 bob 150 carol\nZINCRBY board 40 bob\nZRANGE board 0 2 REV WITHSCORES\nZREVRANK board alice','(integer) 3\n"135"\n1) "carol"\n2) "150"\n3) "bob"\n4) "135"\n5) "alice"\n6) "120"\n(integer) 2'),
 ('类型错误与遍历。','TYPE board\nGET board\nSCAN 0 MATCH user:* COUNT 100','zset\n(error) WRONGTYPE Operation against a key holding the wrong kind of value\n1) "0"\n2) 1) "user:1"\n   2) "user:1:recent"')],
 ('设计一个文章系统的键','需要：文章内容与作者、点赞（每人只能赞一次，要能判断自己是否赞过）、按点赞数的热门榜、每篇文章的最近 50 条评论 id、首页“最新发布”列表。为每一项给出键名、类型和关键命令。',
 '<pre class="cmd">post:{id}                Hash   HSET post:1001 title … author 42 created 1761100000\npost:{id}:likers         Set    SADD post:1001:likers 42   → 返回 1 表示新点赞，0 表示已赞过\n                                SISMEMBER post:1001:likers 42\nposts:hot                ZSet   ZINCRBY posts:hot 1 1001（只在 SADD 返回 1 时执行）\n                                ZRANGE posts:hot 0 9 REV WITHSCORES\npost:{id}:comments       List   LPUSH post:1001:comments c9001; LTRIM post:1001:comments 0 49\nposts:latest             ZSet   ZADD posts:latest 1761100000 1001（分数为发布时间）\n                                ZRANGE posts:latest +inf -inf BYSCORE REV LIMIT 0 20</pre><p>点赞用 Set 保证去重，SADD 的返回值告诉你是不是第一次赞，再决定是否给排行榜加分（两步之间的原子性可以用第 10 课的 Lua 保证）。点赞数可以直接用 <code>SCARD</code>，不必单独存。“最新发布”用以时间戳为分数的 ZSet 而不是 List，可以按时间范围分页，也可以删除任意一篇（ZREM O(log N)，List 删除中间元素是 O(N)）。热门文章的点赞者集合可能很大，不要用 SMEMBERS 取全部。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
