TITLE='发布订阅与 Stream';DESC='Redis 可以在服务之间传递消息。本课比较两种方式：即发即弃的 Pub/Sub（包括 Redis 7 的分片 Pub/Sub），以及可持久化、可回放、支持消费者组和确认机制的 Stream，并讲清楚 List 做队列的局限、Stream 的 ID、PEL 与消息认领。';NEXT='位图、HyperLogLog 与地理位置';MIN=60
SUM=['<b>Pub/Sub</b>：<code>PUBLISH</code> 把消息推给此刻在线的订阅者，不存储。订阅者断线期间的消息永久丢失；订阅者处理太慢，输出缓冲区超过 <code>client-output-buffer-limit pubsub 32mb 8mb 60</code> 会被断开。适合实时通知、缓存失效广播这类可以丢的场景。',
'Cluster 中普通 PUBLISH 会广播到所有节点；Redis 7 的 <code>SPUBLISH</code>/<code>SSUBSCRIBE</code>（分片 Pub/Sub）按频道名的槽只发到对应分片，能水平扩展。',
'<b>List 做队列</b>：<code>LPUSH</code> + <code>BRPOP</code> 简单，但消息被取走后消费者崩溃就丢了；<code>LMOVE</code> 移到“处理中”列表可以补救，但没有多消费者组、没有回放。',
'<b>Stream</b> 是只追加的日志。<code>XADD</code> 返回形如 <code>1761104210123-0</code>（毫秒时间-序号）的 ID，严格递增。<code>XRANGE</code> 按 ID 范围读，<code>XREAD BLOCK</code> 阻塞等待新消息；<code>MAXLEN ~ 100000</code> 近似裁剪长度。',
'<b>消费者组</b>：<code>XGROUP CREATE</code> 建组，<code>XREADGROUP … &gt;</code> 让组内多个消费者分摊消息；每条被读出的消息进入该消费者的 <b>PEL</b>（待确认列表），处理完 <code>XACK</code>。消费者崩溃后，其他消费者用 <code>XPENDING</code> 发现超时消息并用 <code>XAUTOCLAIM</code> 认领重试。这提供的是“至少一次”投递，所以处理逻辑要幂等。',
'规模更大、需要长期保留或跨数据中心的消息流仍应选 Kafka 等专门系统；Stream 适合已经有 Redis、消息量中等、保留时间短的场景。']
def secs(prac,E):
    return [
('Pub/Sub：只发给在线的人','不存储，不确认。','<div id="p1"></div>'),
('Stream 与消费者组','读出后进入待确认列表，确认后才算完成。','<div id="p2"></div>'),
('动手：消费者崩溃了','组 g 中有 c1、c2 两个消费者。点击操作，看 PEL 的变化。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:120px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('相关命令','观察 Stream 状态。','<div id="t4"></div>'),
('在你的电脑上练习','开两个 redis-cli 终端。',prac([
 ('终端 1 订阅；终端 2 发布。','SUBSCRIBE news\n# 终端 2：\nPUBLISH news "hello"','1) "subscribe"\n2) "news"\n3) (integer) 1\n1) "message"\n2) "news"\n3) "hello"'),
 ('添加消息到 Stream。','XADD orders * id 1001 amt 99\nXADD orders * id 1002 amt 15\nXLEN orders','"1761104210123-0"\n"1761104210456-0"\n(integer) 2'),
 ('创建消费者组，从头开始消费。','XGROUP CREATE orders g 0\nXREADGROUP GROUP g c1 COUNT 1 STREAMS orders >','OK\n1) 1) "orders"\n   2) 1) 1) "1761104210123-0"\n         2) 1) "id" 2) "1001" 3) "amt" 4) "99"'),
 ('未确认的消息在 PEL 中。','XPENDING orders g','1) (integer) 1\n2) "1761104210123-0"\n3) "1761104210123-0"\n4) 1) 1) "c1"\n      2) "1"'),
 ('c2 认领空闲超过 0 毫秒的消息（演示用）并确认。','XAUTOCLAIM orders g c2 0 0-0 COUNT 10\nXACK orders g 1761104210123-0','1) "0-0"\n2) 1) 1) "1761104210123-0"\n      2) …\n3) (empty array)\n(integer) 1'),
 ('裁剪长度。','XADD orders MAXLEN ~ 1000 * id 1003 amt 7','"1761104211000-0"')],
 ('设计订单事件的可靠消费','订单服务每秒写入约 2000 条“已支付”事件，积分服务和通知服务都要各自处理全部事件；处理可能失败，进程可能被重启。用 Stream 设计：键与裁剪、消费者组划分、确认与重试、死信处理、如何保证积分不重复发放。',
 '<ol><li>一个 Stream <code>events:order:paid</code>，<code>XADD … MAXLEN ~ 5000000</code>（约 40 分钟），超出部分以数据库为准。</li><li>两个消费者组 <code>points</code> 和 <code>notify</code>：每个组独立获得全部消息；组内多个实例（消费者名用实例 ID）分摊。</li><li>每个实例循环 <code>XREADGROUP GROUP points &lt;id&gt; COUNT 100 BLOCK 2000 STREAMS … &gt;</code>，处理成功后 <code>XACK</code>。启动时先读 ID 为 <code>0</code> 的自己的待处理消息（重启前没确认的）。</li><li>后台任务每 30 秒 <code>XAUTOCLAIM … 60000</code> 认领空闲超过 60 秒的消息；<code>XPENDING</code> 返回的投递次数超过 5 次的写入 <code>events:order:paid:dead</code> 并 XACK，告警人工处理。</li><li>“至少一次”意味着可能重复：积分发放以订单号做幂等，如数据库唯一约束 <code>(order_id, type)</code>，或 <code>SET points:done:&lt;order&gt; 1 NX EX 86400</code> 成功才发放。</li></ol>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
