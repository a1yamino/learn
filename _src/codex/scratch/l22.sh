#!/bin/bash
# 配置分层：同一个键 model 在不同层设置，看请求里实际用的是哪个
S=$(pwd); export CODEX_HOME=$(mktemp -d); R=$(mktemp -d); cd $R; git init -q
model() { python3 -c "import json,glob,os;f=max(glob.glob('$CODEX_HOME/requests/req*.json'),key=os.path.getmtime);print(json.load(open(f))['body']['model'])"; }
ask() { bash $S/run.sh $S/s_once.py "$@" hi >/dev/null 2>&1; echo "   → 请求中的 model = $(model)"; }
echo "== 1. 用户层 \$CODEX_HOME/config.toml：model = \"gpt-5.5\""; ask
mkdir .codex; echo 'model = "proj-model"' > .codex/config.toml
echo "== 2. 项目层 .codex/config.toml（项目未被信任）"; ask
echo "== 3. 同上，项目被信任"; EXTRA_CONFIG="[projects.\"$R\"]
trust_level = \"trusted\"" ask
echo "== 4. 再加命令行 -c model=cli-model"; EXTRA_CONFIG="[projects.\"$R\"]
trust_level = \"trusted\"" ask -c model=cli-model
echo "== 5. --profile fast：读取 \$CODEX_HOME/fast.config.toml"
echo 'model = "profile-model"' > $CODEX_HOME/fast.config.toml; ask --profile fast
echo "== 6. 旧写法 [profiles.fast] 写在 config.toml 中"
EXTRA_CONFIG='[profiles.fast]
model = "x"' bash $S/run.sh $S/s_once.py --profile fast hi 2>&1 | grep -o "cannot be used while.*legacy[^;]*" | sed 's/^/   /' 
echo "== codex features list（前 8 行）"; codex features list 2>/dev/null | head -8
