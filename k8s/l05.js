const S=(t,s,c='',w=150)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});const P=(t,c='sig')=>({cls:'pill '+c,html:t});
Player(document.getElementById('p1'),{els:{c:S('客户端 Pod','wget api'),dns:P('api → 10.96.142.37','mute'),svc:S('Service api','10.96.142.37 · app=api','sig',200),a:P('10.244.1.7'),b:P('10.244.2.5'),cc:P('10.244.2.6'),nw:P('10.244.1.9（新）'),x:P('删除','bad'),es:{w:240,h:44,cls:'blk',html:'EndpointSlice：就绪 Pod 的 IP'},n:{w:640,cls:'tag'}},scenes:[
 {t:'问题',p:'客户端要访问 api。api 有 3 个 Pod，IP 各不相同，而且 Pod 被替换后 IP 会变。',set:{c:[0,80],a:[420,20],b:[420,80],cc:[420,140]}},
 {t:'Service',p:'Service 有一个固定的虚拟 IP 和 DNS 名字。客户端只认 <code>api</code>。',set:{c:[0,80],dns:[0,30],svc:[190,80],a:[420,20],b:[420,80],cc:[420,140]}},
 {t:'选择器 → 端点',p:'端点控制器持续查找带 <code>app=api</code> 标签且就绪的 Pod，把它们的 IP 写进 EndpointSlice。kube-proxy 据此设置转发规则。',d:3800,set:{c:[0,80],svc:[190,80],a:[420,20],b:[420,80],cc:[420,140],es:[190,180]}},
 {t:'Pod 被替换',p:'一个 Pod 被删除，新 Pod 带着新 IP 出现。端点列表自动更新，客户端毫无感知。',d:3800,set:{c:[0,80],svc:[190,80],a:[420,20],b:[420,80,{cls:'pill mute'}],x:[560,80],cc:[420,140],nw:[420,200],es:[190,180]}}]});
Player(document.getElementById('p2'),{els:{ci:S('ClusterIP','集群内部','',170),np:S('NodePort','节点IP:30080','',170),lb:S('LoadBalancer','外部负载均衡器','',170),hl:S('Headless','DNS → Pod IP 列表','',170),u:P('外部用户','mute'),pods:{w:170,h:40,cls:'blk sig',html:'Pods'},n:{w:640,cls:'tag'}},scenes:[
 {t:'ClusterIP',p:'默认类型。只在集群内部可达，内部服务之间互相调用都用它。',set:{ci:[200,100,{cls:'blk sig'}],pods:[440,106]}},
 {t:'NodePort',p:'在 ClusterIP 之上，每个节点打开同一个端口（30000–32767）。从集群外访问任意节点的这个端口都能到达 Service。',d:3600,set:{np:[0,100,{cls:'blk sig'}],ci:[200,100],pods:[440,106],u:[0,30]}},
 {t:'LoadBalancer',p:'在 NodePort 之上，云平台创建一个外部负载均衡器，有公网 IP，指向各节点的 NodePort。每个 Service 一个，成本较高；HTTP 服务通常共用一个 Ingress（第 8 课）。',d:4000,set:{lb:[0,30,{cls:'blk sig'}],np:[0,100],ci:[200,100],pods:[440,106]}},
 {t:'Headless',p:'<code>clusterIP: None</code>：没有虚拟 IP，也没有负载均衡。DNS 直接返回所有就绪 Pod 的 IP。',set:{hl:[200,100,{cls:'blk sig'}],pods:[440,106],n:[0,180,{html:'nslookup api-h → 10.244.1.7, 10.244.2.5, …'}]}}]});
