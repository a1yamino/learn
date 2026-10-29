# Docker 主线（第二版）

内容在 `flow_a.py`（01–06）、`flow_b.py`（07–12）、`flow_c.py`（13–18）。
在仓库根目录执行 `python3 _src/docker/v2/build_v2.py` 生成 `docker/u01–u18.html` 与 `docker/index.html`；
加 `--check` 只校验发布文件是否与源一致。

每课流程：先想一想 → 原理 → 图解 → 推演（先猜再看示例输出）→ 迁移 → 面试 → 小结。
页面样式 `docker/unit.css`，图解与推演脚本 `docker/unit.js`，都只作用于 Docker 主线，不改共享的 play.css / play.js。
旧版 `l01–l25` 保留，由 `_src/docker/build.py` 维护。

`flow_deep.py` 为部分课程补充：额外原理小节（more）、走一遍（walk）、常见误区（pitfalls）、放到生产里（prod）和第二张图解（diagram2）。
生成器同时输出旧版归档目录 `docker/v1/index.html` 和旧地址跳转页 `docker/lNN.html`。
