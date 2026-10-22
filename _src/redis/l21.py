TITLE='限流、排行榜与计数器';DESC='除了缓存，Redis 最常见的用途是做共享的计数和排序。本课用前面学过的命令实现三类功能：固定窗口、滑动窗口和令牌桶三种限流算法及其边界问题；用有序集合实现实时排行榜，包括同分排序、分页和超大榜单；以及高并发计数器的写合并与持久化落库。';NEXT='安全：ACL、TLS 与危险命令';MIN=65
SUM=['<b>固定窗口</b>：<code>INCR rl:&lt;uid&gt;:&lt;分钟&gt;</code>，第一次时 <code>EXPIRE 60</code>，超过上限拒绝。简单省内存，但窗口边界前后各一次突发可以在 2 秒内通过 2 倍流量。INCR 与 EXPIRE 要放进同一个脚本或 MULTI，否则可能留下没有 TTL 的键。',
'<b>滑动窗口日志</b>：有序集合中每个请求一个成员（分数为时间戳），<code>ZREMRANGEBYSCORE</code> 删掉窗口外的，<code>ZCARD</code> 计数。精确，但每个请求占用一个成员，适合限额小的场景（如每分钟 10 次登录）。<b>滑动窗口计数</b>用当前窗口和上一窗口的计数加权估算，内存小。',
'<b>令牌桶</b>：哈希保存 <code>tokens</code> 和 <code>ts</code>，每次请求在 Lua 中按经过的时间补充令牌（不超过容量），够就扣减。允许一定突发、平均速率受限，是 API 网关最常用的算法。所有逻辑必须在一个脚本里原子执行；时间可以用 <code>redis.call("TIME")</code> 避免各应用服务器时钟不一致。',
'<b>排行榜</b>：<code>ZINCRBY rank 10 u42</code>，<code>ZREVRANGE rank 0 9 WITHSCORES</code> 取前十，<code>ZREVRANK</code> 查名次，都是 O(log N)。同分时按成员字典序排序；要“先达到的排前面”，把分数编码为 <code>score × 10^10 + (MAX_TS − ts)</code>（注意 double 只有 53 位精确整数）。',
'超大榜单只需要前 N 名时，可以定期 <code>ZREMRANGEBYRANK rank 0 -10001</code> 只保留前一万；需要每个人的精确名次时保留全部，并考虑按时间（日榜、周榜用 <code>ZUNIONSTORE</code> 合并）或分片拆分。',
'<b>计数器</b>：<code>INCR</code>/<code>HINCRBY</code> 是原子的。极高频的计数（阅读数、点赞）可以在应用内存中聚合几百毫秒再 INCRBY，减少写入；定期把 Redis 中的计数批量写回数据库，Redis 宕机时以数据库为基准恢复，接受少量误差。']
def secs(prac,E):
    return [
('三种限流算法','同样是每分钟 100 次。','<div id="p1"></div>'),
('动手：令牌桶','容量 5，每秒补充 1 个。快速点击“请求”，或等待令牌恢复。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:110px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('排行榜','有序集合的分数与名次。','<div id="p2"></div>'),
('相关命令','排行榜常用命令。','<div id="t4"></div>'),
('在你的电脑上练习','在 redis-cli 中。',prac([
 ('固定窗口：原子地计数并设置过期。','EVAL "local c=redis.call(\'INCR\',KEYS[1]) if c==1 then redis.call(\'EXPIRE\',KEYS[1],ARGV[1]) end return c" 1 rl:u42:202610221530 60','(integer) 1'),
 ('滑动窗口日志：最近 60 秒内的请求数。','ZADD rl:login:u42 1761118200000 r1 1761118230000 r2\nZREMRANGEBYSCORE rl:login:u42 -inf 1761118180000\nZCARD rl:login:u42','(integer) 2\n(integer) 0\n(integer) 2'),
 ('令牌桶（容量 5，每秒 1 个）。','EVAL "local t=redis.call(\'TIME\') local now=t[1]+t[2]/1e6 local b=redis.call(\'HMGET\',KEYS[1],\'tk\',\'ts\') local tk=tonumber(b[1]) or 5 local ts=tonumber(b[2]) or now tk=math.min(5,tk+(now-ts)*1) local ok=0 if tk>=1 then tk=tk-1 ok=1 end redis.call(\'HSET\',KEYS[1],\'tk\',tk,\'ts\',now) redis.call(\'EXPIRE\',KEYS[1],60) return ok" 1 tb:u42','(integer) 1'),
 ('排行榜：加分并查询前三和名次。','ZINCRBY rank:week 120 alice\nZINCRBY rank:week 300 bob\nZINCRBY rank:week 200 carol\nZREVRANGE rank:week 0 2 WITHSCORES\nZREVRANK rank:week carol','"120"\n"300"\n"200"\n1) "bob"\n2) "300"\n3) "carol"\n4) "200"\n5) "alice"\n6) "120"\n(integer) 1'),
 ('合并两天的榜单。','ZADD rank:d1 10 alice 5 bob\nZADD rank:d2 7 bob\nZUNIONSTORE rank:2d 2 rank:d1 rank:d2\nZREVRANGE rank:2d 0 -1 WITHSCORES','(integer) 2\n(integer) 1\n(integer) 2\n1) "bob"\n2) "12"\n3) "alice"\n4) "10"'),
 ('计数器批量加。','HINCRBY cnt:article:9 views 37\nHGETALL cnt:article:9','(integer) 37\n1) "views"\n2) "37"')],
 ('设计一个游戏排行榜','一款游戏有 3000 万玩家，需要：① 全服实时总榜，显示前 100 名和“我的名次”；② 同分时先达到该分数的排前面；③ 每周一 00:00 清空周榜，保存上周前 100 名；④ 每秒约 2 万次加分。写出键设计、分数编码、主要命令，以及大 key 和热点的考虑。',
 '<ul><li><b>分数编码</b>：<code>enc = score × 2^21 + (2^21 − 1 − 秒级偏移)</code>，其中偏移为距本周开始的秒数（一周 604800 &lt; 2^21）；只要 score &lt; 2^32，编码值 &lt; 2^53，double 可精确表示。读取时 <code>score = floor(enc / 2^21)</code>。</li><li><b>周榜</b>：<code>rank:week:2026w43</code>，加分用 Lua：读旧分数、算新编码、ZADD（需要先读出旧值，因为编码中的时间部分要更新为当前时间）。</li><li><b>查询</b>：前 100 名 <code>ZREVRANGE … 0 99 WITHSCORES</code>；我的名次 <code>ZREVRANK</code> + 1，都是 O(log N)。</li><li><b>换周</b>：键名带周号，新周自然使用新键；周一 00:05 由任务读取上周前 100 名写入数据库，旧键 <code>EXPIRE 7 天</code> 后由 UNLINK/过期释放，不需要“清空”。</li><li><b>规模</b>：3000 万成员约 3 GB 的单个 ZSET，在 Cluster 中只能在一个分片上；2 万次/秒的写入对单个分片可承受。如果担心，可按 <code>uid % 16</code> 拆成 16 个子榜（分散到不同分片），前 100 名取每个子榜的前 100 后合并；“我的名次”需要对 16 个子榜分别 <code>ZCOUNT</code> 比我高的数量求和。</li></ul>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
