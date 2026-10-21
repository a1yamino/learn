G=[('基础',['PostgreSQL 是什么：进程、连接与 psql','表、数据类型与约束','查询基础：连接、聚合与窗口函数','索引入门：什么时候用、怎么建','事务基础：ACID 与 BEGIN / COMMIT','从应用连接：驱动、参数化查询与连接池']),
('存储与日志',['存储：页、堆元组与 TOAST','WAL：预写日志与检查点','缓冲区与 I/O：shared_buffers 与操作系统缓存']),
('索引与查询',['B-tree 索引内部','GIN、GiST、BRIN 与表达式、部分索引','查询规划器与 EXPLAIN','统计信息、连接算法与慢查询']),
('并发',['事务隔离级别','MVCC：元组版本与快照可见性','VACUUM、autovacuum 与事务 ID 回卷','锁：行锁、表锁与死锁']),
('生产',['复制：流复制与逻辑复制','高可用与故障切换','分区表','连接池：PgBouncer','性能调优：配置、监控与 pg_stat_statements','备份与时间点恢复（PITR）','安全：角色、权限与行级安全','模式变更与在线迁移']),
('综合项目',['综合项目：一个生产级数据库从设计到运维'])]
import sys;LIVE=int(sys.argv[1]) if len(sys.argv)>1 else 0
items='';n=0
for g,ls in G:
    items+=f'<li class="grp">{g}</li>'
    for t in ls:
        n+=1;on=n<=LIVE
        items+=f'<li><a href="l{n:02d}.html"{"" if on else " class=\"off\""}><span class="n">{n:02d}</span><span><div class="t">{t}</div></span><span class="s">{"" if on else "未上线"}</span><span class="ar">→</span></a></li>'
head=open('/workspace/learn/docker/index.html').read().split('<main')[0].replace('Docker · 课程目录','PostgreSQL · 课程目录').replace('<span class="crumb">Docker</span>','<span class="crumb">PostgreSQL</span>')
open('/workspace/learn/postgres/index.html','w').write(head+f'<main class="wrap"><section class="lede"><div class="k">课程</div><h1>PostgreSQL</h1><p>{n} 节课，已全部完成：基础、存储与日志、索引与查询、并发、生产、综合项目。每课包含在 Docker 里的 PostgreSQL 上做的练习和一个挑战。</p></section>\n<ul class="list" style="border-top:0">{items}</ul><footer class="foot"><a href="../index.html">← 学习</a><span>代码 MIT · 内容 CC BY 4.0</span></footer></main><script src="../assets/play.js"></script></body></html>\n')
print(n)
