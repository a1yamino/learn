TITLE='位图、HyperLogLog 与地理位置';DESC='有些统计问题用普通集合会占用大量内存。本课讲三种特殊结构：用每个用户一个比特记录签到和活跃的位图，用 12 KB 估算上亿个不同元素的 HyperLogLog，以及基于有序集合和 geohash 的地理位置查询，并说明它们的精度与代价。';NEXT='主从复制';MIN=55
SUM=['<b>位图</b>不是独立类型，而是对字符串按位操作：<code>SETBIT key offset 1</code>、<code>GETBIT</code>、<code>BITCOUNT</code>。用户 ID 做偏移量，1 亿用户一天的活跃记录只要约 12 MB。<code>BITOP AND/OR</code> 求连续活跃、任一天活跃。',
'位图要求 ID 连续且密集：偏移量 4 亿会直接分配 50 MB；ID 稀疏时用集合更省。<code>BITFIELD</code> 可以把字符串当作一组任意宽度的整数计数器使用。',
'<b>HyperLogLog</b>：<code>PFADD</code>、<code>PFCOUNT</code>、<code>PFMERGE</code>。不管多少个元素，最多 12 KB（小基数时用稀疏编码更小），标准误差 0.81%。只能估算数量，不能判断某个元素在不在、不能列出元素。',
'适合 UV、搜索词去重数这类“大约多少个”的统计；需要精确值或要知道“谁”时用集合（或位图）。多个 HLL 可以 PFMERGE 得到并集的估计，例如把每天的 UV 合并成周 UV。',
'<b>地理位置</b>：<code>GEOADD</code> 把经纬度编码成 52 位 geohash 作为有序集合的分数，所以底层就是 ZSET。<code>GEOSEARCH key FROMLONLAT lng lat BYRADIUS 3 km ASC COUNT 20 WITHDIST</code> 查附近的点；<code>GEODIST</code> 求距离。',
'Redis 8 已把概率数据结构（布隆过滤器、Cuckoo、Count-Min Sketch、Top-K、t-digest）并入 Redis Open Source，第 18 课用布隆过滤器防缓存穿透；Valkey 通过单独的 valkey-bloom 模块提供布隆过滤器。']
def secs(prac,E):
    return [
('位图：每个用户一个比特','用 ID 作为偏移量。','<div id="p1"></div>'),
('动手：三种方式统计 UV','选择数据规模，比较集合、位图、HyperLogLog 的内存和精度。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:90px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('地理位置：geohash 与有序集合','附近的人、附近的门店。','<div id="p2"></div>'),
('相关命令','更多用法。','<div id="t4"></div>'),
('在你的电脑上练习','在 redis-cli 中。',prac([
 ('记录签到：用户 7 和 100 在 10 月 21 日活跃。','SETBIT active:20261021 7 1\nSETBIT active:20261021 100 1\nGETBIT active:20261021 7\nBITCOUNT active:20261021','(integer) 0\n(integer) 0\n(integer) 1\n(integer) 2'),
 ('两天都活跃的用户数。','SETBIT active:20261022 7 1\nBITOP AND both active:20261021 active:20261022\nBITCOUNT both','(integer) 0\n(integer) 13\n(integer) 1'),
 ('偏移量决定内存。','SETBIT big 80000000 1\nMEMORY USAGE big','(integer) 0\n(integer) 10485816'),
 ('HyperLogLog 估算 UV。','PFADD uv:1021 u1 u2 u3 u2\nPFADD uv:1022 u3 u4\nPFCOUNT uv:1021\nPFMERGE uv:week uv:1021 uv:1022\nPFCOUNT uv:week','(integer) 1\n(integer) 1\n(integer) 3\nOK\n(integer) 4'),
 ('添加门店并查附近。','GEOADD shops 121.5654 25.0330 taipei101 121.5170 25.0478 station 121.5440 25.0330 daan\nGEOSEARCH shops FROMLONLAT 121.5600 25.0340 BYRADIUS 3 km ASC WITHDIST','(integer) 3\n1) 1) "taipei101"\n   2) "0.5536"\n2) 1) "daan"\n   2) "1.6177"'),
 ('底层是有序集合。','TYPE shops\nZSCORE shops daan','zset\n"4054803575137891"')],
 ('设计签到与活跃统计','APP 有 5000 万用户（ID 为 1 到 5000 万的整数）。需求：① 用户每天签到，展示本月签到日历和连续签到天数；② 运营看每日活跃用户数、最近 7 天每天都活跃的人数；③ 每个活动页面的大致 UV（页面上千个，访客可能是未登录设备 ID）。给出键设计和命令，并估算内存。',
 '<ol><li><b>个人签到</b>：每个用户每月一个位图 <code>sign:&lt;uid&gt;:202610</code>，偏移量为日期 0–30，<code>SETBIT</code> 签到，<code>BITFIELD sign:… GET u31 0</code> 一次取出整月，在应用里算日历和连续天数；每个键 4 字节数据（加键开销约几十字节），只为签到过的用户创建。</li><li><b>日活</b>：<code>active:&lt;yyyymmdd&gt;</code> 以 uid 为偏移量，5000 万位约 6 MB/天，<code>BITCOUNT</code> 得日活；7 天都活跃用 <code>BITOP AND</code> 七个键后 BITCOUNT，结果键设 TTL。保留 90 天约 540 MB，过期旧键。</li><li><b>页面 UV</b>：访客是任意字符串且不需要精确，用 <code>PFADD uv:page:&lt;id&gt;:&lt;day&gt; &lt;device&gt;</code>，每个最多 12 KB，1000 页约 12 MB/天；周 UV 用 PFMERGE。误差约 0.81%，向运营说明是估算值。</li></ol>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
