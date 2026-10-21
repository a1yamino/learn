# 学习

互动技术课程，中文。 / Interactive tech courses in Chinese.

网址 / Site：https://a1yamino.github.io/learn/

## 课程 / Courses

| 课程 | 适合人群 | 状态 |
|---|---|---|
| [Docker](https://a1yamino.github.io/learn/docker/) | 初级后端工程师 | 已完成（25 课） |
| [Kubernetes](https://a1yamino.github.io/learn/k8s/) | 学完 Docker 的工程师 | 已完成（27 课） |
| [PostgreSQL](https://a1yamino.github.io/learn/postgres/) | 初级后端工程师 | 更新中（26 课） |

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
_src/             课程生成器源文件 / generator sources
```
纯静态 HTML，无需构建；克隆后直接用浏览器打开 `index.html` 即可。
*Pure static HTML, no build step.*

## 许可 / License
- 代码 / Code：[MIT](LICENSE)
- 课程内容 / Content：[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

欢迎 Issue 和 PR！ / Issues and PRs welcome!
