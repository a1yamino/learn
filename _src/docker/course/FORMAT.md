# Docker 新主线内容格式

`u01.json`–`u18.json` 是新主线的内容源。`../build-course.py` 生成
`docker/u01.html`–`u18.html` 和目录；旧 `lNN.html` 保留为补充资料。
正文使用纯文本，代码放在 `code` 字段，不在文本内写 HTML。

每课必须讲清一个因果模型，提供可执行实验、陌生变体和面试追问。
适当复用旧课，但不要把链接当作本课正文，不重复长命令说明。

## JSON 契约

```json
{
  "number": 2,
  "title": "容器本质与 namespace",
  "summary": "一句话说明本课能够解释的问题。",
  "minutes": 45,
  "environment": "说明 Desktop/原生 Linux、权限与版本前提。",
  "sources": [1, 2, 11],
  "objectives": ["可观察的学习目标"],
  "question": "开课的真实问题或反直觉场景？",
  "model": [
    {"title": "模型小节", "body": ["完整解释段落", "边界与反例"], "code": "可选的短代码或关系表达"}
  ],
  "diagram": {
    "label": "图解的可访问名称",
    "nodes": [
      {"id": "cli", "title": "CLI", "detail": "用户电脑", "x": 0, "y": 0, "w": 200},
      {"id": "engine", "title": "Engine", "detail": "Linux 执行环境", "x": 300, "y": 0, "w": 200}
    ],
    "edges": [{"from": "cli", "to": "engine", "label": "API"}],
    "steps": [{"title": "本步标题", "body": "解释本次改变及其原因。", "focus": ["cli", "engine"]}]
  },
  "lab": {
    "title": "实验标题",
    "environment": "实验的具体前提，所有步骤在同一终端执行。",
    "predict": "运行前先写出的预测问题。",
    "steps": [
      {"title": "这一步要验证什么", "code": "实际命令", "expect": "观察哪些字段；不要伪造固定 ID 或耗时", "why": "结果支持或排除什么解释"}
    ],
    "cleanup": "只清理本实验所创建资源的命令。"
  },
  "transfer": {
    "question": "一个没有标出根因的变体。",
    "evidence": ["必须提交的证据或可观察断言"],
    "answer": ["折叠展示的诊断推理与修复，不只给结论。"]
  },
  "interview": [
    {
      "question": "2 分钟口述题",
      "answer": "结论、机制、边界、证据的完整回答。",
      "followups": [{"question": "进一步追问", "answer": "有具体解释的参考回答。"}],
      "misconception": "一个常见混淆及其纠正。"
    }
  ],
  "takeaways": ["3–5 条应能独立解释的结论"],
  "references": [{"title": "官方依据名称", "url": "https://docs.docker.com/..."}]
}
```

图解建议使用 4–7 个节点、3–5 个因果步骤。节点高度固定为 72，坐标
间留出连线和标签空间；图上必须有关系边。约 100 px 的间隙使用 3–5 个
汉字的短关系词，完整指令和解释放在步骤正文。不要添加没有教学意义的数字。
`focus` 只是突出当前因果链，其余节点和关系仍保持可见。

## 共用实验应用

主线应用位于 `docker/labs`，使用 Python 标准库 HTTP 服务和 SQLite。
这是用于容器行为实验的订单应用，不宣称是生产商店系统。

- 从仓库根目录执行 `cd docker/labs`，以 `docker compose` 构建和启动。
- `compose.yaml` 的服务名为 `api`、`gateway`；`gateway` 是 Nginx 反向代理。
- `gateway` 发布 `127.0.0.1:8080:80`，连接 `front`、`back` 网络。
- `api` 只在 `back` 网络监听 `0.0.0.0:8000`，数据位于 `/data/orders.db`。
- 命名卷为 `orders`；容器内运行身份为 UID/GID 10001。
- API：`GET /health`（存活）、`GET /ready`（数据库查询）、`GET /version`、
  `GET /orders`、`POST /orders`（JSON：`{"item":"book","quantity":2}`）、
  `GET /slow?seconds=3`（优雅停止实验）。
- `GET /version` 返回 `{"version":"1.0.0"}`，版本从构建进镜像的 `version.txt` 读取。
- 配置：`BIND_HOST`（默认 0.0.0.0）、`PORT`（8000）、`DATA_DIR`（/data）。
- `python app.py backup /data/backup.db` 使用 SQLite backup API 创建一致快照。
- `python verify.py http://127.0.0.1:8080` 会创建一笔实验订单并验证业务读写，
  输出可保存的 JSON 验收证据；它只在实验环境执行。
- Compose 默认项目名 `learn-docker`；自动化复核使用独立项目名，避免影响学员数据。
- 实验命令中的构建/运行参数可按本课改变，但说明改变的前提与清理范围。
- 基础镜像使用 `python:3.12-slim`；Nginx 使用 `nginx:stable-alpine`。
  可复现构建章节要求学员解析并记录本次实际 digest，不把可变标签视为固定版本。

Linux 专属实验使用独立名称，例如 `learn-u02`，不得以通用 `prune` 或
系统级服务停止作为默认清理。需要 root、unshare 或宿主路径时必须在命令前说明。
