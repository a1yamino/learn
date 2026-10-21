const S=(t,s,c='',w=150)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});const P=(t,c='sig')=>({cls:'pill '+c,html:t});
Player(document.getElementById('p1'),{els:{kl:S('kubelet / cAdvisor','每个节点','',150),ms:S('metrics-server','metrics.k8s.io','',150),h:S('HPA 控制器','每 15 秒','',150),d:S('Deployment','replicas','',150),f:P('ceil(4 × 90% / 60%) = 6','sig'),r:P('replicas: 4 → 6','ok'),w:P('缩容：5 分钟内的最大推荐值','mute'),n:{w:700,cls:'tag'}},scenes:[
 {t:'采集',p:'metrics-server 定期从每个 kubelet 拉取容器的 CPU 和内存用量，通过聚合 API 提供 <code>kubectl top</code> 和 HPA 使用。它只保存最新值。',d:3800,set:{kl:[0,40,{cls:'blk sig'}],ms:[190,40,{cls:'blk sig'}],h:[380,40],d:[570,40]}},
 {t:'计算',p:'HPA 取所有 Pod 的平均利用率（用量 / requests），和目标值比较，按公式算出期望副本数。',d:3600,set:{kl:[0,40],ms:[190,40],h:[380,40,{cls:'blk sig'}],d:[570,40],f:[330,130]}},
 {t:'调整',p:'HPA 修改 Deployment 的 scale 子资源。之后是 Deployment 控制器、调度器、kubelet 的事。',d:3400,set:{kl:[0,40],ms:[190,40],h:[380,40],d:[570,40,{cls:'blk ok'}],f:[330,130],r:[560,130]}},
 {t:'防抖',p:'扩容立即生效；缩容取过去 5 分钟内算出的最大值，避免负载一降就缩、一涨又扩。未就绪的 Pod 和刚启动的 Pod 的 CPU 会被特殊处理，以免启动时的高 CPU 造成误判。',d:4400,set:{kl:[0,40],ms:[190,40],h:[380,40,{cls:'blk sig'}],d:[570,40],w:[330,130]}}]});
const N=k=>({w:200,h:120,cls:'frame',html:`<i>${k}</i>`});
Player(document.getElementById('p2'),{els:{n1:N('node-1（满）'),n2:N('node-2（满）'),n3:N('node-3（新）'),a:S('api-5','Pending','',130),ca:S('Cluster Autoscaler','或 Karpenter','',170),cl:S('云厂商','创建虚拟机','',130),x:P('Pod 被驱逐到其他节点（遵守 PDB）','mute'),n:{w:700,cls:'tag'}},scenes:[
 {t:'放不下',p:'HPA 加了副本，但所有节点剩余 requests 不够，Pod Pending，事件 Insufficient cpu。',set:{n1:[0,0],n2:[230,0],a:[40,170,{cls:'blk bad'}]}},
 {t:'决定加节点',p:'自动扩缩器 watch 到因资源不足而无法调度的 Pod，模拟“如果加一个某种规格的节点能否放下”。Cluster Autoscaler 按节点组扩，Karpenter 直接按 Pod 需求选实例类型。',d:4400,set:{n1:[0,0],n2:[230,0],a:[40,170,{cls:'blk bad'}],ca:[460,170,{cls:'blk sig'}],cl:[660,170]}},
 {t:'节点加入',p:'新虚拟机启动、kubelet 注册、CNI 就绪，通常需要 1–3 分钟。调度器随后把 Pending 的 Pod 放上去。',d:3800,set:{n1:[0,0],n2:[230,0],n3:[460,0,{cls:'frame'}],a:[495,40,{cls:'blk ok'}],ca:[460,170],cl:[660,170]}},
 {t:'缩减节点',p:'节点的 requests 利用率长时间低于阈值，且上面的 Pod 都能挪到别处：先驱逐，再删除节点。带本地存储、PDB 不允许、或标注 <code>safe-to-evict: false</code> 的 Pod 会阻止缩容。',d:4400,set:{n1:[0,0],n2:[230,0],n3:[460,0,{cls:'frame'}],x:[460,140]}}]});
