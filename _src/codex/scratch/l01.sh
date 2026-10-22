#!/bin/bash
# Codex 仓库地图：crate 数量、各层代码量，以及一次离线运行
cd ../codex-rs
echo "== crate 数量（含 ext/ 与 utils/ 下的子 crate）"
find . -name Cargo.toml -not -path './target/*' | wc -l
echo "== 几个关键 crate 的 Rust 代码行数（含测试）"
for d in core protocol tui exec cli apply-patch execpolicy linux-sandbox app-server codex-mcp hooks ext/goal; do
  printf "%-14s %7s\n" $d $(find $d -name '*.rs' | xargs cat | wc -l)
done
echo "== codex 的子命令"
codex --help | sed -n '/^Commands:/,/^$/p'
