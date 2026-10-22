import sys;sys.path.insert(0,'/workspace/coursekit')
from gen import excerpt
SHA='c260087efe8cc6dcc0526e7018ae9e0e3fc134e3'
ROOT='/workspace/src/codex'
BASE=f'https://github.com/openai/codex/blob/{SHA}/'
def X(path,ranges,note=''): return excerpt(ROOT,BASE,path,ranges,note)
def pi(n,title): return f'<a href="../pi/l{n:02d}.html">pi 第 {n} 课 · {title}</a>'
def NOTE(html): return f'<div class="card" style="margin:16px 0;font-size:15px;line-height:1.7">{html}</div>'
SCR='/workspace/src/codex/scratch/'
def src(name): return open(SCR+name).read()
def heredoc(name): return f"cat > codex/scratch/{name} <<'EOF'\n{src(name)}EOF"
BUILD=('从源码构建 codex（固定提交 c260087；首次约 5–10 分钟，需要 rust-toolchain.toml 指定的工具链，Linux 还需 pkg-config、libssl-dev），并把它放进 PATH。','cd codex/codex-rs && cargo build -p codex-cli --bin codex\nexport PATH="$PWD/target/debug:$PATH"','')
RUNNOTE='练习使用第 1 课的 <code>mock.py</code>（假的 Responses API 服务器）和 <code>run.sh</code>（以临时 <code>CODEX_HOME</code> 启动它并运行 <code>codex exec</code>）。剧本文件定义 <code>reply(n, body)</code>，返回第 n 次请求的输出项；每次请求的完整 JSON 保存在 <code>$CODEX_HOME/requests/</code>。'
