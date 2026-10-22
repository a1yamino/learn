G=[('基础',['Redis 是什么：内存数据库、单线程与许可证','基础数据类型与常用命令','从应用连接：客户端、连接池与 Pipeline']),
('内部原理',['数据结构编码：SDS、listpack、intset 与 quicklist','哈希表与渐进式 rehash、有序集合与跳表','事件循环、单线程与 I/O 线程','过期：惰性删除与定期删除','内存管理与淘汰策略','持久化：RDB 与 AOF']),
('进阶命令',['事务、Lua 脚本与 Functions','发布订阅与 Stream','位图、HyperLogLog 与地理位置']),
('高可用与扩展',['主从复制','Sentinel：自动故障切换','Cluster：槽、重定向与扩缩容']),
('缓存设计',['缓存模式：Cache-Aside 与读写策略','缓存一致性：更新数据库与删除缓存','缓存穿透、击穿与雪崩','热 key 与大 key','分布式锁','限流、排行榜与计数器']),
('生产',['安全：ACL、TLS 与危险命令','可观测性与调优：延迟、内存与慢日志']),
('综合项目',['综合项目：一个高并发商品服务的缓存层'])]
import sys;LIVE=int(sys.argv[1]) if len(sys.argv)>1 else 0
items='';n=0
for g,ls in G:
    items+=f'<li class="grp">{g}</li>'
    for t in ls:
        n+=1;on=n<=LIVE
        items+=f'<li><a href="l{n:02d}.html"{"" if on else " class=\"off\""}><span class="n">{n:02d}</span><span><div class="t">{t}</div></span><span class="s">{"" if on else "未上线"}</span><span class="ar">→</span></a></li>'
head=open('/workspace/learn/docker/index.html').read().split('<main')[0].replace('Docker · 课程目录','Redis · 课程目录').replace('<span class="crumb">Docker</span>','<span class="crumb">Redis</span>')
open('/workspace/learn/redis/index.html','w').write(head+f'<main class="wrap"><section class="lede"><div class="k">课程</div><h1>Redis</h1><p>{n} 节课，已全部完成：基础、内部原理、进阶命令、高可用与扩展、缓存设计、生产、综合项目。每课包含在 Docker 里的 Redis 上做的练习和一个挑战。</p></section>\n<ul class="list" style="border-top:0">{items}</ul><footer class="foot"><a href="../index.html">← 学习</a><span>代码 MIT · 内容 CC BY 4.0</span></footer></main><script src="../assets/play.js"></script></body></html>\n')
print(n)
