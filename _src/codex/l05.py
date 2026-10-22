from common import *
TITLE='模型客户端：SSE、WebSocket 与重试';MIN=40;NEXT='run_turn 循环'
DESC='pi 第 5 课用一个假的 SSE 服务器验证了 openai-completions 适配器的流式解析。Codex 的模型客户端多了两样东西：<b>两种传输</b>（HTTPS 上的 SSE，以及可复用连接的 Responses WebSocket，失败时回退到 HTTPS），和<b>两层重试</b>（请求级：429/5xx/网络错误；流级：流中断后重新发起整个请求）。本课让假服务器先返回 500、再在流中途断开，观察 codex 如何恢复。'
SUM=['<b>ModelClient / ModelClientSession</b>（<code>core/src/client.rs</code>）：前者随会话存活，持有认证、提供方与传输回退状态；后者每个 turn 一个，缓存 WebSocket 连接与 <code>x-codex-turn-state</code> 粘性路由令牌。',
'<b>SSE 解析</b>（<code>codex-api/src/sse/responses.rs</code>）：按事件类型分派——<code>response.created</code>、<code>output_item.added/done</code>、<code>output_text.delta</code>、推理摘要增量、<code>response.completed</code>/<code>incomplete</code>/<code>failed</code>；其余事件忽略。',
'<b>请求级重试</b>（<code>codex-client/src/retry.rs</code>）：<code>RetryOn</code> 决定 429、5xx、超时/连接错误是否重试；<code>backoff</code> 指数退避并带 ±10% 抖动。次数由提供方的 <code>request_max_retries</code> 控制。实验中第一次 500 被静默重试。',
'<b>流级重试</b>（<code>core/src/responses_retry.rs</code>）：流在 <code>response.completed</code> 前断开，按 <code>stream_max_retries</code> 重新发起请求，并通知前端 “Reconnecting... n/max”；尊重服务器的 Retry-After。',
'<b>WebSocket 回退</b>：WebSocket 重试用尽时切换到 HTTPS 并发出警告 “Falling back from WebSockets to HTTPS transport”，重试计数清零。',
'<b>注意</b>：中断前已流出的文本已经显示给了用户（实验中“这段文字会被丢弃”被打印出来），但不会写入历史；重新请求时模型从头生成。']
S1=('一次请求的三条路','')
A1=[('500','HTTP 500 → 请求级重试（静默，指数退避）。',[('a','请求 1','',0,90,90),('e','500','bad',120,90,70),('r','重试','sig',220,90,80)]),('断流','没有 response.completed 就断开 → 流级重试，提示 Reconnecting 1/2。',[('b','请求 2','',0,90,90),('d','断流','bad',120,90,70),('r2','Reconnecting','sig',220,90,130)]),('成功','请求 3 正常完成。',[('c','请求 3','ok',0,90,90)])]
S2=('动手：会重试吗？','')
CHI=[('HTTP 429','重试（retry_429）','ok',''),('HTTP 500','重试（retry_5xx）','ok',''),('HTTP 400','不重试，直接报错','bad','客户端错误不会因为重试而改变。'),('连接超时','重试（retry_transport）','ok',''),('流在中途断开','流级重试，Reconnecting... n/max','ok','')]
CHH='选择一种失败。'
S3=('读代码','',X('codex-rs/core/src/client.rs',[(1,26)])+'<p>哪些错误重试，如何退避：</p>'+X('codex-rs/codex-client/src/retry.rs',[(22,52)])+'<p>流级重试与 WebSocket 回退：</p>'+X('codex-rs/core/src/responses_retry.rs',[(120,170)])+NOTE('<b>与 pi 对照</b>：'+pi(5,'适配真实 API：消息转换与流式解析')+'。'))
S4=('真实输出','')
TERM=[['bash l05.sh','codex\n这段文字会被丢弃\nERROR: Reconnecting... 1/2\ncodex\n第 3 次请求终于成功\n== 共收到 3 次请求','']]
S5=('在你的电脑上练习',RUNNOTE+' 本课的 mock.py 支持两种故障：剧本返回 <code>{"http_status": 500}</code> 模拟 HTTP 错误，输出项 <code>{"type":"__drop__"}</code> 模拟断流；run.sh 支持 <code>REQ_RETRIES</code>、<code>STREAM_RETRIES</code>。')
PRAC=[('更新 mock.py 与 run.sh。',heredoc('mock.py')+'\n'+heredoc('run.sh'),''),('故障剧本。',heredoc('s_flaky.py'),''),('运行。',heredoc('l05.sh')+'\ncd codex/scratch && bash l05.sh',None)]
CHAL=('重试用尽','把 <code>STREAM_RETRIES</code> 设为 0，同样的剧本会怎样？再把 <code>REQ_RETRIES</code> 也设为 0 呢？',
'<p>STREAM_RETRIES=0：第 1 次 500 被请求级重试，第 2 次断流不再重试，报错 “stream disconnected before completion: stream closed before response.completed”，exec 退出码为 1，共 2 次请求。两者都为 0：第 1 次 500 直接失败，只有 1 次请求；注意错误信息不是服务器返回的 “upstream overloaded”，而是 codex 对 5xx 的统一提示 “We’re currently experiencing high demand, which may cause temporary errors.”。可以用 <code>ls $CODEX_HOME/requests | wc -l</code> 验证请求次数。</p>')
QUIZ=[['ModelClientSession 的生命周期？',['每个 turn 一个','每个请求一个','整个进程'],0,''],['流中断后 codex？',['按 stream_max_retries 重新发起请求','继续读','忽略'],0,''],['backoff 的特点？',['指数增长并带 ±10% 抖动','固定 1 秒','线性'],0,''],['WebSocket 重试用尽？',['回退到 HTTPS','放弃','改用 gRPC'],0,''],['HTTP 400 会重试吗？',['不会','会','只重试一次'],0,'']]
