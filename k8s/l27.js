const S=(t,s,c='',w=130)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});const P=(t,c='sig')=>({cls:'pill '+c,html:t});
Player(document.getElementById('p1'),{els:{u:S('用户','shop.localtest.me','',140),gw:S('Gateway','Traefik · 第 8 课','',150),web:S('web ×3','Deployment · HPA','',140),api:S('api ×3','探针 · PDB · 第 9、18 课','',170),db:S('PostgreSQL ×3','CNPG Operator · 第 17、19 课','',190),sec:P('restricted · 默认拒绝 · 最小 RBAC（第 20、21 课）','mute'),git:S('Git','Kustomize · 第 22 课','',140),ar:S('Argo CD','第 23 课','',120),mon:S('Prometheus','告警 · 第 24 课','',140),bk:S('备份','第 26 课','',110),n:{w:700,cls:'tag'}},scenes:[
 {t:'请求路径',p:'用户 → Gateway → web → api → 数据库。每一跳都有多副本，并分布在不同节点上。',d:3600,set:{u:[0,0],gw:[0,80,{cls:'blk sig'}],web:[190,80,{cls:'blk sig'}],api:[360,80,{cls:'blk sig'}],db:[560,80,{cls:'blk sig'}]}},
 {t:'安全边界',p:'命名空间 shop 开启 restricted Pod 安全级别；网络策略默认拒绝，只放行请求路径上的连接和 DNS；每个组件用独立的 ServiceAccount，不挂载不需要的令牌。',d:4200,set:{u:[0,0],gw:[0,80],web:[190,80],api:[360,80],db:[560,80],sec:[0,160]}},
 {t:'交付',p:'所有清单在 Git 中，Argo CD 持续同步。CI 只负责构建镜像并修改 Git 中的标签。',d:3600,set:{gw:[0,80],web:[190,80],api:[360,80],db:[560,80],git:[0,200,{cls:'blk sig'}],ar:[190,200,{cls:'blk sig'}]}},
 {t:'运维',p:'Prometheus 抓取各组件指标并按症状告警；数据库每晚备份到对象存储，并定期恢复演练。',d:3600,set:{gw:[0,80],web:[190,80],api:[360,80],db:[560,80],git:[0,200],ar:[190,200],mon:[360,200,{cls:'blk sig'}],bk:[560,200,{cls:'blk sig'}]}}]});
const PH=[['p1','1 集群与命名空间','PSA · 配额 · 默认拒绝'],['p2','2 数据库','Operator · 3 实例'],['p3','3 应用','探针 · 资源 · PDB · HPA'],['p4','4 入口','Gateway · HTTPRoute'],['p5','5 交付与可观测','Argo CD · 监控'],['p6','6 备份与演练','恢复验证 · 故障演练']];
const e2={n:{w:700,cls:'tag'}};PH.forEach(([k,t,s])=>e2[k]=S(t,s,'',200));const pos=i=>[(i%3)*225,Math.floor(i/3)*90];
const upto=n=>{const o={};PH.forEach(([k],i)=>o[k]=[...pos(i),{cls:i<n-1?'blk ok':i===n-1?'blk sig':'blk mute'}]);return o};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'先打地基',p:'命名空间级的约束先就位，之后部署的每个工作负载都会立即受到检查：不合规的 Pod 在第一天就会被拒绝，而不是上线后再整改。',d:4000,set:upto(1)},
 {t:'有状态在前',p:'先创建数据库所需的网络放行规则和资源声明，再部署并等待数据库就绪，验证复制与故障切换后让应用接入。',d:3600,set:upto(2)},
 {t:'应用与入口',p:'应用就绪后再开放入口。每一步都有验证命令：rollout status、端点、curl 健康检查。',d:3600,set:upto(4)},
 {t:'可运维才算上线',p:'交给 GitOps 管理、有告警、备份恢复过、故障演练过，才算完成。',d:3600,set:upto(6)}]});
