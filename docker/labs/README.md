# Docker 主线实验应用

这个应用供课程实验使用：Python 标准库提供订单 API，SQLite 保存数据，
Nginx 提供反向代理。它让进程、网络、挂载、配置和恢复结果可以直接观察。
业务代码已经提供，学习时重点验证 Docker 行为。

从仓库根目录进入实验目录，先检查本机 Docker 和 Compose：

```bash
cd docker/labs
docker version
docker compose version
docker compose up -d --build --wait
python3 verify.py http://127.0.0.1:8080 --output evidence/first-run.json
```

验证脚本会创建一笔 `verify-` 开头的订单，再查询并核对内容；成功时以状态码
0 退出，并输出 JSON 证据。默认只监听本机 8080 端口。端口冲突时可以设置
`LAB_PORT=18080 docker compose up -d --build --wait`，再对相应地址验收。

应用接口：

| 接口 | 作用 |
| --- | --- |
| `GET /health` | 进程存活 |
| `GET /ready` | SQLite 可查询 |
| `GET /version` | 构建进镜像的版本 |
| `GET /orders` | 查询订单 |
| `POST /orders` | 创建订单，JSON 为 `{"item":"book","quantity":2}` |
| `GET /slow?seconds=3` | 模拟进行中的请求，供优雅停止实验使用 |

API 工作目录为 `/app`，进程身份为 `10001:10001`，数据库为 `/data/orders.db`。
版本从镜像中的 `version.txt` 读取；改本地文件后需重新构建和创建容器。
`api` 在 `back` 网络内监听 8000，`gateway` 连接 `front` 和 `back`，发布本机端口。
名称为 `orders` 的卷由 Compose 项目管理；容器重建后仍会使用同一项目的卷。

```bash
# 创建一致的 SQLite 快照；数据库运行时不要只复制主 .db 文件作为通用备份。
docker compose exec api python app.py backup /data/backup.db

# 停止并删除本项目容器，保留数据卷。
docker compose down

# 只有确认要清空本项目实验数据时，才执行：
docker compose down -v
```

每个专题使用 `docker compose -p learn-uNN` 或独立容器名，避免混用数据。
`LAB_IMAGE` 可以覆盖 API 镜像名，`PYTHON_IMAGE` 可以指定基础镜像完整引用。
固定版本和多平台实验应记录自己解析到的 digest，不将课程中的可变标签当作固定产物。

应用在停止时记录 `SHUTDOWN_REQUESTED`，等待正在处理的请求完成，再记录
`SHUTDOWN_COMPLETE`。`/slow` 的开始和结束分别记录 `REQUEST_STARTED`、
`REQUEST_FINISHED`，便于核对是否真的完成请求。默认 Docker 停止超时有限，
长请求实验应明确设置 `docker stop -t` 并核对客户端结果。

毕业任务可以生成一个故障配置。工具只写配置和参考答案，不执行 Docker：

```bash
python3 faults.py --case A --output evidence/case-a --project learn-u18
# 保存正常业务结果，再按打印的命令加载故障。
# 提交诊断后对照 answer.json，并按打印的命令恢复基础配置。
python3 faults.py --case B --output evidence/case-b --project learn-u18
```

也可以选择 `--case random`。先提交现象、假设、区分证据、根因、最小修复和
业务复验，再查看答案。恢复基础配置保留原项目数据卷；切换数据路径的场景中，
新写入的临时数据不能当作已备份的数据。证据目录已经加入 Git 忽略规则。
