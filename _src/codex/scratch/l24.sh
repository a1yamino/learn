#!/bin/bash
# 毕业项目：准备一个有 bug 的仓库，交给 fixflow.py
S=$(pwd); export CODEX_HOME=$(mktemp -d); R=$(mktemp -d); cd $R; git init -q
printf 'def mean(xs):\n    return sum(xs) / len(xs)\n' > calc.py
printf 'import unittest\nfrom calc import mean\nclass T(unittest.TestCase):\n    def test_mean(self): self.assertEqual(mean([1, 2, 3]), 2)\n    def test_empty(self): self.assertEqual(mean([]), 0.0)\n' > test_calc.py
git add . && git -c user.name=c -c user.email=c@x commit -qm init
RUN="python3 $S/fixflow.py" bash $S/run.sh $S/s_fix.py 2>&1
