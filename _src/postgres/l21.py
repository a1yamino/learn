TITLE='连接池：PgBouncer';DESC='第 6 课的应用内连接池解决了单个实例的问题，但当有几十个服务、几百个实例或大量短生命周期的进程（无服务器函数、PHP）时，总连接数仍会失控。本课讲 PgBouncer 的三种池模式、事务模式下哪些功能不能用、关键配置参数、监控命令，以及部署位置的选择。';NEXT='性能调优：配置、监控与 pg_stat_statements';MIN=55
SUM=['PgBouncer 是一个轻量的单进程代理：客户端连到它（可以上万个），它只维护少量到 PostgreSQL 的服务端连接，并把客户端的请求分配到这些连接上。',
'<b>池模式</b>：<code>session</code> 客户端断开前独占一个服务端连接，兼容性最好但省不了连接；<code>transaction</code> 只在事务期间占用，事务结束立即归还，最常用；<code>statement</code> 每条语句归还，不允许多语句事务。',
'事务模式下，跨事务的会话状态不再可靠：<code>SET</code>（用 <code>SET LOCAL</code> 代替）、会话级咨询锁、<code>LISTEN</code>、<code>WITH HOLD</code> 游标、临时表都可能“串”到别的客户端。协议级预备语句从 PgBouncer 1.21 起可通过 <code>max_prepared_statements</code> 支持。',
'关键参数：<code>default_pool_size</code>（每个“用户+数据库”对的服务端连接数）、<code>max_client_conn</code>、<code>reserve_pool_size</code>、<code>server_idle_timeout</code>、<code>query_wait_timeout</code>（客户端排队等待的上限）。',
'用管理控制台 <code>psql -p 6432 pgbouncer</code> 执行 <code>SHOW POOLS</code>：<code>cl_waiting</code> 持续大于 0 而 <code>sv_idle</code> 为 0，说明池不够或有慢事务占着连接；同时检查 PostgreSQL 端是否已经饱和。',
'部署：放在数据库服务器旁（集中管理），或作为应用的 sidecar（减少一跳延迟，但每个 sidecar 各有池，总数要再算）。PgBouncer 是单线程的，单个进程约能处理几万 QPS，更多时运行多个进程（<code>so_reuseport</code>）。']
def secs(prac,E):
    return [
('事务池模式','几千个客户端共享几十个连接。','<div id="p1"></div>'),
('事务模式的陷阱','会话状态被带给了别人。','<div id="p2"></div>'),
('动手：这段代码能在事务模式下工作吗','应用通过 transaction 模式的 PgBouncer 连接。选择一段代码，看是否安全。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:70px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('相关命令','PgBouncer 管理控制台。','<div id="t4"></div>'),
('在你的电脑上练习','在 pgnet 网络中运行 PgBouncer，连接 pg 容器。',prac([
 ('写一个最小配置。','mkdir -p ~/pgb && cat > ~/pgb/pgbouncer.ini <<\'EOF\'\n[databases]\nshop = host=pg port=5432 dbname=shop\n[pgbouncer]\nlisten_addr = 0.0.0.0\nlisten_port = 6432\nauth_type = plain\nauth_file = /etc/pgbouncer/userlist.txt\npool_mode = transaction\ndefault_pool_size = 5\nmax_client_conn = 1000\nadmin_users = postgres\nEOF\necho \'"postgres" "pg"\' > ~/pgb/userlist.txt',''),
 ('启动 PgBouncer（社区镜像 edoburu/pgbouncer）。','docker run -d --name pgb --network pgnet -p 6432:6432 -v ~/pgb:/etc/pgbouncer edoburu/pgbouncer\ndocker exec -e PGPASSWORD=pg -u postgres pg psql -h pgb -p 6432 -d shop -c "SELECT 1"',' ?column?\n----------\n        1'),
 ('压测：100 个客户端。','docker exec -u postgres pg pgbench -i -s 10 shop\ndocker exec -e PGPASSWORD=pg -u postgres pg pgbench -h pgb -p 6432 -c 100 -j 4 -T 20 -S shop','number of clients: 100\n…\ntps = 18412.3 (without initial connection time)'),
 ('压测期间在 PostgreSQL 上看实际连接数。','docker exec -u postgres pg psql -c "SELECT count(*) FROM pg_stat_activity WHERE client_addr IS NOT NULL"',' count\n-------\n     5'),
 ('管理控制台：池状态。','docker exec -e PGPASSWORD=pg -u postgres pg psql -h pgb -p 6432 -d pgbouncer -c "SHOW POOLS"',' database |   user   | cl_active | cl_waiting | sv_active | sv_idle | sv_used | maxwait | pool_mode\n----------+----------+-----------+------------+-----------+---------+---------+---------+-------------\n shop     | postgres |       100 |         37 |         5 |       0 |       0 |       0 | transaction'),
 ('事务模式下 SET 的问题：两次查询可能落在不同的服务端连接上。','docker exec -e PGPASSWORD=pg -u postgres pg psql -h pgb -p 6432 -d shop -c "SET statement_timeout = \'1s\'" -c "SHOW statement_timeout"',' statement_timeout\n-------------------\n 0')],
 ('迁移一个服务到事务模式','一个 Python 服务目前直连 PostgreSQL，代码里有：连接建立后 <code>SET search_path = tenant_42</code>；用 <code>pg_advisory_lock</code> 保证定时任务单实例；用 <code>LISTEN orders_changed</code> 接收通知。要改为通过 transaction 模式的 PgBouncer 连接，逐项说明怎么改。',
 '<ul><li><b>search_path</b>：会话级 SET 会泄漏给共享同一服务端连接的其他客户端，也会在下一个事务中丢失。改为在每个事务开头 <code>SET LOCAL search_path = tenant_42</code>，或在 SQL 中写全限定名 <code>tenant_42.orders</code>，或为每个租户使用不同的角色并 <code>ALTER ROLE … SET search_path</code>（PgBouncer 按用户分池，每个池的连接都带着这个设置）。</li><li><b>咨询锁</b>：会话级锁在事务结束后服务端连接被别人拿走，锁仍然挂在那个连接上，释放时也可能发到别的连接。改为事务级 <code>pg_try_advisory_xact_lock</code>，并让整个任务（或其“领取”步骤）在一个事务中完成。</li><li><b>LISTEN</b>：需要一个长期保持的会话，事务模式下无法工作。为监听者单独建一个直连 PostgreSQL 的连接（或通过 session 模式的另一个 PgBouncer 池）。NOTIFY 可以照常通过事务池发送。</li></ul><p>另外检查：驱动是否使用协议级预备语句（psycopg 3 默认会在执行多次后自动 prepare，需 PgBouncer 1.21+ 并设置 <code>max_prepared_statements</code>，或在驱动中设 <code>prepare_threshold=None</code>）；临时表；<code>WITH HOLD</code> 游标。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
