TITLE='从应用连接：驱动、参数化查询与连接池';DESC='后端代码通过驱动和数据库对话。本课讲连接字符串、参数化查询为什么能防 SQL 注入、预备语句、应用侧连接池的大小怎么定，以及超时和错误重试这些上线前必须想清楚的事。示例用 Python（psycopg 3），概念适用于任何语言。';NEXT='存储：页、堆元组与 TOAST';MIN=55
SUM=['连接字符串 <code>postgresql://user:pass@host:5432/db?sslmode=require&amp;application_name=api</code>。设置 <code>application_name</code>，在 <code>pg_stat_activity</code> 里能认出是哪个服务。',
'<b>永远用参数化查询</b>：SQL 文本和参数分开发送（扩展查询协议的 Parse/Bind），参数不会被当作 SQL 解析，从根本上杜绝 SQL 注入。不要用字符串拼接或格式化拼 SQL。表名、列名不能参数化，用白名单或 <code>psycopg.sql.Identifier</code>。',
'每个连接是一个后端进程（第 1 课），建立连接要几毫秒并占用数 MB 内存。应用用<b>连接池</b>复用连接；池大小通常从 <code>核数 × 2</code> 量级起步，所有实例的池加起来不能超过 <code>max_connections</code>。',
'池不是越大越好：并发执行的查询超过 CPU 和磁盘能承受的数量后，吞吐不升反降，延迟变长。等待连接的请求应在池中排队并有超时。',
'设置超时：<code>connect_timeout</code>、<code>statement_timeout</code>（单条语句）、<code>lock_timeout</code>、<code>idle_in_transaction_session_timeout</code>。没有超时的查询可能拖垮整个池。',
'只重试明确可重试的错误：连接断开、<code>40001 serialization_failure</code>、<code>40P01 deadlock_detected</code>；重试整个事务而不是单条语句。唯一约束冲突 <code>23505</code> 之类是业务错误，不要重试。']
def secs(prac,E):
    return [
('参数化查询与 SQL 注入','拼接字符串和发送参数的区别。','<div id="p1"></div>'),
('连接池','连接的复用与池大小。','<div id="p2"></div>'),
('动手：池应该多大','数据库服务器 8 核，max_connections = 100。选择一种配置，看在高峰期会发生什么。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:70px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('相关命令','观察来自应用的连接。','<div id="t4"></div>'),
('在你的电脑上练习','安装 Python 驱动：<code>pip install "psycopg[binary,pool]"</code>。数据库沿用 shop。',prac([
 ('连接并查询。','python3 - <<\'PY\'\nimport psycopg\nwith psycopg.connect("postgresql://postgres:pg@localhost:5432/shop?application_name=demo") as conn:\n    print(conn.execute("SELECT version()").fetchone()[0][:20])\nPY','PostgreSQL 18.0 on x'),
 ('拼接字符串：注入成功，返回了所有用户。','python3 - <<\'PY\'\nimport psycopg\nconn = psycopg.connect("postgresql://postgres:pg@localhost/shop")\nname = "x\' OR \'1\'=\'1"\nrows = conn.execute(f"SELECT id, name FROM users WHERE name = \'{name}\'").fetchall()\nprint(len(rows))\nPY','1000'),
 ('参数化：同样的输入只是一个普通字符串。','python3 - <<\'PY\'\nimport psycopg\nconn = psycopg.connect("postgresql://postgres:pg@localhost/shop")\nname = "x\' OR \'1\'=\'1"\nrows = conn.execute("SELECT id, name FROM users WHERE name = %s", (name,)).fetchall()\nprint(len(rows))\nPY','0'),
 ('事务：with 块正常结束时提交，抛出异常时回滚。','python3 - <<\'PY\'\nimport psycopg\nwith psycopg.connect("postgresql://postgres:pg@localhost/shop") as conn:\n    with conn.transaction():\n        conn.execute("UPDATE accounts SET balance = balance - 30 WHERE name = %s", ("A",))\n        conn.execute("UPDATE accounts SET balance = balance + 30 WHERE name = %s", ("B",))\n    print(conn.execute("SELECT name, balance FROM accounts ORDER BY 1").fetchall())\nPY','[(\'A\', 70), (\'B\', 140)]'),
 ('连接池：10 个线程共用 4 个连接。','python3 - <<\'PY\'\nfrom psycopg_pool import ConnectionPool\nfrom concurrent.futures import ThreadPoolExecutor\npool = ConnectionPool("postgresql://postgres:pg@localhost/shop?application_name=pooldemo", min_size=4, max_size=4, timeout=5)\ndef work(i):\n    with pool.connection() as c:\n        return c.execute("SELECT pg_backend_pid(), pg_sleep(0.2)").fetchone()[0]\nwith ThreadPoolExecutor(10) as ex:\n    print(sorted(set(ex.map(work, range(20)))))\npool.close()\nPY','[1904, 1905, 1906, 1907]'),
 ('语句超时。','python3 - <<\'PY\'\nimport psycopg\nconn = psycopg.connect("postgresql://postgres:pg@localhost/shop", options="-c statement_timeout=1000")\ntry:\n    conn.execute("SELECT pg_sleep(3)")\nexcept psycopg.errors.QueryCanceled as e:\n    print(type(e).__name__, e.sqlstate)\nPY','QueryCanceled 57014')],
 ('写一个带重试的事务函数','写一个 Python 函数 <code>run_tx(pool, fn)</code>：从池中取连接，在事务中执行 <code>fn(conn)</code>；遇到序列化失败（40001）或死锁（40P01）时最多重试 3 次，每次退避随机时间；其他错误直接抛出。',
 '<pre class="cmd">import random, time, psycopg\nRETRY = {"40001", "40P01"}\ndef run_tx(pool, fn, attempts=3):\n    for i in range(attempts):\n        try:\n            with pool.connection() as conn:\n                with conn.transaction():\n                    return fn(conn)\n        except psycopg.Error as e:\n            if e.sqlstate not in RETRY or i == attempts - 1:\n                raise\n            time.sleep(random.uniform(0, 0.05 * 2 ** i))</pre><p>重试的单位是整个事务：<code>conn.transaction()</code> 在异常时已经回滚，重新调用 <code>fn</code> 会基于最新数据重新执行全部语句。随机退避避免冲突的事务同时重试再次冲突。只重试这两类错误，是因为它们表示“换个时机再做一次就可能成功”；唯一约束冲突、检查约束失败重试也不会变。<code>fn</code> 里不要有发邮件、调用外部接口这类不能重复的副作用。连接在 with 结束时归还给池，异常时也一样。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
