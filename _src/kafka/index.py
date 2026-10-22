G=[('基础',['Kafka 是什么：日志、主题与分区','动手：命令行工具与第一个主题']),
('存储与生产',['日志存储：分区、段与索引','生产者：发送流程、分区器与批处理','生产者可靠性：acks、重试与幂等']),
('消费',['消费者与消费者组','再平衡：协议、分配策略与 KIP-848','位移：提交、重置与交付语义']),
('集群内部',['复制：Leader、ISR 与高水位','KRaft：控制器与元数据日志','事务与精确一次','保留策略与日志压缩']),
('生态',['序列化与 Schema Registry','Kafka Connect','Kafka Streams：拓扑与无状态处理','Kafka Streams：状态、窗口与连接']),
('生产运维',['性能调优：零拷贝、页缓存与批量','监控与消费延迟','安全：TLS、SASL 与 ACL','运维：分区重分配、扩容与升级']),
('设计模式',['Outbox 模式与 CDC','事件溯源与 CQRS','错误处理：重试主题与死信队列']),
('综合项目',['综合项目：一个订单事件平台'])]
import sys;LIVE=int(sys.argv[1]) if len(sys.argv)>1 else 0
items='';n=0
for g,ls in G:
    items+=f'<li class="grp">{g}</li>'
    for t in ls:
        n+=1;on=n<=LIVE
        items+=f'<li><a href="l{n:02d}.html"{"" if on else " class=\"off\""}><span class="n">{n:02d}</span><span><div class="t">{t}</div></span><span class="s">{"" if on else "未上线"}</span><span class="ar">→</span></a></li>'
head=open('/workspace/learn/docker/index.html').read().split('<main')[0].replace('Docker · 课程目录','Kafka · 课程目录').replace('<span class="crumb">Docker</span>','<span class="crumb">Kafka</span>')
open('/workspace/learn/kafka/index.html','w').write(head+f'<main class="wrap"><section class="lede"><div class="k">课程</div><h1>Kafka</h1><p>{n} 节课：基础、存储与生产、消费、集群内部、生态、生产运维、设计模式、综合项目。每课包含在 Docker 里的 Kafka 上做的练习和一个挑战。</p></section>\n<ul class="list" style="border-top:0">{items}</ul><footer class="foot"><a href="../index.html">← 学习</a><span>代码 MIT · 内容 CC BY 4.0</span></footer></main><script src="../assets/play.js"></script></body></html>\n')
print(n)
