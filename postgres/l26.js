const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=140)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={app:B('应用 × 12','参数化 · 短事务 · 重试'),pgb:B('PgBouncer','transaction · 池 40','sig'),pr:B('主库','Patroni leader','ok'),s1:B('同步备库','AZ-b'),s2:B('异步备库','AZ-c · 报表'),dcs:B('etcd × 3','leader 锁','mute'),bk:B('pgBackRest 仓库','另一区域 · 对象锁定','sig',170),mon:B('监控','pg_stat_* · 日志 · 告警','mute',170),l1:P('第 6、21 课','mute'),l2:P('第 18、19 课','mute'),l3:P('第 23 课：全量 + 差异 + WAL 归档','mute'),l4:P('第 22 课','mute')};
const A={app:[0,0],pgb:[0,70],pr:[200,70]};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'应用到数据库',p:'所有实例通过 PgBouncer 事务池访问主库，数据库只看到 40 个服务端连接。',set:{...A,l1:[0,140]}},
 {t:'高可用',p:'Patroni 管理一主两备，同步模式保证切换不丢已提交事务。异步备库同时承担报表。',d:4000,set:{...A,s1:[360,30],s2:[360,110],dcs:[200,0],l2:[200,140]}},
 {t:'备份',p:'从备库做基础备份，WAL 连续归档到另一区域的仓库，凭据与生产隔离。每周自动恢复演练。',d:4000,set:{...A,s1:[360,30],s2:[360,110],dcs:[200,0],bk:[520,70],l3:[200,190]}},
 {t:'监控',p:'采集连接、等待事件、pg_stat_statements、复制延迟、事务 ID 年龄、磁盘和日志，配置告警。',d:3800,set:{...A,s1:[360,30],s2:[360,110],dcs:[200,0],bk:[520,70],mon:[520,0],l4:[520,140]}}]});
const TL=[['10:00','部署：CREATE INDEX（无 CONCURRENTLY）','sig'],['10:00','orders 写入全部阻塞（SHARE 锁）','bad'],['10:02','PgBouncer 池被占满，读接口也排队','bad'],['10:05','告警：p99 8 s','bad'],['10:12','pg_blocking_pids 指向迁移会话','sig'],['10:30','索引完成，自动恢复','ok']];
const e2={r:P('根因：热表上阻塞写入的 DDL · 放大：共享池被阻塞的写占满','sig')};TL.forEach(([t,s],i)=>e2['t'+i]=B(t,s,'',300));
const T=n=>{const o={};for(let i=0;i<n;i++)o['t'+i]=[(i%2)*320,Math.floor(i/2)*54,{cls:'blk '+TL[i][2]}];return o};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'触发',p:'迁移拿到 SHARE 锁：读不受影响，所有写入开始等待。',set:T(2)},
 {t:'扩散',p:'每个等待中的写请求占住一个服务端连接。几十秒后池满，所有请求排队。',d:3800,set:T(4)},
 {t:'定位',p:'看等待事件（Lock 激增）、用 pg_blocking_pids 找到源头——迁移会话。可以选择取消它（pg_cancel_backend）立即恢复，改天用 CONCURRENTLY 重做。',d:4200,set:T(5)},
 {t:'复盘',p:'没有人取消，索引建完后才恢复。复盘的重点不是“谁犯了错”，而是哪些防线缺失：DDL 审查、lock_timeout、超时与分池、监控。',d:4200,set:{...T(6),r:[0,170]}}]});
