# Docker 图解播放器

`assets/play.js` 默认保留其他课程的自动播放、0.65 时长系数和逐场景相机。
Docker 页面在播放器脚本后、课程脚本前加载 `docker/motion.js`，启用以下默认值：

| 全局配置 | Docker 默认值 | Player 局部选项 |
| --- | --- | --- |
| `PLAYER_AUTOPLAY` | `false` | `autoplay` |
| `PLAYER_DURATION_SCALE` | `1` | `durationScale` |
| `PLAYER_SPEEDS` | `[0.5, 1, 1.5]` | `speeds` |
| `PLAYER_FIXED_CAMERA` | `true` | `fixedCamera` |
| `PLAYER_ZOOM` | `true` | `zoom` |
| `TERM_INSTANT` | `true` | `Term(el, commands, {instant: true})` |

`Player(root, options)` 继续使用已有的 `els` 和 `scenes`。
默认停在第一步，前后按钮或步骤标题直接切换；“播放复习”与“重播”显式开始定时播放。
离开视区或隐藏标签页会暂停，返回后恢复；手动暂停、选择步骤和切换缩放会保持暂停。
同一时刻只有一个图解播放。减少动态效果偏好阻止自动启动并移除节点位移动画；仍可手动播放。

```js
Player(root, {
  els: {
    cli: {w: 200, h: 72, cls: 'blk', html: 'CLI'},
    engine: {w: 200, h: 72, cls: 'blk', html: 'Engine'}
  },
  edges: [{id: 'request', from: 'cli', to: 'engine', label: 'API 请求'}],
  // 可选：覆盖全场景并集。边界单位与节点坐标相同。
  bounds: {x: -16, y: -24, width: 552, height: 120},
  speed: 1,
  scenes: [{
    t: 'CLI 发出请求', p: 'Engine 处理请求。', d: 4000,
    set: {cli: [0, 0], engine: [320, 0]},
    focus: ['engine'],
    activeEdges: ['request']
  }]
});
```

- `edges` 只在两端节点都出现在当前 `scene.set` 时显示。所有端点必须声明在 `els`。
- 不提供 `id` 时，`activeEdges` 用 `from->to`，例如 `cli->engine`。高亮改变颜色和线宽，其他边保持可见。
- 连线和箭头置于节点下层，按节点之间的主方向自动选择左右或上下端点。
  标签宜简短，并为标签留出节点间距；播放器不进行通用避障和自动图布局。
- 固定相机默认测量所有步骤和文案变体的并集，字体加载或窗口尺寸改变后重算。
  大图仍可点“放大”后滚动查看，按 Escape 回到适配。
- 每步实际时长为 `(scene.d || 3200) * durationScale / speed`。
  倍速选择为原生下拉框；播放中切换保持当前步骤和已完成进度。
- 返回值包含既有 `show`、`play`、`pause`、`E`，新增 `setSpeed(number)`。
