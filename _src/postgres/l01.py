TITLE='PostgreSQL 是什么：进程、连接与 psql';DESC='本课程从使用者走到内部原理：存储、日志、索引、规划器、事务与 MVCC，再到复制、调优和备份。第一课先建立整体模型：PostgreSQL 是由多个进程组成的服务器，每个客户端连接对应一个后端进程，一条 SQL 要经过解析、改写、规划、执行四步。然后用 Docker 启动一个 PostgreSQL，熟悉 psql。';NEXT='表、数据类型与约束';MIN=45
SUM=['PostgreSQL 是客户端/服务器架构。主进程 <b>postmaster</b> 监听端口，每来一个连接就 fork 一个<b>后端进程</b>专门为它服务，连接断开进程退出。',
'所以连接是昂贵的：每个连接一个进程、几 MB 内存，<code>max_connections</code> 默认 100。应用应该用连接池，而不是每个请求新建连接（第 6、21 课）。',
'后台进程各司其职：checkpointer 和 background writer 把脏页写回磁盘、walwriter 写日志、autovacuum 清理旧版本、WAL sender 负责复制。它们和后端进程通过<b>共享内存</b>（shared_buffers 等）协作。',
'一条 SQL 的路径：<b>解析</b>（语法树）→ <b>分析与改写</b>（解析名字、展开视图）→ <b>规划</b>（选择执行计划，第 12 课）→ <b>执行</b>（读写共享缓冲区中的数据页）。',
'层级：一个实例（cluster）包含多个数据库；数据库包含多个 schema（默认 public）；schema 包含表、索引、函数等。连接时只能选择一个数据库。',
'psql 常用元命令：<code>\\l</code> 数据库、<code>\\dt</code> 表、<code>\\d 表名</code> 结构、<code>\\x</code> 竖排显示、<code>\\timing</code> 计时、<code>\\e</code> 编辑器、<code>\\?</code> 帮助。']
def secs(prac,E):
    return [
('进程模型','一个 PostgreSQL 实例里运行着哪些进程。','<div id="p1"></div>'),
('一条 SQL 的旅程','从字符串到结果集。','<div id="p2"></div>'),
('动手：连接就是进程','服务器 <code>max_connections = 6</code>（为了演示调小了，其中 1 个保留给超级用户）。打开和关闭连接，看服务器上的进程和内存。','<div class="chal"><div class="cmds" id="cn"></div><div id="cp"></div><div class="msg" id="cm"></div></div>'),
('psql 常用命令','在 psql 里查看服务器和对象。','<div id="t4"></div>'),
('在你的电脑上练习','需要已安装 Docker（见 Docker 课程第 2 课）。整个课程都使用这个容器。',prac([
 ('启动 PostgreSQL 18，数据放在命名卷里。','docker run -d --name pg -e POSTGRES_PASSWORD=pg -p 5432:5432 -v pgdata:/var/lib/postgresql postgres:18\ndocker logs pg 2>&1 | tail -1','2026-10-21 15:58:02.114 UTC [1] LOG:  database system is ready to accept connections'),
 ('用容器里的 psql 连接。','docker exec -it pg psql -U postgres','psql (18.0 (Debian 18.0-1.pgdg13+3))\nType "help" for help.\n\npostgres=#'),
 ('在 psql 中查看版本、当前数据库和后端进程号。','SELECT version();\nSELECT current_database(), current_user, pg_backend_pid();','                     version\n-----------------------------------------------------------------\n PostgreSQL 18.0 (Debian 18.0-1.pgdg13+3) on x86_64-pc-linux-gnu, …\n\n current_database | current_user | pg_backend_pid\n------------------+--------------+----------------\n postgres         | postgres     |             68'),
 ('另开一个终端，在容器里看进程。你的 psql 对应其中一个 postgres 进程。','docker exec pg ps -o pid,cmd -u postgres','  PID CMD\n    1 postgres\n   27 postgres: io worker 0\n   28 postgres: io worker 1\n   29 postgres: io worker 2\n   30 postgres: checkpointer\n   31 postgres: background writer\n   33 postgres: walwriter\n   34 postgres: autovacuum launcher\n   35 postgres: logical replication launcher\n   68 postgres: postgres postgres [local] idle'),
 ('从数据库内部看所有进程（回到 psql）。','SELECT pid, backend_type, state FROM pg_stat_activity ORDER BY pid;',' pid |         backend_type         | state\n-----+------------------------------+--------\n  27 | io worker                    |\n  30 | checkpointer                 |\n  31 | background writer            |\n  33 | walwriter                    |\n  34 | autovacuum launcher          |\n  35 | logical replication launcher |\n  68 | client backend               | active\n…'),
 ('创建本课程使用的数据库，并切换过去。','CREATE DATABASE shop;\n\\c shop\n\\conninfo','CREATE DATABASE\nYou are now connected to database "shop" as user "postgres".\nYou are connected to database "shop" as user "postgres" via socket in "/var/run/postgresql" at port "5432".')],
 ('连接用完了会怎样','在 psql 中执行 <code>ALTER SYSTEM SET max_connections = 5;</code> 并重启容器，然后用一个 shell 循环在后台打开 6 个连接（每个执行 <code>SELECT pg_sleep(60)</code>）。哪些连接会失败、看到什么错误？为什么超级用户此时仍然可以连接？最后恢复设置。',
 '<pre class="cmd">docker exec pg psql -U postgres -c "ALTER SYSTEM SET max_connections = 5"\ndocker restart pg\nfor i in 1 2 3 4 5 6; do\n  docker exec -e PGPASSWORD=pg pg psql -h 127.0.0.1 -U app -d shop -c "SELECT pg_sleep(60)" &amp;\ndone</pre><pre class="out">psql: error: connection to server at "127.0.0.1", port 5432 failed: FATAL:  remaining connection slots are reserved for roles with the SUPERUSER attribute</pre><p>（先用 <code>CREATE ROLE app LOGIN PASSWORD \'pg\'; GRANT CONNECT ON DATABASE shop TO app;</code> 创建一个普通用户。）<code>superuser_reserved_connections</code> 默认 3，max_connections=5 时普通用户只能用 2 个，所以第 3 个起就被拒绝；超级用户还能用保留的连接登录进来排查和终止会话（<code>pg_terminate_backend</code>）。这个参数需要重启才能生效，因为共享内存按最大连接数分配。恢复：<code>ALTER SYSTEM RESET max_connections;</code> 后再次重启。生产中连接耗尽的正确解决方式是连接池，而不是无限调大。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
