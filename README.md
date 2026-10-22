# 学习

互动技术课程，中文。 / Interactive tech courses in Chinese.

网址 / Site：https://a1yamino.github.io/learn/

## 课程 / Courses

| 课程 | 适合人群 | 状态 |
|---|---|---|
| [Docker](https://a1yamino.github.io/learn/docker/) | 初级后端工程师 | 已完成（25 课） |
| [Kubernetes](https://a1yamino.github.io/learn/k8s/) | 学完 Docker 的工程师 | 已完成（27 课） |
| [PostgreSQL](https://a1yamino.github.io/learn/postgres/) | 初级后端工程师 | 已完成（26 课） |
| [Redis](https://a1yamino.github.io/learn/redis/) | 初级后端工程师 | 已完成（24 课） |
| [Kafka](https://a1yamino.github.io/learn/kafka/) | 初级后端工程师 | 已完成（24 课） |
| [DDIA：数据密集型应用设计](https://a1yamino.github.io/learn/ddia/) | 有一定经验的后端工程师 | 已完成（28 课） |
| [Clean Code：代码整洁之道](https://a1yamino.github.io/learn/cleancode/) | 写过一段时间代码的开发者 | 更新中（20 课） |

### Docker 课程大纲
基础：1 为什么需要 Docker · 2 容器生命周期与核心命令 · 3 Dockerfile 与构建缓存 · 4 实战：把后端 API 打包成镜像 · 5 多阶段构建与镜像瘦身 · 6 数据卷与持久化 · 7 网络与端口映射 · 8 Docker Compose 入门 · 9 配置、环境变量与密钥 · 10 镜像仓库、标签与推送

原理：11 namespace · 12 cgroups · 13 OverlayFS 和 OCI 镜像规范 · 14 runc、containerd 与 Docker Engine · 15 bridge、veth、iptables 与 DNS · 16 存储驱动与数据卷原理

进阶与生产：17 BuildKit · 18 Compose 深入 · 19 安全一：rootless、capabilities、seccomp · 20 安全二：镜像扫描、SBOM 与签名 · 21 性能与资源调优 · 22 生产排障 · 23 CI/CD · 24 overlay 网络与 Swarm 简介

综合项目：25 从零到生产

### Kubernetes 课程大纲
基础：1 为什么需要 Kubernetes · 2 本地集群与 kubectl · 3 Pod · 4 Deployment：滚动更新与回滚 · 5 Service · 6 ConfigMap 与 Secret · 7 存储：PV、PVC 与 StorageClass · 8 Ingress 与 Gateway API · 9 健康检查、资源请求与限制 · 10 命名空间、标签与 kubectl 进阶

原理：11 控制平面 · 12 声明式 API 与控制循环 · 13 kubelet、CRI 与 Pod 的一生 · 14 集群网络：CNI、kube-proxy 与 DNS · 15 调度深入 · 16 存储原理：CSI

工作负载与扩展：17 StatefulSet、DaemonSet、Job 与 CronJob · 18 自动扩缩容 · 19 CRD 与 Operator

生产：20 安全一：RBAC · 21 安全二：Pod Security、NetworkPolicy 与准入控制 · 22 Helm 与 Kustomize · 23 GitOps 与 CI/CD · 24 可观测性 · 25 生产排障 · 26 高可用、升级与备份

综合项目：27 从零到生产

### PostgreSQL 课程大纲
基础：1 PostgreSQL 是什么：进程、连接与 psql · 2 表、数据类型与约束 · 3 查询基础：连接、聚合与窗口函数 · 4 索引入门：什么时候用、怎么建 · 5 事务基础：ACID 与 BEGIN / COMMIT · 6 从应用连接：驱动、参数化查询与连接池

存储与日志：7 存储：页、堆元组与 TOAST · 8 WAL：预写日志与检查点 · 9 缓冲区与 I/O：shared_buffers 与操作系统缓存

索引与查询：10 B-tree 索引内部 · 11 GIN、GiST、BRIN 与表达式、部分索引 · 12 查询规划器与 EXPLAIN · 13 统计信息、连接算法与慢查询

并发：14 事务隔离级别 · 15 MVCC：元组版本与快照可见性 · 16 VACUUM、autovacuum 与事务 ID 回卷 · 17 锁：行锁、表锁与死锁

生产：18 复制：流复制与逻辑复制 · 19 高可用与故障切换 · 20 分区表 · 21 连接池：PgBouncer · 22 性能调优：配置、监控与 pg_stat_statements · 23 备份与时间点恢复（PITR） · 24 安全：角色、权限与行级安全 · 25 模式变更与在线迁移

综合项目：26 综合项目：一个生产级数据库从设计到运维

### Redis 课程大纲
基础：1 Redis 是什么：内存数据库、单线程与许可证 · 2 基础数据类型与常用命令 · 3 从应用连接：客户端、连接池与 Pipeline

内部原理：4 数据结构编码：SDS、listpack、intset 与 quicklist · 5 哈希表与渐进式 rehash、有序集合与跳表 · 6 事件循环、单线程与 I/O 线程 · 7 过期：惰性删除与定期删除 · 8 内存管理与淘汰策略 · 9 持久化：RDB 与 AOF

进阶命令：10 事务、Lua 脚本与 Functions · 11 发布订阅与 Stream · 12 位图、HyperLogLog 与地理位置

高可用与扩展：13 主从复制 · 14 Sentinel：自动故障切换 · 15 Cluster：槽、重定向与扩缩容

缓存设计：16 缓存模式：Cache-Aside 与读写策略 · 17 缓存一致性：更新数据库与删除缓存 · 18 缓存穿透、击穿与雪崩 · 19 热 key 与大 key · 20 分布式锁 · 21 限流、排行榜与计数器

生产：22 安全：ACL、TLS 与危险命令 · 23 可观测性与调优：延迟、内存与慢日志

综合项目：24 综合项目：一个高并发商品服务的缓存层

### Kafka 课程大纲
基础：1 Kafka 是什么：日志、主题与分区 · 2 动手：命令行工具与第一个主题

存储与生产：3 日志存储：分区、段与索引 · 4 生产者：发送流程、分区器与批处理 · 5 生产者可靠性：acks、重试与幂等

消费：6 消费者与消费者组 · 7 再平衡：协议、分配策略与 KIP-848 · 8 位移：提交、重置与交付语义

集群内部：9 复制：Leader、ISR 与高水位 · 10 KRaft：控制器与元数据日志 · 11 事务与精确一次 · 12 保留策略与日志压缩

生态：13 序列化与 Schema Registry · 14 Kafka Connect · 15 Kafka Streams：拓扑与无状态处理 · 16 Kafka Streams：状态、窗口与连接

生产运维：17 性能调优：零拷贝、页缓存与批量 · 18 监控与消费延迟 · 19 安全：TLS、SASL 与 ACL · 20 运维：分区重分配、扩容与升级

设计模式：21 Outbox 模式与 CDC · 22 事件溯源与 CQRS · 23 错误处理：重试主题与死信队列

综合项目：24 综合项目：一个订单事件平台


### DDIA 课程大纲
依照《Designing Data-Intensive Applications》第 2 版（Martin Kleppmann、Chris Riccomini，2026）的章节结构，内容为原创讲解。

第一部分 · 数据系统基础：1 架构中的权衡：事务型与分析型、记录系统与派生数据 · 2 非功能需求：以社交网络时间线为例 · 3 可靠性、可扩展性与可维护性 · 4 数据模型：关系、文档与规范化 · 5 图模型、查询语言与事件溯源 · 6 存储引擎：日志结构与 LSM 树 · 7 B 树、二级索引与内存数据库 · 8 分析型存储：列存、向量化与物化视图 · 9 编码格式：JSON、Protocol Buffers 与 Avro · 10 数据流的模式：数据库、服务、工作流与事件

第二部分 · 分布式数据：11 单主复制 · 12 复制延迟带来的问题与对策 · 13 多主复制、同步引擎与冲突解决 · 14 无主复制：Quorum 与并发写 · 15 分片：按键范围、按哈希与热点 · 16 再平衡、请求路由与二级索引 · 17 事务与 ACID · 18 弱隔离级别：读已提交与快照隔离 · 19 写偏斜、幻读与可串行化 · 20 分布式事务：两阶段提交与精确一次 · 21 分布式系统的麻烦：网络、超时与部分失效 · 22 不可靠的时钟、进程暂停与多数决 · 23 线性一致性 · 24 逻辑时钟、ID 生成与共识

第三部分 · 派生数据：25 批处理 · 26 流处理 · 27 流式系统的哲学：数据集成与正确性

综合项目：28 综合项目：设计一个协作文档平台的数据架构

### Clean Code 课程大纲
依照《代码整洁之道》（Robert C. Martin）的主要思想，内容为原创讲解，示例使用 Python。

第一部分 · 代码的基本单位：1 为什么要写整洁的代码：混乱的代价与童子军规则 · 2 有意义的命名 · 3 函数：短小、只做一件事、一个抽象层级 · 4 函数参数、副作用与命令查询分离 · 5 注释：何时该写，何时该删 · 6 格式：垂直与水平的排版

第二部分 · 设计：7 对象与数据结构：数据抽象与迪米特法则 · 8 错误处理：异常、上下文与不返回 None · 9 边界：包装第三方代码 · 10 单元测试与 TDD：整洁的测试 · 11 类：单一职责与内聚 · 12 SOLID：开闭、里氏替换、接口隔离与依赖倒置 · 13 系统：关注点分离与依赖注入 · 14 简单设计四规则与涌现式设计

第三部分 · 重构：15 代码坏味道（上）：命名、函数与重复 · 16 代码坏味道（下）：类、耦合与启发式 · 17 重构手法：提取、内联、移动与以多态取代条件 · 18 遗留代码：特征测试与接缝 · 19 并发代码的整洁

综合项目：20 综合项目：一步步重构一个混乱的订单模块

## 每一课都有 / What's in each lesson
- 讲解和自动播放的图解动画
- 少量动手操作（只在动手比看更容易理解的地方）
- 在自己电脑上做的练习（附预期输出）和一个挑战
- 自测题和小结

## 项目结构 / Structure
```
index.html        学习中心首页 / hub
assets/           所有课程共享的样式与脚本 / shared CSS & JS
docker/           Docker 课程（index.html + lNN.html）
k8s/              Kubernetes 课程
postgres/         PostgreSQL 课程
redis/            Redis 课程
kafka/            Kafka 课程
ddia/             DDIA 课程
cleancode/        Clean Code 课程
_src/             课程生成器源文件 / generator sources
```
纯静态 HTML，无需构建；克隆后直接用浏览器打开 `index.html` 即可。
*Pure static HTML, no build step.*

## 许可 / License
- 代码 / Code：[MIT](LICENSE)
- 课程内容 / Content：[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

欢迎 Issue 和 PR！ / Issues and PRs welcome!
