# 学习：中文互动技术课程

面向开发者的技术课程，从常用命令和具体问题出发，逐步解释底层原理、设计取舍和生产实践。课程配有分步图解、交互模拟、终端示例、练习和自测，覆盖容器、数据库、消息系统、代码设计与编码 agent 源码。

**[进入学习中心](https://a1yamino.github.io/learn/)** · [选择课程](#课程与进度) · [学习路线](#建议的学习路线) · [本地阅读](#本地阅读) · [课程大纲](#完整课程大纲)

## 课程与进度

下表按课程目录中已开放的入口统计。“已发布”表示课件可阅读，不代表所有命令都适用于任意版本或生产环境。

| 课程 | 重点 | 建议基础 | 课数与状态 |
|---|---|---|---|
| [Docker](https://a1yamino.github.io/learn/docker/) | 镜像、容器、Compose、Linux 原理与交付 | 能使用终端，了解一个后端服务如何运行 | 25 / 25 |
| [Kubernetes](https://a1yamino.github.io/learn/k8s/) | 声明式 API、工作负载、网络、存储与集群运维 | Docker 基础、端口与网络基本概念 | 27 / 27 |
| [PostgreSQL](https://a1yamino.github.io/learn/postgres/) | SQL、索引、事务、MVCC、复制与恢复 | 基本 SQL；练习使用 Docker | 26 / 26 |
| [Redis](https://a1yamino.github.io/learn/redis/) | 数据结构、持久化、复制、缓存一致性 | 后端开发基础，了解数据库与缓存的区别 | 24 / 24 |
| [Kafka](https://a1yamino.github.io/learn/kafka/) | 分区日志、消费、复制、事务与事件驱动 | 后端开发基础；部分例子使用 Java | 24 / 24 |
| [DDIA：数据密集型应用设计](https://a1yamino.github.io/learn/ddia/) | 数据模型、分布式故障、一致性与系统权衡 | 使用过数据库，能阅读简单 Python / SQL | 28 / 28 |
| [Clean Code：代码整洁之道](https://a1yamino.github.io/learn/cleancode/) | 命名、函数、错误处理、测试与设计原则 | 写过代码；练习使用 Python 3.10+ | 20 / 20 |
| [pi 源码精读：编码 agent 的内核](https://a1yamino.github.io/learn/pi/) | 模型适配、agent 循环、工具、上下文与扩展 | TypeScript / Node.js 基础，能阅读异步代码 | 20 / 20 |

目前共开放 **194 课**，以各课程目录的入口状态为准。

## 建议的学习路线

不必按顺序学完所有课程，按当前要解决的问题选择：

- **把服务部署起来**：Docker → Kubernetes。先掌握镜像、持久化与网络，再理解集群中的声明式管理。
- **理解后端数据系统**：PostgreSQL → Redis → Kafka。分别建立持久数据、缓存和事件流的模型；已有相关经验可直接进入需要的课程。
- **做架构取舍**：有数据库实践后学习 DDIA，并结合 PostgreSQL、Redis、Kafka 的具体实现验证概念。
- **理解编码 agent**：具备 TypeScript / Node.js 基础后学习 pi 源码精读。按课件固定的源码提交阅读，避免把其他版本的实现混入分析。
- **改进日常代码**：Clean Code 可以独立学习。将原则视为需要权衡的工具，通过重构前后的行为验证理解它们。

每门课程内部按课号渐进展开。中间章节可能沿用前课的容器、数据表或项目文件；跳读前先检查练习前提和清理步骤。

## 怎样使用一课

1. 阅读开头的目标，先理解本课要解释的问题。
2. 观看分步图解、操作交互模拟，预测下一步会发生什么。
3. 在独立练习目录和实验环境执行命令，对照预期结果；容器 ID、耗时、日志和漏洞数量可能不同。
4. 完成挑战后再看参考答案，用自测和小结检查理解。

页面中的动画、交互状态和可点击终端是**教学模拟或示例输出**，不会操作你的 Docker、数据库或集群。要验证真实行为，需要执行“在你的电脑上练习”中的步骤。

综合项目需要自行实现课件要求的应用、配置与验收项，不是下载后即可部署的成品。生产实践还需结合具体版本、负载、故障模型和恢复演练验证。

## 本地阅读

课件是静态 HTML、CSS 和 JavaScript，**阅读无需构建或安装前端依赖**。

```bash
git clone https://github.com/a1yamino/learn.git
cd learn
python3 -m http.server 8000 --bind 127.0.0.1
```

在浏览器打开 [本地学习中心](http://127.0.0.1:8000/)。完成后在终端按 `Ctrl+C` 停止服务。也可以直接用浏览器打开根目录的 `index.html`。

执行课程练习需要另外准备环境：

- Shell 示例默认按 **Bash** 编写；Windows 可使用 WSL，或连接 Linux 实验机。
- 容器相关练习需要 Docker Desktop 或 Docker Engine；Compose 示例使用 `docker compose`。
- namespace、宿主机网络、防火墙、运行时等实验需要具有相应权限的 Linux 环境。Docker Desktop 能运行容器，不代表桌面系统或任意工具容器可以直接执行所有宿主机命令。
- 其他运行时、客户端和集群依赖按各课要求安装。清理命令会删除相应实验资源，请使用专用环境，避免与已有项目重名。

## 项目结构与内容维护

```text
index.html       学习中心入口
assets/          课程共用样式和交互脚本
docker/          Docker 目录页、逐课 HTML 与 JavaScript
k8s/             Kubernetes 课件
postgres/        PostgreSQL 课件
redis/           Redis 课件
kafka/           Kafka 课件
ddia/            DDIA 课件
cleancode/       Clean Code 课件
pi/              pi 源码精读课件
_src/            部分课程的 Python 生成源、输出记录与辅助脚本
```

阅读时以各课程目录和 `lNN.html` / `lNN.js` 为入口。教学内容既在 HTML 正文中，也在 JavaScript 的图解、示例输出和自测解释中。

修改内容时：

- 有对应 `_src/<课程>/lNN.py` 的章节，应同步源文件与发布课件，避免下次生成时覆盖修正。
- `_src/` 中部分脚本依赖作者原环境的 `/workspace/...` 路径或未随仓库提供的工具，不能直接当作通用本地构建命令；其中的发布脚本也不是阅读所需步骤。
- 检查同一概念在正文、互动、自测和后续章节中是否一致；修正练习时核对前提、命令、预期结果与清理步骤。
- 更新发布进度时，同时检查课程目录、学习中心与本 README。

## 反馈与贡献

发现问题可[提交 Issue](https://github.com/a1yamino/learn/issues)，注明课程、课号、所在小节，以及问题或复现步骤。命令问题请附工具版本、操作系统与实际输出；概念问题尽量提供官方文档或可复现反例。

欢迎提交内容修订 PR。单章问题尽量独立提交，说明它怎样影响理解或操作、修改后的行为，以及做了哪些验证。跨章的环境依赖或课程结构调整，请列出受影响章节。没有执行过的实验应明确标注，避免把静态检查写成已运行通过。

## 完整课程大纲

各课程页面提供逐课入口；下面保留完整主题索引，便于判断学习范围。

<details>
<summary>Docker 课程大纲</summary>

基础：1 为什么需要 Docker · 2 容器生命周期与核心命令 · 3 Dockerfile 与构建缓存 · 4 实战：把后端 API 打包成镜像 · 5 多阶段构建与镜像瘦身 · 6 数据卷与持久化 · 7 网络与端口映射 · 8 Docker Compose 入门 · 9 配置、环境变量与密钥 · 10 镜像仓库、标签与推送

原理：11 namespace · 12 cgroups · 13 OverlayFS 和 OCI 镜像规范 · 14 runc、containerd 与 Docker Engine · 15 bridge、veth、iptables 与 DNS · 16 存储驱动与数据卷原理

进阶与生产：17 BuildKit · 18 Compose 深入 · 19 安全一：rootless、capabilities、seccomp · 20 安全二：镜像扫描、SBOM 与签名 · 21 性能与资源调优 · 22 生产排障 · 23 CI/CD · 24 overlay 网络与 Swarm 简介

综合项目：25 从零到生产

</details>

<details>
<summary>Kubernetes 课程大纲</summary>

基础：1 为什么需要 Kubernetes · 2 本地集群与 kubectl · 3 Pod · 4 Deployment：滚动更新与回滚 · 5 Service · 6 ConfigMap 与 Secret · 7 存储：PV、PVC 与 StorageClass · 8 Ingress 与 Gateway API · 9 健康检查、资源请求与限制 · 10 命名空间、标签与 kubectl 进阶

原理：11 控制平面 · 12 声明式 API 与控制循环 · 13 kubelet、CRI 与 Pod 的一生 · 14 集群网络：CNI、kube-proxy 与 DNS · 15 调度深入 · 16 存储原理：CSI

工作负载与扩展：17 StatefulSet、DaemonSet、Job 与 CronJob · 18 自动扩缩容 · 19 CRD 与 Operator

生产：20 安全一：RBAC · 21 安全二：Pod Security、NetworkPolicy 与准入控制 · 22 Helm 与 Kustomize · 23 GitOps 与 CI/CD · 24 可观测性 · 25 生产排障 · 26 高可用、升级与备份

综合项目：27 从零到生产

</details>

<details>
<summary>PostgreSQL 课程大纲</summary>

基础：1 PostgreSQL 是什么：进程、连接与 psql · 2 表、数据类型与约束 · 3 查询基础：连接、聚合与窗口函数 · 4 索引入门：什么时候用、怎么建 · 5 事务基础：ACID 与 BEGIN / COMMIT · 6 从应用连接：驱动、参数化查询与连接池

存储与日志：7 存储：页、堆元组与 TOAST · 8 WAL：预写日志与检查点 · 9 缓冲区与 I/O：shared_buffers 与操作系统缓存

索引与查询：10 B-tree 索引内部 · 11 GIN、GiST、BRIN 与表达式、部分索引 · 12 查询规划器与 EXPLAIN · 13 统计信息、连接算法与慢查询

并发：14 事务隔离级别 · 15 MVCC：元组版本与快照可见性 · 16 VACUUM、autovacuum 与事务 ID 回卷 · 17 锁：行锁、表锁与死锁

生产：18 复制：流复制与逻辑复制 · 19 高可用与故障切换 · 20 分区表 · 21 连接池：PgBouncer · 22 性能调优：配置、监控与 pg_stat_statements · 23 备份与时间点恢复（PITR） · 24 安全：角色、权限与行级安全 · 25 模式变更与在线迁移

综合项目：26 综合项目：一个生产级数据库从设计到运维

</details>

<details>
<summary>Redis 课程大纲</summary>

基础：1 Redis 是什么：内存数据库、单线程与许可证 · 2 基础数据类型与常用命令 · 3 从应用连接：客户端、连接池与 Pipeline

内部原理：4 数据结构编码：SDS、listpack、intset 与 quicklist · 5 哈希表与渐进式 rehash、有序集合与跳表 · 6 事件循环、单线程与 I/O 线程 · 7 过期：惰性删除与定期删除 · 8 内存管理与淘汰策略 · 9 持久化：RDB 与 AOF

进阶命令：10 事务、Lua 脚本与 Functions · 11 发布订阅与 Stream · 12 位图、HyperLogLog 与地理位置

高可用与扩展：13 主从复制 · 14 Sentinel：自动故障切换 · 15 Cluster：槽、重定向与扩缩容

缓存设计：16 缓存模式：Cache-Aside 与读写策略 · 17 缓存一致性：更新数据库与删除缓存 · 18 缓存穿透、击穿与雪崩 · 19 热 key 与大 key · 20 分布式锁 · 21 限流、排行榜与计数器

生产：22 安全：ACL、TLS 与危险命令 · 23 可观测性与调优：延迟、内存与慢日志

综合项目：24 综合项目：一个高并发商品服务的缓存层

</details>

<details>
<summary>Kafka 课程大纲</summary>

基础：1 Kafka 是什么：日志、主题与分区 · 2 动手：命令行工具与第一个主题

存储与生产：3 日志存储：分区、段与索引 · 4 生产者：发送流程、分区器与批处理 · 5 生产者可靠性：acks、重试与幂等

消费：6 消费者与消费者组 · 7 再平衡：协议、分配策略与 KIP-848 · 8 位移：提交、重置与交付语义

集群内部：9 复制：Leader、ISR 与高水位 · 10 KRaft：控制器与元数据日志 · 11 事务与精确一次 · 12 保留策略与日志压缩

生态：13 序列化与 Schema Registry · 14 Kafka Connect · 15 Kafka Streams：拓扑与无状态处理 · 16 Kafka Streams：状态、窗口与连接

生产运维：17 性能调优：零拷贝、页缓存与批量 · 18 监控与消费延迟 · 19 安全：TLS、SASL 与 ACL · 20 运维：分区重分配、扩容与升级

设计模式：21 Outbox 模式与 CDC · 22 事件溯源与 CQRS · 23 错误处理：重试主题与死信队列

综合项目：24 综合项目：一个订单事件平台

</details>

<details>
<summary>DDIA 课程大纲</summary>

依照《Designing Data-Intensive Applications》第 2 版（Martin Kleppmann、Chris Riccomini，2026）的章节结构，内容为原创讲解。

第一部分 · 数据系统基础：1 架构中的权衡：事务型与分析型、记录系统与派生数据 · 2 非功能需求：以社交网络时间线为例 · 3 可靠性、可扩展性与可维护性 · 4 数据模型：关系、文档与规范化 · 5 图模型、查询语言与事件溯源 · 6 存储引擎：日志结构与 LSM 树 · 7 B 树、二级索引与内存数据库 · 8 分析型存储：列存、向量化与物化视图 · 9 编码格式：JSON、Protocol Buffers 与 Avro · 10 数据流的模式：数据库、服务、工作流与事件

第二部分 · 分布式数据：11 单主复制 · 12 复制延迟带来的问题与对策 · 13 多主复制、同步引擎与冲突解决 · 14 无主复制：Quorum 与并发写 · 15 分片：按键范围、按哈希与热点 · 16 再平衡、请求路由与二级索引 · 17 事务与 ACID · 18 弱隔离级别：读已提交与快照隔离 · 19 写偏斜、幻读与可串行化 · 20 分布式事务：两阶段提交与精确一次 · 21 分布式系统的麻烦：网络、超时与部分失效 · 22 不可靠的时钟、进程暂停与多数决 · 23 线性一致性 · 24 逻辑时钟、ID 生成与共识

第三部分 · 派生数据：25 批处理 · 26 流处理 · 27 流式系统的哲学：数据集成与正确性

综合项目：28 综合项目：设计一个协作文档平台的数据架构

</details>

<details>
<summary>Clean Code 课程大纲</summary>

依照《代码整洁之道》（Robert C. Martin）的主要思想，内容为原创讲解，示例使用 Python。

第一部分 · 代码的基本单位：1 为什么要写整洁的代码：混乱的代价与童子军规则 · 2 有意义的命名 · 3 函数：短小、只做一件事、一个抽象层级 · 4 函数参数、副作用与命令查询分离 · 5 注释：何时该写，何时该删 · 6 格式：垂直与水平的排版

第二部分 · 设计：7 对象与数据结构：数据抽象与迪米特法则 · 8 错误处理：异常、上下文与不返回 None · 9 边界：包装第三方代码 · 10 单元测试与 TDD：整洁的测试 · 11 类：单一职责与内聚 · 12 SOLID：开闭、里氏替换、接口隔离与依赖倒置 · 13 系统：关注点分离与依赖注入 · 14 简单设计四规则与涌现式设计

第三部分 · 重构：15 代码坏味道（上）：命名、函数与重复 · 16 代码坏味道（下）：类、耦合与启发式 · 17 重构手法：提取、内联、移动与以多态取代条件 · 18 遗留代码：特征测试与接缝 · 19 并发代码的整洁

综合项目：20 综合项目：一步步重构一个混乱的订单模块

</details>

<details>
<summary>pi 源码精读 课程大纲</summary>

阅读 [badlogic/pi-mono](https://github.com/badlogic/pi-mono) 在提交 db77405 的源码；代码摘录均链接到该提交。是 Codex CLI 课程的基础。

第一部分 · 全景：1 pi 是什么：极简 agent harness 与 monorepo 地图 · 2 一次对话的生命周期：从输入到回复

第二部分 · pi-ai：与模型对话：3 统一的消息模型与流式事件 · 4 Provider 抽象、模型目录与凭据 · 5 适配真实 API：消息转换与流式解析

第三部分 · pi-agent-core：循环：6 Agent 循环：runLoop 逐行精读 · 7 工具调用：参数校验、并行执行与钩子 · 8 Agent 类：状态、事件订阅、steering 与 follow-up

第四部分 · coding-agent：编码能力：9 编码工具集：read、write、ls、grep、find · 10 edit 工具：精确替换、diff 与文件修改队列 · 11 bash 工具：进程、输出截断与中止 · 12 系统提示、上下文文件与技能 · 13 会话：JSONL 树、分支与恢复 · 14 上下文压缩（compaction）

第五部分 · 可扩展性与界面：15 扩展系统：工具、命令与事件钩子 · 16 斜杠命令与提示模板 · 17 pi-tui：差分渲染的终端界面 · 18 运行模式：交互、print/JSON、RPC 与 SDK · 19 信任边界，以及 pi 刻意不做的事

综合项目：20 综合项目：用 SDK 构建自己的迷你编码 agent

</details>

## 许可

- 代码：[MIT](LICENSE)。
- 课程内容：[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。转载或改编内容时请按许可要求署名、提供许可链接并标明修改。

DDIA 与 Clean Code 课程为围绕相关主题的原创讲解，不是书籍原文或完整替代。书籍来源与组织方式见相应课程大纲。
