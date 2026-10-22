#!/bin/bash
# 读 Seatbelt 策略：默认拒绝，再逐项放开
P=../codex-rs/sandboxing/src
echo "== 策略文件（行数）"; for f in $P/seatbelt_*.sbpl; do printf "  %-42s %4d\n" $(basename $f) $(wc -l < $f); done
echo "== 基础策略的第一条规则"; grep -m1 -E '^\(deny|^\(allow' $P/seatbelt_base_policy.sbpl
echo "== 基础策略中各类规则出现次数"
grep -oE '^\((allow|deny) [a-z*-]+' $P/seatbelt_base_policy.sbpl | sort | uniq -c | sort -rn | head -8
echo "== 网络策略（启用网络时追加）"; grep -E '^\(allow' $P/seatbelt_network_policy.sbpl | head -5
echo "== 可写根目录以参数形式传给 sandbox-exec"
grep -n 'WRITABLE_ROOT"\|format!("-D' $P/seatbelt.rs
echo "== codex sandbox 在本机使用的沙箱"; codex sandbox --help | grep -m1 'Full command args'