(()=>{const I=[['req','每个容器设置 requests 和 limits.memory',1,'调度不准确，节点可能超卖；HPA 无法按 CPU 利用率工作；内存泄漏会拖垮整个节点。','第 9 课'],
 ['probe','readiness 与 liveness 探针（liveness 不检查外部依赖）',1,'启动中或不健康的 Pod 也会接收流量；或者数据库一抖动，所有 Pod 被 liveness 一起重启。','第 9 课'],
 ['rep','至少 3 副本，topologySpreadConstraints 分散到节点和可用区',0,'副本可能都在同一个节点上，一个节点故障就全部中断。','第 15 课'],
 ['pdb','PodDisruptionBudget（maxUnavailable: 1）',0,'drain 或节点缩容时可能同时驱逐多个副本，维护操作会造成中断。','第 26 课'],
 ['roll','RollingUpdate，maxUnavailable: 0',0,'坏版本发布时旧 Pod 可能先被删掉，造成整体不可用（第 25 课的事故）。','第 4、25 课'],
 ['sec','securityContext 满足 restricted',1,'命名空间开启 enforce 后 Pod 无法创建；容器以 root 运行，被攻破后影响更大。','第 21 课'],
 ['sa','独立 ServiceAccount，不挂载不需要的令牌',0,'使用 default SA，令牌可被窃取，权限难以审计。','第 20 课'],
 ['np','NetworkPolicy：只允许 web → api → db 与 DNS',0,'任何被攻破的 Pod 都能直接连接数据库。','第 21 课'],
 ['img','镜像用不可变标签或摘要，来自可信仓库',1,'无法确定线上运行的是什么代码，回滚也不可靠。','第 23 课'],
 ['obs','暴露 /metrics，有 ServiceMonitor 和基于症状的告警',0,'出问题时只能靠用户报告才知道。','第 24 课'],
 ['term','处理 SIGTERM，preStop 短暂等待，grace period 足够',0,'每次发布和缩容都会有一批请求失败（连接被中断）。','第 13 课'],
 ['git','全部清单在 Git 中，由 GitOps 同步',1,'集群状态无法审查和重建，灾难恢复时不知道该恢复什么。','第 23 课']];
 const st={};I.forEach(([k,,v])=>st[k]=!!v);const el=document.getElementById('rc'),rm=document.getElementById('rm');
 el.innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:8px;margin:0 0 12px"></div>';const g=el.firstChild;
 I.forEach(([k,t,,,l])=>{const b=document.createElement('button');b.className='btn';b.dataset.v=k;b.style.cssText='text-align:left;white-space:normal;height:auto;line-height:1.5;padding:10px 12px;border-radius:10px';b.addEventListener('click',()=>{st[k]=!st[k];draw()});b.innerHTML=`<span class="ck"></span> ${t} <span style="opacity:.6;font-weight:400">· ${l}</span>`;g.appendChild(b)});
 function draw(){g.querySelectorAll('.btn').forEach(b=>{const on=st[b.dataset.v];b.classList.toggle('pri',on);b.querySelector('.ck').textContent=on?'✓':'○'});
  const miss=I.filter(([k])=>!st[k]);rm.className='msg '+(miss.length?'bad':'ok');
  rm.innerHTML=miss.length?`已满足 ${I.length-miss.length}/${I.length}。还缺：<ul style="margin:6px 0 0 18px">${miss.map(([,t,,c])=>`<li><b>${t}</b>：${c}</li>`).join('')}</ul>`:'全部满足。接下来做一次故障演练（本课挑战），验证这些设置在真实故障中确实生效。'}
 draw()})();
Term(document.getElementById('t4'),[
['kubectl -n shop get all,pdb,hpa,netpol,quota','NAME                        READY   STATUS    RESTARTS   AGE\npod/api-7f9c-x2k9l          1/1     Running   0          1h\n…','一次查看命名空间内的主要资源（all 并不包含所有类型）。'],
['kubectl -n shop get pods -o custom-columns=NAME:.metadata.name,NODE:.spec.nodeName,ZONE:.metadata.labels.topology\\.kubernetes\\.io/zone','NAME             NODE            ZONE\napi-7f9c-x2k9l   learn-worker    \napi-7f9c-qw8r4   learn-worker2   \napi-7f9c-k2p9x   learn-worker3   ','确认副本确实分散在不同节点。'],
['kubectl -n shop get pods -o json | jq -r \'.items[] | select(any(.spec.containers[]; .resources.requests == null)) | .metadata.name\'','（无输出）','找出没有设置 requests 的 Pod。'],
['kubectl auth can-i --list -n shop --as=system:serviceaccount:shop:api','Resources   Non-Resource URLs   Resource Names   Verbs\nselfsubjectreviews.authentication.k8s.io  []  []  [create]','api 的 ServiceAccount 对 API 没有任何业务权限。'],
['kubectl -n shop get cluster db -o jsonpath="{.status.currentPrimary} {.status.readyInstances}/{.status.instances}"','db-2 3/3','数据库当前的 primary 和实例数。'],
['kubectl label --dry-run=server --overwrite ns shop pod-security.kubernetes.io/enforce=restricted','namespace/shop labeled (server dry run)','没有警告，说明命名空间中所有 Pod 都满足 restricted。']]);
Quiz(document.getElementById('qs'),[
['新应用上线前，哪一项最应该先就位？',['HPA','命名空间级的 Pod 安全、配额与默认拒绝','Grafana 仪表板'],1,'地基先行，后续工作负载一开始就合规。'],
['liveness 探针检查数据库连接会导致？',['更可靠','数据库抖动时所有 Pod 被同时重启','没有影响'],1,'liveness 只检查进程自身。'],
['3 副本都在同一个节点上，缺少了什么？',['PDB','拓扑分布约束或反亲和','HPA'],1,'调度器默认不保证分散。'],
['怎样确认备份可用？',['备份任务显示成功','定期恢复到独立环境并验证数据','检查文件大小'],1,'没有恢复过的备份不算备份。'],
['向 Git 提交了一个 readiness 永远失败的版本，在 maxUnavailable: 0 下会？',['服务中断','新 Pod 不就绪，旧 Pod 保留，发布停止','Argo CD 拒绝同步'],1,'需要人 git revert。']]);
