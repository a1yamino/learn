TITLE='综合项目：一个高并发商品服务的缓存层';DESC='最后一课把整门课的内容用在一个完整的设计上：一个电商商品服务，平时 2 万 QPS，大促 20 万 QPS，含商品详情、库存预扣、浏览排行和限流。我们依次做容量估算、选择部署形态、设计键和数据结构、读写与一致性流程、故障时的降级，并给出上线检查清单。';NEXT=None;MIN=90
SUM=['<b>容量</b>：200 万商品 × 平均 3 KB 详情（压缩后 1 KB）≈ 2 GB 数据，加上开销与余量按 2 倍算 4–5 GB；库存、排行、限流键都很小。单分片约能处理 10 万 QPS 简单命令，大促 20 万 QPS 读需要本地缓存 + 多个分片或副本。',
'<b>部署</b>：Redis Cluster 3 主 3 从（跨 3 个可用区），每个主节点 maxmemory 3 GB；缓存数据 <code>allkeys-lfu</code>。库存数据单独一个实例（或一组分片）：<code>noeviction</code>、AOF everysec，与缓存隔离，避免被淘汰。',
'<b>键</b>：<code>p:{id}:v2</code>（详情 JSON，TTL 1 小时 ± 10%）；<code>p:null:{id}</code>（空值，60 秒）；<code>bf:p</code>（布隆过滤器）；<code>stk:{id}</code>（库存）、<code>stk:{id}:orders</code>（订单状态 Hash，字段为订单号，值为预扣数量或 cancelled；取消墓碑至少保留到重试窗口结束）；<code>rank:view:{日期}:{0..15}</code>（浏览排行分片）；<code>rl:{uid}</code>（令牌桶）。',
'<b>读</b>：本地缓存（热点 2 秒）→ Redis → 布隆过滤器判断 → 互斥重建回源数据库。<b>写</b>：更新数据库后删除缓存，binlog 订阅再删一次并延迟双删。<b>库存</b>：Lua 原子检查并扣减，以订单号和数量幂等；取消保留墓碑避免旧请求再次扣减。数据库负责最终的条件扣减和订单幂等；还需可靠投递预扣事件，定时对账只是补救。',
'<b>故障</b>：Redis 分片切换期间读本地缓存旧值、回源受全局并发上限保护；库存实例不可用时暂停下单而不是回退到数据库直扣（避免超卖与压垮数据库）；所有 Redis 调用设置超时（如 50 ms）与熔断。',
'<b>上线清单</b>：ACL 账户与网络隔离；持久化配置按实例用途区分；监控命中率、延迟、内存、淘汰、复制；压测验证热点与大 key；演练主节点故障切换和缓存全部失效。']
def secs(prac,E):
    return [
('整体架构','请求从网关到数据库经过的每一层。','<div id="p1"></div>'),
('库存预扣','防超卖、防重复、可对账。','<div id="p2"></div>'),
('动手：大促演练','注入一个故障，看系统的表现与对应的设计。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:110px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('关键脚本','库存预扣与回补。','<div id="t4"></div>'),
('在你的电脑上练习','在一个 Redis 8 容器中把关键流程跑一遍。',prac([
 ('准备：布隆过滤器、详情缓存、库存。','BF.MADD bf:p 1001 1002\nSET p:{1001}:v2 \'{"id":1001,"name":"键盘","price":399}\' EX 3600\nSET stk:{1001} 3','1) (integer) 1\n2) (integer) 1\nOK\nOK'),
 ('读：不存在的 ID 被布隆过滤器挡住。','BF.EXISTS bf:p 424242','(integer) 0'),
 ('库存预扣脚本：订单状态存在 Hash，数量只接受正整数；返回 -1 表示该订单已取消。','SCRIPT LOAD "local q=tonumber(ARGV[2]) if not q or q<=0 or q%1~=0 then return redis.error_reply(\'bad quantity\') end local old=redis.call(\'HGET\',KEYS[2],ARGV[1]) if old then if old==\'cancelled\' then return -1 end if tonumber(old)==q then return 2 end return redis.error_reply(\'quantity mismatch\') end local s=tonumber(redis.call(\'GET\',KEYS[1]) or 0) if s<q then return 0 end redis.call(\'DECRBY\',KEYS[1],ARGV[2]) redis.call(\'HSET\',KEYS[2],ARGV[1],ARGV[2]) return 1"\nEVALSHA 1d8bd80d792ca64b9586f58ded66e3d08c6f57b1 2 stk:{1001} stk:{1001}:orders o-1 1','"1d8bd80d792ca64b9586f58ded66e3d08c6f57b1"\n(integer) 1'),
 ('用实际脚本SHA复用已加载脚本；同订单重试返回2，库存不变。','EVALSHA 1d8bd80d792ca64b9586f58ded66e3d08c6f57b1 2 stk:{1001} stk:{1001}:orders o-1 1\nGET stk:{1001}','(integer) 2\n"2"'),
 ('卖完后返回 0。','EVALSHA 1d8bd80d792ca64b9586f58ded66e3d08c6f57b1 2 stk:{1001} stk:{1001}:orders o-2 2\nEVALSHA 1d8bd80d792ca64b9586f58ded66e3d08c6f57b1 2 stk:{1001} stk:{1001}:orders o-3 1','(integer) 1\n(integer) 0'),
 ('浏览排行（分片 3）与限流计数。','ZINCRBY rank:view:20261022:3 1 1001\nEVAL "local c=redis.call(\'INCR\',KEYS[1]) if c==1 then redis.call(\'EXPIRE\',KEYS[1],1) end return c" 1 rl:{u42}:s','"1"\n(integer) 1')],
 ('写出你的设计文档','按本课的结构，为你自己工作中的一个服务（或者“热门文章与评论服务”：100 万篇文章，读 5 万 QPS，评论写 2000 QPS，首页按 24 小时热度排行）写一份一页的缓存设计：容量估算、部署形态、键设计、读写流程、一致性方案、穿透/击穿/雪崩防护、热 key/大 key 处理、安全与监控、故障降级。',
 '<p>“热门文章与评论服务”的参考要点：</p><ul><li><b>容量</b>：文章详情 100 万 × 5 KB ≈ 5 GB，只缓存近 30 天活跃的约 20 万篇 ≈ 1 GB；评论按文章分页缓存前 3 页。Cluster 3 主 3 从，<code>allkeys-lfu</code>。</li><li><b>键</b>：<code>a:{id}</code>（详情，TTL 1 h ± 抖动）；<code>a:{id}:c:p1..p3</code>（评论分页 JSON，TTL 60 s）；<code>a:{id}:cnt</code>（哈希：阅读、点赞、评论数）；<code>hot:24h:{0..7}</code>（ZSET 分片）。</li><li><b>读写</b>：Cache-Aside；新评论写数据库后删除该文章第 1 页评论缓存并 <code>HINCRBY cnt comments 1</code>；阅读数在应用内聚合 1 秒后 HINCRBY，每 5 分钟落库。</li><li><b>热度榜</b>：按文章 ID 分 8 个分片，每小时一个 ZSET 桶 <code>hot:{s}:h:&lt;yyyymmddhh&gt;</code>（s 为 0–7）。每 5 分钟在各分片内 <code>ZUNIONSTORE hot:{s}:24h …</code> 合并最近 24 个桶（可用 WEIGHTS 衰减）；同一分片标签相同，避免 Cluster 的 CROSSSLOT。应用取 8 个子榜 Top N 合并，桶 TTL 25 小时。</li><li><b>防护</b>：布隆过滤器 + 空值；热门文章互斥重建 + 本地缓存 2 秒；TTL 抖动；回源并发限制。</li><li><b>一致性</b>：编辑文章后删除缓存 + binlog 订阅延迟双删；评论数允许几秒误差。</li><li><b>安全与监控</b>：ACL 应用账户 <code>~a:* ~hot:*</code>；监控命中率、P99、内存、淘汰、慢日志；季度故障演练。</li></ul>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
