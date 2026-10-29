# Docker 课程源文件

## 新主线：原理、实战与面试

`course/u01.json`–`u18.json` 保存 18 课正文、图解、实验与面试追问。
格式和统一实验应用契约见 [course/FORMAT.md](course/FORMAT.md)。
在仓库根目录执行：

```bash
python3 _src/docker/build-course.py
python3 _src/docker/build-course.py --check
```

生成器输出 `docker/u01.html`–`u18.html` 和 `docker/index.html`。
可传课号只生成指定课，或用 `--out <目录>` 写到独立目录。
`--check` 验证源文件与发布 HTML 一致，不写入文件。

`docker/course.js` 连接共享播放器并保存本机学习草稿、自记进度；
`docker/course.css` 提供阅读与证据记录布局。页面图解属于教学模型，
只有学员在独立实验环境执行命令才会操作 Docker。
统一应用、业务验收脚本和故障配置工具位于 `docker/labs/`。

## 原课程补充资料

`page.py` 与 `build.py` 从 `lNN.py` 生成 `docker/l02.html`–`l25.html`。
旧链接继续有效，页面顶部指向新主线。

```bash
python3 _src/docker/build.py 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25
```

设置 `OUT=<目录>` 可将旧课生成到独立目录。
`docker/l01.html`、所有 `lNN.js`、`layout.css` 和 `motion.js` 直接维护。
修改旧课 HTML 正文应同步对应 Python 源；`extract.py` 可从发布页重建
数据模块，使用前确认不会覆盖正在编辑的源文件。

`layout.css` 是 Docker 专用视觉系统。播放器扩展见 [player-api.md](player-api.md)：
Docker 默认单步、固定视野和可选复习倍速，其他课程保留原来的默认配置。
Docker 专用布局写在 `docker/`，不为本课程的样式修改共享 `assets/play.css`。
