const S=(t,s,c='',w=140)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});const P=(t,c='sig')=>({cls:'pill '+c,html:t});
Player(document.getElementById('p1'),{els:{app:S('应用容器','stdout · /metrics · OTel SDK','',220),f:S('/var/log/pods','节点上的文件','',150),fb:S('Fluent Bit','DaemonSet','',130),lk:S('Loki','日志','',110),pm:S('Prometheus','抓取 /metrics','',150),col:S('OTel Collector','','',150),tp:S('Tempo','追踪','',110),gf:S('Grafana','查询 · 关联','',140),n:{w:700,cls:'tag'}},scenes:[
 {t:'日志',p:'应用只写 stdout。运行时把它存成节点上的文件；采集器 DaemonSet 读取文件、加上命名空间和 Pod 标签，推送到日志后端。',d:4000,set:{app:[0,20],f:[260,0,{cls:'blk sig'}],fb:[430,0,{cls:'blk sig'}],lk:[590,0]}},
 {t:'指标',p:'应用暴露 /metrics。Prometheus 主动拉取（pull），每 15–30 秒一次，存为时间序列。',d:3600,set:{app:[0,20],f:[260,0],fb:[430,0],lk:[590,0],pm:[260,80,{cls:'blk sig'}]}},
 {t:'追踪',p:'OTel SDK 为每个请求生成 span，经 Collector 批量发送到追踪后端。trace_id 通过 HTTP 头在服务间传递。',d:3600,set:{app:[0,20],f:[260,0],fb:[430,0],lk:[590,0],pm:[260,80],col:[260,160,{cls:'blk sig'}],tp:[430,160]}},
 {t:'关联',p:'在 Grafana 里从告警跳到指标图，从延迟高的时间点跳到对应的追踪，再按 trace_id 跳到这次请求的日志。关键是三者用一致的标签（namespace、pod、service）和 trace_id。',d:4200,set:{app:[0,20],f:[260,0],fb:[430,0],lk:[590,0,{cls:'blk ok'}],pm:[260,80,{cls:'blk ok'}],col:[260,160],tp:[430,160,{cls:'blk ok'}],gf:[590,80,{cls:'blk sig'}]}}]});
Player(document.getElementById('p2'),{els:{sm:S('ServiceMonitor','selector: app=api · port: metrics','',230),sv:S('Service api','label app=api','',150),es:S('EndpointSlice','10.244.1.9 · 10.244.2.7','',190),op:S('Prometheus Operator','','',170),cfg:P('生成 scrape 配置','mute'),pm:S('Prometheus','','',130),t:P('GET 10.244.1.9:9100/metrics','sig'),l:P('附加标签 namespace、pod、service','mute'),n:{w:700,cls:'tag'}},scenes:[
 {t:'声明要抓什么',p:'ServiceMonitor 按标签选择 Service，并指定端口名和路径。它本身是 CRD 对象，可以和应用放在一起。',d:3600,set:{sm:[0,20,{cls:'blk sig'}],sv:[280,20]}},
 {t:'生成配置',p:'Operator watch ServiceMonitor，把它翻译成 Prometheus 的 kubernetes_sd 抓取配置并热加载。',d:3600,set:{sm:[0,20],sv:[280,20],op:[0,110,{cls:'blk sig'}],cfg:[200,124]}},
 {t:'发现端点',p:'Prometheus 通过 API watch EndpointSlice，得到每个 Pod 的 IP。Pod 增减时目标列表自动变化，并带上 namespace、pod、service 标签。',d:4000,set:{sm:[0,20],sv:[280,20],es:[470,20,{cls:'blk sig'}],op:[0,110],pm:[280,110],l:[280,190]}},
 {t:'抓取',p:'直接请求每个 Pod 的 IP（不经过 Service 负载均衡），这样每个实例都有自己的序列。抓不到时 up=0，这本身就是一个可告警的指标。',d:4000,set:{sv:[280,20],es:[470,20],pm:[280,110,{cls:'blk ok'}],t:[280,190]}}]});
