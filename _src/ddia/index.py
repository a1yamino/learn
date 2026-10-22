G=[('第一部分 · 数据系统基础', ['架构中的权衡：事务型与分析型、记录系统与派生数据', '非功能需求：以社交网络时间线为例', '可靠性、可扩展性与可维护性', '数据模型：关系、文档与规范化', '图模型、查询语言与事件溯源', '存储引擎：日志结构与 LSM 树', 'B 树、二级索引与内存数据库', '分析型存储：列存、向量化与物化视图', '编码格式：JSON、Protocol Buffers 与 Avro', '数据流的模式：数据库、服务、工作流与事件']), ('第二部分 · 分布式数据', ['单主复制', '复制延迟带来的问题与对策', '多主复制、同步引擎与冲突解决', '无主复制：Quorum 与并发写', '分片：按键范围、按哈希与热点', '再平衡、请求路由与二级索引', '事务与 ACID', '弱隔离级别：读已提交与快照隔离', '写偏斜、幻读与可串行化', '分布式事务：两阶段提交与精确一次', '分布式系统的麻烦：网络、超时与部分失效', '不可靠的时钟、进程暂停与多数决', '线性一致性', '逻辑时钟、ID 生成与共识']), ('第三部分 · 派生数据', ['批处理', '流处理', '流式系统的哲学：数据集成与正确性']), ('综合项目', ['综合项目：设计一个协作文档平台的数据架构'])]
import sys;LIVE=int(sys.argv[1]) if len(sys.argv)>1 else 0
items='';n=0
for g,ls in G:
    items+=f'<li class="grp">{g}</li>'
    for t in ls:
        n+=1;on=n<=LIVE
        items+=f'<li><a href="l{n:02d}.html"{"" if on else " class=\"off\""}><span class="n">{n:02d}</span><span><div class="t">{t}</div></span><span class="s">{"" if on else "未上线"}</span><span class="ar">→</span></a></li>'
head=open('/workspace/learn/docker/index.html').read().split('<main')[0].replace('Docker · 课程目录','DDIA · 课程目录').replace('<span class="crumb">Docker</span>','<span class="crumb">DDIA</span>')
open('/workspace/learn/ddia/index.html','w').write(head+f'<main class="wrap"><section class="lede"><div class="k">课程</div><h1>DDIA</h1><p>{n} 节课，已全部完成：数据系统基础、分布式数据、派生数据、综合项目。内容依照《数据密集型应用系统设计》第 2 版（Kleppmann 与 Riccomini）的章节结构，用原创讲解、动画和在 Docker 里的 PostgreSQL、Redis、Kafka 与 Python 脚本上的练习讲清每个概念。</p></section>\n<ul class="list" style="border-top:0">{items}</ul><footer class="foot"><a href="../index.html">← 学习</a><span>代码 MIT · 内容 CC BY 4.0</span></footer></main><script src="../assets/play.js"></script></body></html>\n')
print(n)
