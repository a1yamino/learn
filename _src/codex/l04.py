from common import *
TITLE='模型提供方与认证';MIN=35;NEXT='模型客户端：SSE、WebSocket 与重试'
DESC='pi 内置了 40 多家提供方和一千多个模型。Codex 的立场正好相反：源码注释写明“不想裁定哪些第三方提供方应该内置”，因此只内置 OpenAI、Amazon Bedrock 与两个本地开源提供方（Ollama、LM Studio），其余一律由用户在 <code>config.toml</code> 的 <code>model_providers</code> 中声明。本课看提供方结构 <code>ModelProviderInfo</code>、API key 的来源，以及 <code>codex login</code> 如何保存凭据。'
SUM=['<b>ModelProviderInfo</b>：<code>base_url</code>、<code>env_key</code>（从哪个环境变量读 key）、<code>wire_api</code>（协议，默认 responses）、<code>http_headers</code>/<code>env_http_headers</code>、<code>query_params</code>、重试与超时（<code>request_max_retries</code>、<code>stream_max_retries</code>、<code>stream_idle_timeout_ms</code>）、<code>requires_openai_auth</code>、<code>supports_websockets</code> 等。',
'<b>内置提供方</b>：<code>built_in_model_providers()</code> 只有 openai、amazon-bedrock（两种）、ollama、lmstudio；用户配置的提供方与之合并，内置的一般不可覆盖（Bedrock 例外）。',
'<b>env_key</b>：<code>api_key()</code> 读取环境变量，为空就报 <code>Missing environment variable</code>，并附上 <code>env_key_instructions</code>。',
'<b>OpenAI 认证</b>：<code>codex login</code> 支持 ChatGPT 账号登录（OAuth）或 API key；凭据写在 <code>$CODEX_HOME/auth.json</code>（或系统钥匙串，取决于 <code>cli_auth_credentials_store</code>）。',
'<b>请求头</b>：<code>authorization: Bearer …</code>、<code>originator</code>（codex_exec / codex_cli_rs …）、<code>session-id</code>、带操作系统与终端信息的 <code>user-agent</code>。',
'<b>模型元数据</b>：模型能力（工具、shell 类型、apply_patch 类型、上下文窗口）来自 <code>models-manager/models.json</code> 或远程目录；未知模型使用回退元数据（第 1 课的警告）。']
S1=('key 从哪里来','')
A1=[('自定义提供方','env_key = "MOCK_KEY" → 读环境变量。',[('c','config.toml','',0,90,120),('e','$MOCK_KEY','sig',160,90,110)]),('OpenAI','codex login → auth.json / 钥匙串。',[('l','codex login','',0,90,120),('a','auth.json','sig',160,90,110)]),('请求','Authorization: Bearer …',[('r','POST /v1/responses','ok',0,90,180)])]
S2=('动手：会发生什么？','')
CHI=[('env_key 指向的变量未设置','报错 Missing environment variable: `MOCK_KEY`.','bad',''),('变量已设置','请求带 authorization: Bearer <值>','ok',''),('echo key | codex login --with-api-key','写入 $CODEX_HOME/auth.json（OPENAI_API_KEY、auth_mode）','ok',''),('在 config 中重定义 openai 提供方','内置提供方一般不可覆盖','sig','merge_configured_model_providers 只允许 Bedrock 定制。')]
CHH='选择一种情况。'
S3=('读代码','','<p>只内置少数提供方：</p>'+X('codex-rs/model-provider-info/src/lib.rs',[(662,694)])+'<p>从环境变量读 key：</p>'+X('codex-rs/model-provider-info/src/lib.rs',[(482,498)])+NOTE('<b>与 pi 对照</b>：'+pi(4,'Provider 抽象、模型目录与凭据')+'。pi 内置庞大的模型目录、存储的凭据优先于环境变量；Codex 内置极少，把选择交给用户配置。'))
S4=('真实输出','')
TERM=[['bash l04.sh','== 1. provider 声明 env_key = "MOCK_KEY"，但环境变量未设置\nERROR: Missing environment variable: `MOCK_KEY`.','']]
S5=('在你的电脑上练习',RUNNOTE+' 本课给 <code>run.sh</code> 增加了 <code>EXTRA_PROVIDER</code>（追加到提供方配置）并让 mock.py 记录请求头；如果你从第 1 课复制的是旧版，请用下面的版本覆盖。全部使用临时 <code>CODEX_HOME</code>，不会影响你真实的登录状态。')
PRAC=[('更新后的 mock.py 与 run.sh。',heredoc('mock.py')+'\n'+heredoc('run.sh'),''),('实验。',heredoc('l04.sh')+'\ncd codex/scratch && bash l04.sh',None)]
CHAL=('自定义请求头','给 mock 提供方加上固定请求头 <code>X-Team: course</code> 和从环境变量 <code>TRACE_ID</code> 读取的 <code>X-Trace</code>，验证未设置 TRACE_ID 时该头不出现。',
'<pre style="white-space:pre-wrap">EXTRA_PROVIDER=\'http_headers = { "X-Team" = "course" }\nenv_http_headers = { "X-Trace" = "TRACE_ID" }\' bash run.sh s_hello.py hi\n# 再用 TRACE_ID=abc 运行一次，比较 req01.json 的 headers</pre><p>按 <code>ModelProviderInfo</code> 的文档：env_http_headers 中的环境变量未设置或为空时，该请求头不会发送。</p>')
QUIZ=[['Codex 内置哪些提供方？',['OpenAI、Bedrock、Ollama、LM Studio','四十多家','只有 OpenAI'],0,''],['env_key 的作用？',['指定读取 API key 的环境变量','存储 key','加密 key'],0,''],['codex login 的 key 存在哪？',['$CODEX_HOME/auth.json 或钥匙串','config.toml','环境变量'],0,''],['wire_api 默认？',['responses','chat','anthropic'],0,''],['模型能力来自？',['模型元数据（models.json/远程目录）','提供方配置','请求头'],0,'']]