(()=>{const T=['13:00:00','13:00:30','13:01:00','13:01:30','13:02:00','13:02:30','13:03:00','13:03:30','13:04:00','13:04:30','13:05:00'];
 const D={a:[1000,1060,1120,1180,1240,1300,1360,1420,1480,1540,1600],b:[800,830,860,890,20,50,80,110,140,170,200]};
 document.getElementById('ps').textContent='时间       '+T.map(t=>t.slice(3)).join('  ')+'\npod="a"   '+D.a.map(v=>String(v).padStart(5)).join('  ')+'\npod="b"   '+D.b.map(v=>String(v).padStart(5)).join('  ')+'\n                                   ↑ 13:02 重启，计数器归零';
 const inc=v=>{let s=0;for(let i=1;i<v.length;i++){const d=v[i]-v[i-1];s+=d>=0?d:v[i]}return s};
 const Q=[['http_requests_total',()=>`{pod="a"} 1600\n{pod="b"} 200`,'','原始计数器值只说明“自进程启动以来一共多少”，本身没有意义；b 刚重启过所以很小。'],
  ['http_requests_total - http_requests_total offset 5m',()=>`{pod="a"} ${D.a[10]-D.a[0]}\n{pod="b"} ${D.b[10]-D.b[0]}`,'bad','直接相减不处理重置：b 得到负数。永远不要这样计算计数器。'],
  ['increase(http_requests_total[5m])',()=>`{pod="a"} ${inc(D.a)}\n{pod="b"} ${inc(D.b)}`,'ok',`increase 检测到值变小就认为发生了重置，把重置后的值当作增量：b = 30+30+30 + 20 + 30×6 = ${inc(D.b)}。（实际 Prometheus 还会按窗口边界做外推，结果略有出入。）`],
  ['rate(http_requests_total[5m])',()=>`{pod="a"} ${(inc(D.a)/300).toFixed(2)}\n{pod="b"} ${(inc(D.b)/300).toFixed(2)}`,'ok','rate = increase / 窗口秒数，即每秒请求数。图表和告警几乎总是用 rate。'],
  ['sum(rate(http_requests_total[5m]))',()=>`{} ${((inc(D.a)+inc(D.b))/300).toFixed(2)}`,'ok','先 rate 再 sum：每个序列单独处理重置后再相加。顺序反过来（rate(sum(...))）会把某个 Pod 的重置当成整体下降，PromQL 也不允许对表达式结果直接用 rate。'],
  ['rate(http_requests_total[30s])',()=>`{pod="a"} 2.00\n{pod="b"} （部分时刻为空）`,'bad','窗口内至少要有两个样本才能算速率。抓取间隔 30s 时窗口 30s 经常只有一个样本，曲线断断续续。窗口至少取抓取间隔的 4 倍，或在 Grafana 中用 $__rate_interval。']];
 const pq=document.getElementById('pq'),pr=document.getElementById('pr'),pm=document.getElementById('pm');
 Q.forEach(([q],i)=>{const b=document.createElement('button');b.className='btn';b.dataset.v=i;b.textContent=q;b.addEventListener('click',()=>run(i));pq.appendChild(b)});
 function run(i){pq.querySelectorAll('.btn').forEach(b=>b.classList.toggle('pri',+b.dataset.v===i));const [q,f,c,m]=Q[i];pr.textContent=`> ${q}    @13:05:00\n`+f();pm.className='msg '+c;pm.innerHTML=m}
 run(0)})();
Term(document.getElementById('t4'),[
['kubectl logs -l app=api --since=10m --prefix --max-log-requests=10 | grep -i error | head -3','[pod/api-7f9c-x2k9l/api] 2026-10-21T15:02:11Z ERROR upstream timeout db:5432\n[pod/api-7f9c-qw8r4/api] 2026-10-21T15:02:12Z ERROR upstream timeout db:5432','跨多个 Pod 看日志。长期保存和搜索要靠日志系统。'],
['kubectl get servicemonitors -A','NAMESPACE    NAME                          AGE\nmonitoring   mon-kube-state-metrics        2h\nshop         api                           5m','有哪些抓取声明。'],
['kubectl -n shop get --raw "/api/v1/namespaces/shop/pods/api-7f9c-x2k9l:9100/proxy/metrics" | grep ^http_requests_total | head -2','http_requests_total{code="200",method="GET"} 18273\nhttp_requests_total{code="500",method="GET"} 41','通过 API Server 代理直接看 Pod 暴露的指标。'],
['curl -s localhost:9090/api/v1/query --data-urlencode "query=up==0" | jq ".data.result | length"','0','抓取失败的目标数。'],
['curl -s localhost:9090/api/v1/status/tsdb | jq ".data.seriesCountByMetricName[:3]"','[{"name":"apiserver_request_duration_seconds_bucket","value":11248},{"name":"etcd_request_duration_seconds_bucket","value":5632}]','序列数最多的指标，排查基数问题。'],
['kubectl get events -A --field-selector type=Warning --sort-by=.lastTimestamp | tail -3','shop   2m   Warning   BackOff     pod/api-7f9c-x2k9l   Back-off restarting failed container\nshop   1m   Warning   Unhealthy   pod/api-7f9c-qw8r4   Readiness probe failed','事件只保留约 1 小时，可以用 kube-state-metrics 或事件导出器长期保存。']]);
Quiz(document.getElementById('qs'),[
['计算每秒请求数的正确写法？',['http_requests_total / 60','rate(http_requests_total[5m])','delta(http_requests_total[5m])'],1,'rate 处理计数器重置。'],
['Pod 被删除后还想看它的日志，需要？',['kubectl logs --previous','中心化日志系统','kubectl describe'],1,'--previous 只适用于同一个 Pod 里重启前的容器。'],
['多个 Pod 的 p99 延迟如何计算？',['对各 Pod 的 p99 求平均','先 sum by (le) 聚合 bucket，再 histogram_quantile','取最大值'],1,'分位数不能平均。'],
['以下哪个最不应该作为指标标签？',['status code','HTTP method','user_id'],2,'高基数。']]);