(()=>{const Q=[['磁盘使用率 1 小时内从 60% 涨到 85%',"1. SELECT pg_size_pretty(sum(size)) FROM pg_ls_waldir();  → pg_wal 380 GB\n2. SELECT * FROM pg_stat_archiver;  → failed_count 持续增长\n3. 归档目标的凭据过期 → 修复后归档追上，pg_wal 回落\n   （若是复制槽：pg_replication_slots 中 inactive 的槽）",'sig','先区分是数据增长还是 WAL 堆积。WAL 堆积的常见原因：归档失败、废弃的复制槽、max_wal_size 过大。第 8、18、23 课。'],
['某张表查询越来越慢，但计划没变',"1. pg_stat_user_tables：n_dead_tup 是 n_live_tup 的 3 倍，last_autovacuum 是 9 天前\n2. pg_stat_activity：一个 idle in transaction 会话已存在 9 天\n3. 终止它 → VACUUM 恢复工作；之后 pg_repack 回收膨胀\n4. 设置 idle_in_transaction_session_timeout",'sig','长事务阻挡了 xmin 视界。第 15、16 课。'],
['一条接口 SQL 突然从 2 ms 变成 2 s',"1. pg_stat_statements 确认是哪条语句\n2. EXPLAIN (ANALYZE, BUFFERS)：Nested Loop，外层估算 rows=3，实际 rows=180000\n3. pg_stats：刚导入了大批数据，统计信息过期 → ANALYZE 表\n4. 长期：对这张表调低 autovacuum_analyze_scale_factor；相关列加 CREATE STATISTICS",'sig','计划突变通常是估算问题。第 12、13 课。'],
['主库所在可用区断网',"1. Patroni：主库无法续约 → 自降只读；同步备库获得锁并提升（约 30 s）\n2. HAProxy 健康检查切换流量；应用连接断开后重连并重试事务\n3. 网络恢复后旧主库用 pg_rewind 重新加入为备库\n4. 复盘：检查切换期间的错误率和是否有数据丢失（同步模式应为 0）",'ok','第 19 课。'],
['运营误执行了 UPDATE orders SET status = \'cancelled\'（无 WHERE）',"1. 立刻确认时间点：14:02:11（审计日志 / pg_stat_statements / pg_waldump）\n2. pgBackRest PITR 到 14:02:10 的临时实例\n3. 从临时实例导出 (id, status)，在生产上按 id 回写 status（只回写在 14:02 之后没有被正常修改过的行）\n4. 收回运营账号的直接写权限，改为通过受控的后台操作",'ok','备份与权限。第 23、24 课。'],
['需要给 orders 加一个 NOT NULL 的 channel 列',"1. ADD COLUMN channel text DEFAULT 'web'（瞬间，旧行读取时得到默认值）\n2. 如需不同的历史值：分批回填\n3. ADD CONSTRAINT … CHECK (channel IS NOT NULL) NOT VALID; VALIDATE\n4. SET NOT NULL; DROP CONSTRAINT\n5. 每步 lock_timeout = 2s 并重试",'ok','第 25 课。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent=Q[i][1];m.className='msg '+Q[i][2];m.innerHTML=Q[i][3]});q.appendChild(b)});
 m.className='msg';m.innerHTML='订单服务上线一个月，架构如上。'})();
Term(document.getElementById('t4'),[
['SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname LIKE \'shop%\';',' rolname   | rolsuper | rolbypassrls\n-----------+----------+--------------\n shop_api  | f        | f\n shop_owner| f        | f\n shop_rw   | f        | f','应用角色不是超级用户、不能绕过 RLS（第 24 课）。'],
['SELECT name, setting FROM pg_settings WHERE name IN (\'shared_buffers\',\'work_mem\',\'max_wal_size\',\'random_page_cost\',\'log_min_duration_statement\',\'idle_in_transaction_session_timeout\');','…','基础配置已按服务器调整（第 9、22 课）。'],
['SELECT application_name, sync_state, replay_lag FROM pg_stat_replication;',' application_name | sync_state | replay_lag\n------------------+------------+------------\n node2            | sync       | 00:00:00.001\n node3            | async      | 00:00:00.010','复制健康，有同步备库（第 18、19 课）。'],
['pgbackrest --stanza=main check && pgbackrest --stanza=main info','…\nstatus: ok','归档和备份可用；最近一次恢复演练在 7 天内（第 23 课）。'],
['SELECT count(*) FROM pg_extension WHERE extname = \'pg_stat_statements\';',' count\n-------\n     1','查询统计已启用，监控与告警已配置（第 22 课）。'],
['SELECT datname, age(datfrozenxid) FROM pg_database ORDER BY 2 DESC LIMIT 1;',' datname |   age\n---------+---------\n shop2   | 1203344','事务 ID 年龄有监控和告警阈值（第 16 课）。']]);
Quiz(document.getElementById('qs'),[
['外键列 order_items.product_id 为什么要建索引？',['外键约束要求','删除或更新 products 时检查引用，以及按商品查订单','没有必要'],1,''],
['下单扣库存的正确写法？',['先 SELECT 后 UPDATE 写回','UPDATE … SET stock = stock - n WHERE stock >= n','SERIALIZABLE 且不重试'],1,''],
['热表上加索引应该用？',['CREATE INDEX','CREATE INDEX CONCURRENTLY','VACUUM FULL 后再建'],1,''],
['表膨胀且 VACUUM 报告 dead but not yet removable，先查？',['长事务与复制槽','shared_buffers','索引类型'],0,''],
['误删数据后最可靠的恢复方式？',['故障切换到备库','PITR 到误操作之前','重启'],1,''],
['优化应该首先针对？',['单次最慢的查询','总耗时最高的查询','最新上线的查询'],1,'']]);
