TITLE='数据结构编码：SDS、listpack、intset 与 quicklist';DESC='同一种类型在内部可以有不同的实现。小集合用紧凑的连续内存，元素变多或变大时自动转换为指针结构。本课讲 redisObject、字符串的三种编码与 SDS、listpack 的布局、intset、quicklist，以及控制转换阈值的配置项——这是理解 Redis 内存占用的基础。';NEXT='哈希表与渐进式 rehash、有序集合与跳表';MIN=60
SUM=['每个值是一个 <b>redisObject</b>：类型（type）、编码（encoding）、LRU/LFU 信息、引用计数和指向数据的指针，约 16 字节。<code>OBJECT ENCODING key</code> 查看编码。',
'String 有三种编码：<code>int</code>（可表示为 64 位整数的值，直接存在指针位置）；<code>embstr</code>（≤ 44 字节，对象头和字符串一次分配、连续存放）；<code>raw</code>（更长，分开分配）。字符串本身用 <b>SDS</b>：记录长度和剩余容量，O(1) 取长度、二进制安全、追加时预分配空间。',
'<b>listpack</b>（Redis 7 起取代 ziplist）：一整块连续内存，元素依次紧凑存放，每个元素记录自身长度以便双向遍历。没有指针开销，缓存友好；但查找是 O(N)，插入删除要移动内存。适合元素少且小的 Hash、ZSet、Set 和 List 节点。',
'<b>intset</b>：只含整数的小集合，按大小有序存放，二分查找，按最大值选择 16/32/64 位宽度。',
'<b>quicklist</b>：较长 List 的实现，是由多个 listpack 节点组成的双向链表；Redis 7.2+ 的短列表可以直接使用 listpack，兼顾两端操作 O(1) 和内存紧凑。<code>list-max-listpack-size -2</code> 表示每个节点最大 8 KB。',
'转换阈值（默认）：Hash 字段数 ≤ 512、ZSet 成员数 ≤ 128，且字段名/成员和值均不超过 64 字节时用 listpack；Set 全为整数且 ≤ 512 用 intset，否则 ≤ 128 个小元素用 listpack；超出就转为 hashtable / skiplist，而且<b>不会再转回去</b>。把一个大对象拆成多个小 Hash，可以大幅节省内存。']
def secs(prac,E):
    return [
('一个 Hash 的编码转换','从 listpack 到 hashtable。','<div id="p1"></div>'),
('String 的三种编码','int、embstr、raw。','<div id="p2"></div>'),
('动手：猜编码','选择一个写入操作，看结果的编码和内存占用。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:70px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('相关命令','查看编码与内存。','<div id="t4"></div>'),
('在你的电脑上练习','在 redis-cli 中执行。',prac([
 ('String 编码。','SET a 12345\nSET b "hello"\nSET c "这是一段超过四十四个字节的字符串，用来观察 raw 编码"\nOBJECT ENCODING a\nOBJECT ENCODING b\nOBJECT ENCODING c','OK\nOK\nOK\n"int"\n"embstr"\n"raw"'),
 ('小 Hash 是 listpack。','HSET h f1 v1 f2 v2\nOBJECT ENCODING h\nMEMORY USAGE h','(integer) 2\n"listpack"\n(integer) 40'),
 ('一个值超过 64 字节：转为 hashtable，内存明显增大。','HSET h big "0123456789012345678901234567890123456789012345678901234567890123456789"\nOBJECT ENCODING h\nMEMORY USAGE h','(integer) 1\n"hashtable"\n(integer) 272'),
 ('删掉它也不会转回去。','HDEL h big\nOBJECT ENCODING h','(integer) 1\n"hashtable"'),
 ('Set：整数用 intset，加入字符串后变为 listpack。','SADD s 1 2 3\nOBJECT ENCODING s\nSADD s x\nOBJECT ENCODING s','(integer) 3\n"intset"\n(integer) 1\n"listpack"'),
 ('查看阈值配置。','CONFIG GET *max-listpack*','1) "hash-max-listpack-entries"\n2) "512"\n3) "hash-max-listpack-value"\n4) "64"\n5) "zset-max-listpack-entries"\n6) "128"\n …')],
 ('用小 Hash 存 1000 万个用户的积分','需要存 1000 万个 user_id → 积分（整数）的映射。方案 A：每个用户一个 String 键 <code>score:{uid}</code>；方案 B：按 uid 分桶 <code>score:{uid / 100}</code>，每个桶一个 Hash，字段为 <code>uid % 100</code>。估算两者的内存差异并解释原因，说明方案 B 的代价。',
 '<p>方案 A：每个键都是全局字典中的一个条目（dictEntry 约 24 字节 + 键的 SDS 约 20 字节 + redisObject 16 字节 + 分配器对齐），值是 int 编码。实测大约每个键 60–70 字节，1000 万个约 650 MB。</p><p>方案 B：10 万个 Hash，每个 100 个字段，低于 Hash 默认 512 的阈值，都是 listpack：每个字段只需几个字节（字段名 “37” 和值 “1520” 紧凑存放），每个桶约 600–800 字节。总计约 70–80 MB，节省近 90%。</p><pre class="cmd">HSET score:123456 78 1520      # uid = 12345678\nHINCRBY score:123456 78 10</pre><p>代价：桶内查找是 O(N)，但 N ≤ 100，实际只有几百纳秒；不能对单个用户设置过期时间（7.4+ 的 HEXPIRE 可以，但带过期的字段会使用额外的编码和内存）；一定要保证每个桶的字段数不超过阈值，否则会整体转为 hashtable，节省就没了。可以用 <code>MEMORY USAGE</code> 抽样验证。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
