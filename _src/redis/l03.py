TITLE='从应用连接：客户端、连接池与 Pipeline';DESC='应用通过客户端库和 Redis 对话。本课讲 RESP 协议长什么样、连接池为什么必要、超时怎么设，以及降低网络往返的三种手段：批量命令、Pipeline 和多路复用的客户端；最后说明客户端缓存（client-side caching）的工作方式。示例用 Python（redis-py），概念适用于 Jedis、Lettuce、go-redis 等。';NEXT='数据结构编码：SDS、listpack、intset 与 quicklist';MIN=50
SUM=['<b>RESP</b>：命令以数组发送，如 <code>*3\\r\\n$3\\r\\nSET\\r\\n$1\\r\\nk\\r\\n$1\\r\\nv\\r\\n</code>；回复有简单字符串 <code>+OK</code>、错误 <code>-ERR</code>、整数 <code>:1</code>、块字符串 <code>$5</code>、数组 <code>*2</code>。RESP3（<code>HELLO 3</code>）增加了 map、set、推送等类型。',
'一次命令的耗时 ≈ 网络往返（同机房约 0.1–0.5 ms）+ 执行时间（微秒级）。循环执行 1000 次 GET 就是 1000 次往返。',
'<b>批量命令</b>（<code>MGET/MSET/HMGET</code>）把多次读写合并成一条；<b>Pipeline</b> 把多条任意命令连续发出、最后一次性读取回复，往返从 N 次降到 1 次。Pipeline 不是事务：中间的命令可能与其他客户端的命令交错，也可能部分失败。',
'<b>连接池</b>：建立 TCP 连接（和 TLS 握手、AUTH）比执行命令贵得多。阻塞式客户端（redis-py、Jedis）每个并发请求占用一个连接，池大小要覆盖并发度；Lettuce、go-redis 等可以在少量连接上多路复用。注意 <code>maxclients</code>（默认 10000）。',
'设置<b>超时</b>：连接超时和读写超时（几十到几百毫秒）。Redis 卡顿时没有超时的客户端会耗尽应用线程。阻塞命令（<code>BLPOP</code>、<code>XREAD BLOCK</code>）的读超时要大于阻塞时间，并使用独立的连接。',
'<b>客户端缓存</b>（Redis 6+）：<code>CLIENT TRACKING on</code> 后，服务器记住每个连接读过的键，键被修改时推送失效消息，客户端在本地内存缓存热点值，命中时完全不经过网络。']
def secs(prac,E):
    return [
('往返次数决定吞吐','逐条执行与 Pipeline。','<div id="p1"></div>'),
('连接池','连接的复用与耗尽。','<div id="p2"></div>'),
('动手：取 100 个商品要多久','同机房，往返 0.3 ms。选择一种写法，看耗时和注意事项。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:70px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('相关命令','查看连接和协议。','<div id="t4"></div>'),
('在你的电脑上练习','安装客户端：<code>pip install redis</code>。',prac([
 ('直接看 RESP：用 nc 手写协议。','printf \'*3\\r\\n$3\\r\\nSET\\r\\n$1\\r\\nk\\r\\n$1\\r\\nv\\r\\n*2\\r\\n$3\\r\\nGET\\r\\n$1\\r\\nk\\r\\n\' | nc -q1 localhost 6379','+OK\n$1\nv'),
 ('Python 连接（连接池默认启用）。','python3 - <<\'PY\'\nimport redis\nr = redis.Redis(host="localhost", port=6379, decode_responses=True,\n                socket_connect_timeout=0.2, socket_timeout=0.5)\nr.set("greeting", "hello")\nprint(r.get("greeting"))\nPY','hello'),
 ('逐条执行 1 万次与 Pipeline 对比。','python3 - <<\'PY\'\nimport redis, time\nr = redis.Redis()\nt = time.perf_counter()\nfor i in range(10000): r.set(f"k:{i}", i)\nprint("loop", round(time.perf_counter() - t, 3))\nt = time.perf_counter()\np = r.pipeline(transaction=False)\nfor i in range(10000): p.set(f"k:{i}", i)\np.execute()\nprint("pipeline", round(time.perf_counter() - t, 3))\nPY','loop 0.912\npipeline 0.041'),
 ('批量读取：MGET。','python3 - <<\'PY\'\nimport redis\nr = redis.Redis(decode_responses=True)\nprint(r.mget([f"k:{i}" for i in range(5)]))\nPY','[\'0\', \'1\', \'2\', \'3\', \'4\']'),
 ('Pipeline 中的错误不影响其他命令。','python3 - <<\'PY\'\nimport redis\nr = redis.Redis(decode_responses=True)\np = r.pipeline(transaction=False)\np.set("a", 1); p.lpush("a", 2); p.incr("a")\nprint(p.execute(raise_on_error=False))\nPY','[True, ResponseError(\'WRONGTYPE Operation against a key holding the wrong kind of value\'), 2]'),
 ('客户端列表：看到 Python 程序的连接。','CLIENT LIST','id=12 addr=172.17.0.1:50122 laddr=172.17.0.2:6379 fd=9 name= age=3 idle=0 … cmd=client|list …')],
 ('给“商品列表页”减少往返','列表页显示 20 个商品，现在的代码对每个商品依次执行：<code>HGETALL product:{id}</code>、<code>GET stock:{id}</code>、<code>ZSCORE rating {id}</code>，共 60 次往返，耗时约 20 ms。改写它，并说明为什么不用 MULTI/EXEC。',
 '<pre class="cmd">p = r.pipeline(transaction=False)\nfor pid in ids:\n    p.hgetall(f"product:{pid}")\n    p.get(f"stock:{pid}")\n    p.zscore("rating", pid)\nres = p.execute()\nitems = [res[i:i+3] for i in range(0, len(res), 3)]</pre><p>60 次往返变成 1 次，耗时降到 1 ms 左右（服务器执行 60 条命令只需几十微秒）。这里只需要减少往返，不需要原子性：几个值是否在同一瞬间读取对展示没有影响，所以用非事务 Pipeline。MULTI/EXEC（第 10 课）会额外保证中间不插入其他客户端的命令，但同样是一次往返，并没有更快，在 Cluster 模式下还要求所有键在同一个槽。在 Cluster 中，客户端会把 Pipeline 按节点拆分后并行发送。进一步可以把库存合并进商品 Hash 的字段，减少命令数。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
