# 学习

互动技术课程，中文。 / Interactive tech courses in Chinese.

网址 / Site：https://a1yamino.github.io/learn/

## 课程 / Courses

| 课程 | 适合人群 | 状态 |
|---|---|---|
| [Docker](https://a1yamino.github.io/learn/docker/) | 初级后端工程师 | 更新中（25 课） |
| Kubernetes | 学完 Docker 的工程师 | 计划中 |

### Docker 课程大纲
基础：1 为什么需要 Docker · 2 容器生命周期与核心命令 · 3 Dockerfile 与构建缓存 · 4 实战：把后端 API 打包成镜像 · 5 多阶段构建与镜像瘦身 · 6 数据卷与持久化 · 7 网络与端口映射 · 8 Docker Compose 入门 · 9 配置、环境变量与密钥 · 10 镜像仓库、标签与推送

原理：11 namespace · 12 cgroups · 13 OverlayFS 和 OCI 镜像规范 · 14 runc、containerd 与 Docker Engine · 15 bridge、veth、iptables 与 DNS · 16 存储驱动与数据卷原理

进阶与生产：17 BuildKit · 18 Compose 深入 · 19 安全一：rootless、capabilities、seccomp · 20 安全二：镜像扫描、SBOM 与签名 · 21 性能与资源调优 · 22 生产排障 · 23 CI/CD · 24 overlay 网络与 Swarm 简介

综合项目：25 从零到生产

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
```
纯静态 HTML，无需构建；克隆后直接用浏览器打开 `index.html` 即可。
*Pure static HTML, no build step.*

## 许可 / License
- 代码 / Code：[MIT](LICENSE)
- 课程内容 / Content：[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

欢迎 Issue 和 PR！ / Issues and PRs welcome!