(()=>{const C=[0.2,0.33,0.62,0.9,2],cur=4,req=500,tgt=0.6,mn=2,mx=10;
 const hl=document.getElementById('hl'),hc=document.getElementById('hc'),hm=document.getElementById('hm');
 C.forEach(u=>{const b=document.createElement('button');b.className='btn';b.dataset.v=u;b.textContent=Math.round(u*req)+'m（'+Math.round(u*100)+'%）';b.addEventListener('click',()=>run(u));hl.appendChild(b)});
 function run(u){hl.querySelectorAll('.btn').forEach(b=>b.classList.toggle('pri',+b.dataset.v===u));const r=u/tgt,raw=cur*r,des=Math.ceil(raw-1e-9),inTol=Math.abs(r-1)<=0.1;let fin=inTol?cur:Math.min(mx,Math.max(mn,des));
  hc.innerHTML=`<div>平均利用率 = ${Math.round(u*req)}m / ${req}m = ${Math.round(u*100)}%</div><div>比值 = ${Math.round(u*100)}% / 60% = ${r.toFixed(2)}</div><div>${inTol?'在 1 ± 0.1 容差内 → 不调整':`期望 = ceil(${cur} × ${r.toFixed(2)}) = ceil(${raw.toFixed(2)}) = ${des}`}</div><div>限制到 [${mn}, ${mx}] → <b>${fin}</b></div>`;
  const m=inTol?'变化在 10% 以内，不做调整，避免频繁小幅变化。':fin>cur?(des>mx?`需要 ${des} 个，但被 maxReplicas 限制为 ${mx}。每个 Pod 仍会超载，HPA 状态显示 ScalingLimited。`:`扩容到 ${fin}，立即生效。扩容后平均利用率预期降到约 ${Math.round(u*cur/fin*100)}%。`):des<mn?`算出 ${des} 个，但不低于 minReplicas ${mn}。并且缩容要等 5 分钟稳定窗口。`:`缩容到 ${fin}，但要等 5 分钟稳定窗口内的推荐值都不高于它。`;
  hm.className='msg '+(inTol?'':fin>cur?(des>mx?'bad':'ok'):'');hm.innerHTML=m}
 run(0.9)})();
Term(document.getElementById('t4'),[
['kubectl top pods --sort-by=cpu | head -4','NAME                   CPU(cores)   MEMORY(bytes)\nphp-5d8b9c7f6-x2k9l    198m         12Mi\nphp-5d8b9c7f6-qw8r4    187m         11Mi','当前用量（来自 metrics-server）。'],
['kubectl get hpa php -o yaml | grep -A6 "conditions:"','  conditions:\n  - type: AbleToScale\n    status: "True"\n  - type: ScalingActive\n    status: "True"\n  - type: ScalingLimited','ScalingActive=False 通常是取不到指标（没有 requests 或 metrics-server 不可用）。'],
['kubectl get --raw /apis/metrics.k8s.io/v1beta1/namespaces/default/pods | jq ".items[0].containers"','[{"name":"hpa-example","usage":{"cpu":"198m","memory":"12Mi"}}]','HPA 读到的原始数据。'],
['kubectl describe hpa php | grep "cpu resource"','  resource cpu on pods  (as a percentage of request):  62% (124m) / 50%','同时给出百分比和绝对值。'],
['kubectl -n kube-system logs deploy/cluster-autoscaler | grep -i "scale-up"','I1021 ScaleUp: group ng-1 1->2 (max: 10)','Cluster Autoscaler 的扩容决定（云上集群）。'],
['kubectl get vpa api -o jsonpath="{.status.recommendation.containerRecommendations[0].target}"','{"cpu":"320m","memory":"280Mi"}','VPA 的 requests 推荐值。updateMode: Off 只推荐不修改，适合先观察。']]);
Quiz(document.getElementById('qs'),[
['Pod 没有设置 CPU requests，按 CPU 利用率的 HPA 会？',['正常工作','无法计算利用率','按 limits 算'],1,'利用率相对 requests。'],
['3 个副本，平均 CPU 90%，目标 60%，期望副本数？',['4','5','6'],1,'ceil(3×1.5)=5。'],
['负载下降后 HPA 为什么没有立即缩容？',['bug','默认 5 分钟稳定窗口','需要手动确认'],1,'防止抖动。'],
['节点实际 CPU 使用率很低，Cluster Autoscaler 仍不缩减节点，可能原因？',['节点 requests 已分配很多','节点太新','HPA 关闭'],0,'它看 requests，以及 Pod 能否被挪走。']]);
