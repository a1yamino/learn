# Docker 课程源文件

## 主线（第二版，18 课）

源文件在 `v2/`，说明见 [v2/README.md](v2/README.md)。在仓库根目录执行：

```bash
python3 _src/docker/v2/build_v2.py          # 生成 docker/u01–u18.html、docker/index.html、docker/v1/index.html 与 docker/lNN.html 跳转页
python3 _src/docker/v2/build_v2.py --check  # 只校验，不写文件
```

## 第一版归档（25 课）

旧版已移到 `docker/v1/`，`docker/lNN.html` 是跳转到归档的轻量页面，旧链接继续可用。
`page.py` 与 `build.py` 从 `lNN.py` 生成 `docker/v1/l02.html`–`l25.html`，输出时会把相对路径下移一层：

```bash
python3 _src/docker/build.py 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25
```

`docker/v1/l01.html`、所有 `docker/v1/lNN.js` 直接维护；`docker/layout.css`、`docker/motion.js` 由归档页与主线共用。
