TITLE='并发代码的整洁';MIN=50;NEXT='综合项目：一步步重构一个混乱的订单模块'
DESC='并发代码的 bug 很难复现，所以设计上的整洁更为重要。本课讲：并发代码的单一职责（把并发管理与业务逻辑分开）；限制共享数据的作用域；使用数据副本与不可变数据；线程尽量独立；了解标准库提供的安全工具（队列、线程池、锁、asyncio）；三种经典模型（生产者—消费者、读者—写者、哲学家就餐）及其问题；保持同步区域很小；正确地关闭；以及如何测试并发代码。示例使用 Python 的 threading、concurrent.futures 与 asyncio，并说明 GIL 不能替你保证正确性。'
SUM=['<b>把并发与业务分开</b>：业务逻辑写成普通的、可单独测试的函数；线程、队列、事件循环放在外层。并发代码有自己的生命周期和失败模式，应当有自己的模块。',
'<b>限制共享可变数据</b>：共享的东西越少，需要保护的就越少。优先选择：不共享（每个任务自己的数据）→ 共享不可变数据 → 通过队列传递消息 → 最后才是加锁的共享状态。',
'<b>GIL 不保证正确性</b>：<code>counter += 1</code> 是“读—改—写”多条字节码，线程切换可能发生在中间。在较新的 CPython 中，简单的 <code>+=</code> 很少表现出竞态，但这只是实现细节而不是保证；只要读与写之间有函数调用或 I/O，问题马上出现。需要原子性时使用锁或线程安全的数据结构。',
'<b>使用标准库的高层工具</b>：<code>queue.Queue</code>、<code>concurrent.futures.ThreadPoolExecutor</code>、<code>asyncio.TaskGroup</code>，而不是自己用裸线程和条件变量拼装。',
'<b>同步区域保持很小</b>：锁内只做必要的读写，不做 I/O、不调用外部回调；多个锁按固定顺序获取以避免死锁。',
'<b>正确关闭与测试</b>：设计时就考虑如何停止（哨兵值、取消、超时）。测试并发代码：先让业务逻辑在单线程下正确，再用更多线程、更多迭代、随机延迟反复运行；把偶发失败当作真问题对待。']
S1=('丢失的更新','两个线程同时执行 counter += 1。')
A1=[('读','线程 A 读到 counter = 41。',[('a','线程 A：读 41','sig',0,0,180),('c','counter = 41','',240,60,160)]),
('切换','在 A 写回之前，线程 B 也读到 41。',[('a','线程 A：读 41','sig',0,0,180),('b','线程 B：读 41','sig',0,120,180),('c','counter = 41','',240,60,160)]),
('写','A 写入 42，B 也写入 42。',[('a','线程 A：写 42','bad',0,0,180),('b','线程 B：写 42','bad',0,120,180),('c','counter = 42 ✗（应为 43）','bad',240,60,220)]),
('加锁','读—改—写放在锁内，变成一个原子步骤。',[('a','线程 A：with lock','ok',0,0,180),('b','线程 B：等待','',0,120,180),('c','counter = 43 ✓','ok',240,60,180)]),
('或不共享','每个线程统计自己的部分，最后合并：不需要锁。',[('a','A：局部计数','ok',0,0,180),('b','B：局部计数','ok',0,120,180),('c','sum(结果)','ok',240,60,180)])]
S2=('动手：这段并发代码安全吗？','选择一段代码。')
CHI=[('共享计数器','count = 0\ndef work():\n    global count\n    for _ in range(100_000):\n        count += 1\n\n# 8 个线程执行 work()','bad','<b>不安全</b>：+= 不是原子操作，结果可能小于 800000。用锁，或者更好：每个线程返回自己的计数，最后求和。'),
('锁内做 I/O','with lock:\n    cache[key] = value\n    requests.post(audit_url, json=...)   # 网络调用','bad','同步区域太大：所有线程都要等这个网络请求。只把 <code>cache[key] = value</code> 放在锁内。'),
('两把锁','# 线程 1\nwith lock_a:\n    with lock_b: ...\n# 线程 2\nwith lock_b:\n    with lock_a: ...','bad','<b>死锁</b>风险：两线程各持一把锁等待另一把。规定全局获取顺序（总是先 a 后 b）。'),
('队列','q = queue.Queue(maxsize=100)\n\ndef producer():\n    for item in source(): q.put(item)\n    q.put(None)                 # 哨兵：通知结束\n\ndef consumer():\n    while (item := q.get()) is not None:\n        handle(item)','ok','<b>生产者—消费者</b>：数据通过队列传递而不是共享；有界队列提供背压；哨兵值让消费者正常退出。'),
('线程池 + 纯函数','def fetch_price(sku): ...   # 无共享状态\n\nwith ThreadPoolExecutor(max_workers=8) as pool:\n    prices = dict(zip(skus, pool.map(fetch_price, skus)))','ok','业务函数不知道自己在并发中运行；结果由池收集，没有共享可变状态。'),
('asyncio TaskGroup','async with asyncio.TaskGroup() as tg:\n    t1 = tg.create_task(fetch("a"))\n    t2 = tg.create_task(fetch("b"))\n# 任一任务失败，其余会被取消','ok','结构化并发：任务的生命周期被限定在一个代码块内，错误不会被静默丢弃。')]
CHH='选择一段代码。'
S3=('三种经典模型','大多数并发问题都是它们的变体。','''<table class="tbl"><tr><th>模型</th><th>问题</th><th>Python 中的做法</th></tr>
<tr><td>生产者—消费者</td><td>速度不匹配；如何结束</td><td><code>queue.Queue(maxsize=N)</code>（背压）+ 哨兵值或 <code>q.shutdown()</code>（3.13+）</td></tr>
<tr><td>读者—写者</td><td>读多写少时，既要并发读又要写一致</td><td>写时复制：构造新的不可变对象后整体替换引用（引用赋值在 CPython 中是原子的）</td></tr>
<tr><td>哲学家就餐</td><td>多个资源，死锁与饥饿</td><td>固定的获取顺序；或用一个更粗粒度的锁；或带超时的 <code>acquire</code></td></tr></table>
<p><b>线程、进程还是 asyncio？</b> I/O 密集且并发数大（成千上万个连接）→ asyncio；I/O 密集、使用阻塞库 → 线程池；CPU 密集 → 进程池（或使用自由线程构建的 Python 3.13+、或把计算交给 NumPy 等释放 GIL 的库）。</p>''')
S4=('让竞态现形','反复运行，偶发的失败就会出现。')
TERM=[['for i in 1 2 3; do python3 race.py; done','unsafe=241025 safe=800000 expected=800000\nunsafe=255870 safe=800000 expected=800000\nunsafe=277284 safe=800000 expected=800000','不安全的版本有时正确、有时不正确：这正是并发 bug 难以复现的原因。（具体数字每次不同。）'],
['python3 -X dev race.py','unsafe=263311 safe=800000 expected=800000','开发模式会打开更多运行时检查；更重要的是多次、高并发地运行。']]
S5=('在你的电脑上练习','观察丢失的更新，然后用两种方式修复：加锁，以及“不共享”。')
PRAC=[('竞态：多运行几次，看看结果是否每次都等于 800000。（结果可能因 Python 版本和机器不同而不同。）','cat > race.py <<\'EOF\'\nimport sys, threading\n\nsys.setswitchinterval(1e-6)   # 让线程切换更频繁，更容易观察到竞态\nTHREADS, N = 8, 100_000\n\ndef plus_one(x):   # 读—改—写之间有一次函数调用，真实代码中常常如此\n    return x + 1\n\ncount = 0\ndef unsafe():\n    global count\n    for _ in range(N):\n        count = plus_one(count)\n\nlock = threading.Lock()\nsafe_count = 0\ndef safe():\n    global safe_count\n    for _ in range(N):\n        with lock:\n            safe_count = plus_one(safe_count)\n\nfor target in (unsafe, safe):\n    ts = [threading.Thread(target=target) for _ in range(THREADS)]\n    for t in ts: t.start()\n    for t in ts: t.join()\nprint(f"unsafe={count} safe={safe_count} expected={THREADS * N}")\nEOF\nfor i in 1 2 3; do python3 race.py; done',None),
('更好的方式：不共享。每个任务返回自己的结果，线程池负责收集。','cat > noshare.py <<\'EOF\'\nfrom concurrent.futures import ThreadPoolExecutor\n\ndef count_words(text):          # 纯函数：可以单独测试\n    return len(text.split())\n\ndocs = ["a b c", "d e", "f g h i"] * 1000\nwith ThreadPoolExecutor(max_workers=8) as pool:\n    total = sum(pool.map(count_words, docs))\nprint(total)\nEOF\npython3 noshare.py',None),
('生产者—消费者：有界队列 + 哨兵，正确关闭。','cat > pc.py <<\'EOF\'\nimport queue, threading\n\nDONE = object()\nq = queue.Queue(maxsize=10)\nresults = []\n\ndef producer():\n    for i in range(25):\n        q.put(i)\n    q.put(DONE)\n\ndef consumer():\n    while (item := q.get()) is not DONE:\n        results.append(item * item)\n\nthreads = [threading.Thread(target=producer), threading.Thread(target=consumer)]\nfor t in threads: t.start()\nfor t in threads: t.join()\nprint(len(results), sum(results))\nEOF\npython3 pc.py',None)]
CHAL=('重新设计','一个爬虫用 20 个线程抓取网页，所有线程共享一个 <code>visited = set()</code> 和一个 <code>results = []</code>，每个线程在抓取前检查 <code>if url not in visited: visited.add(url)</code>。指出问题，给出一个更整洁的设计。',
'<p><b>问题</b>：“检查后添加”不是原子的，两个线程可能同时通过检查而重复抓取；共享的结构让业务逻辑（解析页面）与并发控制交织在一起。</p><p><b>设计</b>：</p><ul><li>一个<b>协调者</b>（单线程）独占 <code>visited</code>，负责去重与调度：它从结果队列取出新链接，未访问过的放入任务队列。</li><li><b>工作者</b>只做一件事：<code>fetch_and_parse(url) -> Page(links, data)</code>，纯粹、可单独测试，不接触共享状态。</li><li>两个队列（任务、结果）连接它们；用有界队列控制并发与内存；用哨兵或计数正确结束。</li><li>如果使用 asyncio，协调者与工作者都在同一个事件循环中，<code>visited</code> 只在 await 点之间被访问，天然不需要锁——但抓取函数要是异步的。</li></ul>')
QUIZ=[['Python 有 GIL，counter += 1 在多线程下是否安全？',['不安全，读改写可能被打断','安全','只在 Windows 上不安全'],0,''],
['减少并发 bug 的首选方式？',['减少共享可变数据','到处加锁','使用更多线程'],0,''],
['同步区域内应避免？',['I/O 和外部调用','赋值','读取变量'],0,''],
['避免两把锁死锁的常用方法？',['固定的获取顺序','随机顺序','不释放锁'],0,''],
['有界队列提供了什么？',['背压','原子性','持久化'],0,'']]