(()=>{let sel='app=api';const pods=[{n:'api-1',l:'app=api',r:true},{n:'api-2',l:'app=api',r:false},{n:'api-3',l:'app=debug',r:true},{n:'web-1',l:'app=web',r:true}];
 const se=document.getElementById('sel'),pl=document.getElementById('pl'),ep=document.getElementById('ep'),sm=document.getElementById('sm');
 se.innerHTML='<span style="font:500 13px var(--m);margin-right:6px">selector：</span>';['app=api','app=web','（无选择器）'].forEach(v=>{const b=document.createElement('button');b.className='btn';b.textContent=v;b.dataset.v=v;b.addEventListener('click',()=>{sel=v;draw()});se.appendChild(b)});
 function draw(){se.querySelectorAll('.btn').forEach(b=>b.classList.toggle('pri',b.dataset.v===sel));
  pl.innerHTML=pods.map((p,i)=>`<div style="display:grid;grid-template-columns:70px 1fr 1fr;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line);font:500 13px var(--m)"><span>${p.n}</span><span class="cmds" style="margin:0">${['app=api','app=debug','app=web'].map(l=>`<button class="btn${p.l===l?' pri':''}" data-i="${i}" data-l="${l}">${l}</button>`).join('')}</span><span><button class="btn${p.r?' pri':''}" data-i="${i}" data-r="1">${p.r?'就绪':'未就绪'}</button></span></div>`).join('');
  pl.querySelectorAll('[data-l]').forEach(b=>b.addEventListener('click',()=>{pods[+b.dataset.i].l=b.dataset.l;draw()}));pl.querySelectorAll('[data-r]').forEach(b=>b.addEventListener('click',()=>{const p=pods[+b.dataset.i];p.r=!p.r;draw()}));
  if(sel==='（无选择器）'){ep.innerHTML='<div>EndpointSlice api：（不自动管理）</div>';sm.className='msg';sm.innerHTML='没有选择器的 Service 不会自动关联 Pod。你可以手动创建 EndpointSlice，指向集群外的地址（例如一个外部数据库），让集群内用统一的 Service 名访问它。';return}
  const m=pods.filter(p=>p.l===sel),r=m.filter(p=>p.r),nr=m.filter(p=>!p.r);
  ep.innerHTML=`<div>EndpointSlice api（selector ${sel}）</div>`+(m.length?m.map(p=>`<div>&nbsp;&nbsp;${p.n}  ready=${p.r}${p.r?'  ← 接收流量':''}</div>`).join(''):'<div>&nbsp;&nbsp;（空）</div>');
  let t=r.length?`流量分发到：<b>${r.map(p=>p.n).join('、')}</b>。`:'<b>没有可用端点</b>，请求会失败（connection refused 或超时）。';
  if(nr.length)t+=` ${nr.map(p=>p.n).join('、')} 匹配选择器但未就绪，被记录为 ready=false，不接收流量。`;
  if(pods.some(p=>p.l==='app=debug'))t+=' 标签为 app=debug 的 Pod 不在 Service 里：这是把一个 Pod 从流量中摘下来调试的常用办法（注意 Deployment 也会因此补一个新 Pod）。';
  sm.className='msg '+(r.length?'ok':'bad');sm.innerHTML=t}draw()})();
Term(document.getElementById('t4'),[
['kubectl expose deployment api --port 80 --target-port 8080','service/api exposed','从 Deployment 的选择器创建 Service。'],
['kubectl describe svc api','Name:              api\nSelector:          app=api\nType:              ClusterIP\nIP:                10.96.142.37\nPort:              <unset>  80/TCP\nTargetPort:        8080/TCP\nEndpoints:         10.244.1.7:8080,10.244.2.5:8080,10.244.2.6:8080','Endpoints 为空是最常见的 Service 问题：选择器写错、标签不匹配、Pod 未就绪。'],
['kubectl get endpointslices -l kubernetes.io/service-name=api','NAME        ADDRESSTYPE   PORTS   ENDPOINTS                          AGE\napi-x7k2p   IPv4          8080    10.244.1.7,10.244.2.5,10.244.2.6   5m','EndpointSlice 是 Endpoints 的新版本，大规模时把端点分片存储。'],
['kubectl run c --rm -it --image=busybox --restart=Never -- cat /etc/resolv.conf','search default.svc.cluster.local svc.cluster.local cluster.local\nnameserver 10.96.0.10\noptions ndots:5','Pod 的 DNS 配置：search 列表让短名字 <code>api</code> 能被解析；nameserver 是集群的 CoreDNS Service。'],
['kubectl port-forward svc/api 8080:80','Forwarding from 127.0.0.1:8080 -> 8080','调试用：把本机端口转发到 Service 背后的一个 Pod（不做负载均衡）。'],
['kubectl get svc -A','NAMESPACE     NAME         TYPE        CLUSTER-IP   PORT(S)\ndefault       kubernetes   ClusterIP   10.96.0.1    443/TCP\nkube-system   kube-dns     ClusterIP   10.96.0.10   53/UDP,53/TCP,9153/TCP','<code>kubernetes</code> Service 就是 API Server；Pod 里的程序用它访问 API（第 19、20 课）。']]);
Quiz(document.getElementById('qs'),[
['Service 的 Endpoints 为空，最可能的原因？',['节点宕机','选择器和 Pod 标签不匹配，或 Pod 未就绪','DNS 坏了'],1,'describe svc 和 get pods --show-labels 对比。'],
['ClusterIP 由谁实现转发？',['一个代理 Pod','每个节点上的 kube-proxy 设置的规则','etcd'],1,'它不是一个真实的网卡地址（第 14 课）。'],
['在 shop 命名空间的 Pod 里访问 default 命名空间的 api 服务，可以用？',['api','api.default','只能用 IP'],1,'短名字只在同一命名空间内有效。'],
['Headless Service 的 DNS 返回？',['一个虚拟 IP','所有就绪 Pod 的 IP','节点 IP'],1,'客户端直接连 Pod。']]);
