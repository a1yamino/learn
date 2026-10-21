const S=(t,s,c='',w=140)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});const P=(t,c='sig')=>({cls:'pill '+c,html:t});
Player(document.getElementById('p1'),{els:{n1:{w:300,h:230,cls:'frame',html:'<i>节点 1 · 172.18.0.3 · 10.244.1.0/24</i>'},n2:{w:300,h:230,cls:'frame',html:'<i>节点 2 · 172.18.0.4 · 10.244.2.0/24</i>'},a:S('Pod A','10.244.1.5'),b:S('Pod B','10.244.1.6'),c:S('Pod C','10.244.2.7'),br:{w:250,h:30,cls:'blk',html:'veth → 节点网络栈 / 网桥'},rt:P('路由：10.244.2.0/24 via 172.18.0.4','mute'),pk:P('src 10.244.1.5 → dst 10.244.2.7'),en:P('或封装：VXLAN / Geneve','mute'),n:{w:700,cls:'tag'}},scenes:[
 {t:'每个 Pod 一个 IP',p:'CNI 为每个 Pod 建一对 veth：一端在 Pod 的网络命名空间里（eth0），一端在节点上。每个节点分到一段 Pod 网段。',set:{n1:[0,0],n2:[380,0],a:[20,40],b:[160,40],c:[400,40],br:[25,130]}},
 {t:'同一节点',p:'A → B：包从 A 的 veth 出来，进入节点网络栈，按主机路由（或网桥）直接送进 B 的 veth。',set:{n1:[0,0],n2:[380,0],a:[20,40,{cls:'blk sig'}],b:[160,40,{cls:'blk sig'}],c:[400,40],br:[25,130]}},
 {t:'跨节点：路由',p:'A → C：节点 1 查路由表，10.244.2.0/24 的下一跳是节点 2。包的源和目的都是 Pod IP，<b>没有 NAT</b>。kindnet、Calico（BGP）、云厂商 CNI 用这种方式。',d:4200,set:{n1:[0,0],n2:[380,0],a:[20,40,{cls:'blk sig'}],b:[160,40],c:[400,40,{cls:'blk sig'}],br:[25,130],rt:[25,180],pk:[180,250]}},
 {t:'跨节点：封装',p:'底层网络不认识 Pod 网段时（例如无法改路由表），CNI 把 Pod 的包封装在节点之间的 UDP 包里（Docker 第 24 课的 VXLAN）。对 Pod 来说没有区别。',d:3800,set:{n1:[0,0],n2:[380,0],a:[20,40],c:[400,40],en:[180,250]}}]});
Player(document.getElementById('p2'),{els:{c:S('客户端 Pod','wget 10.96.88.14:80','',170),k:{w:300,h:110,cls:'frame',html:'<i>节点上的 iptables（kube-proxy 写入）</i>'},r1:P('KUBE-SERVICES：匹配 10.96.88.14:80','mute'),r2:P('KUBE-SVC：随机选一个端点','mute'),r3:P('KUBE-SEP：DNAT → 10.244.2.7:8080','mute'),p:S('Pod','10.244.2.7:8080'),ep:P('EndpointSlice 变化 → kube-proxy 更新规则','mute'),n:{w:700,cls:'tag'}},scenes:[
 {t:'发往虚拟 IP',p:'客户端连接 ClusterIP。没有任何网卡拥有这个地址。',set:{c:[0,40]}},
 {t:'规则匹配',p:'包在<b>客户端所在节点</b>的内核里经过 kube-proxy 写的规则：先匹配 Service，再随机选一个端点。',d:3600,set:{c:[0,40],k:[210,0],r1:[220,30],r2:[220,62]}},
 {t:'DNAT',p:'目的地址被改写为真实 Pod 的 IP 和端口，之后就是普通的 Pod 到 Pod 通信。回包时内核（conntrack）自动把源地址改回 ClusterIP。',d:4000,set:{c:[0,40],k:[210,0],r1:[220,30],r2:[220,62],r3:[220,94,{cls:'pill sig'}],p:[560,40,{cls:'blk sig'}]}},
 {t:'规则跟随端点',p:'kube-proxy watch EndpointSlice，端点变化就重写规则。规则在每个节点上都有，所以没有单点。IPVS / nftables 模式和 eBPF（Cilium）实现同样的语义，效率更高。',d:4000,set:{c:[0,40],k:[210,0],r3:[220,94],p:[560,40],ep:[200,150]}}]});
(()=>{const SEARCH=['shop.svc.cluster.local','svc.cluster.local','cluster.local'];
 const ZONE={'api.shop.svc.cluster.local':'10.96.12.5','db.data.svc.cluster.local':'10.96.40.2','example.com':'93.184.215.14','api.example.com':'203.0.113.10'};
 const N=['api','db.data','db.data.svc.cluster.local','api.example.com','api.example.com.'];
 const dn=document.getElementById('dn'),dq=document.getElementById('dq'),dm=document.getElementById('dm');
 N.forEach(n=>{const b=document.createElement('button');b.className='btn';b.textContent=n;b.dataset.v=n;b.addEventListener('click',()=>run(n));dn.appendChild(b)});
 function run(name){dn.querySelectorAll('.btn').forEach(b=>b.classList.toggle('pri',b.dataset.v===name));const L=[];let ans=null;
  const abs=name.endsWith('.');const dots=(name.match(/\./g)||[]).length;const q=x=>{const r=ZONE[x];L.push(`查询 ${x}.  →  ${r?r:'NXDOMAIN'}`);if(r)ans=r;return !!r};
  if(abs){q(name.slice(0,-1))}else if(dots>=5){q(name)||SEARCH.some(s=>q(name+'.'+s))}else{SEARCH.some(s=>q(name+'.'+s))||q(name)}
  dq.innerHTML=L.map(x=>`<div>${x}</div>`).join('');const n=L.length;
  const msg={'api':'短名字：第一个 search 域就命中（同命名空间的 Service）。','db.data':'“服务.命名空间”：第一个 search 域拼出 db.data.shop.svc… 不存在，第二个命中。','db.data.svc.cluster.local':'完整的集群域名也只有 4 个点（少于 5），仍然先试 search 域，浪费了 3 次查询。','api.example.com':'外部域名有 2 个点（少于 5）：先把 3 个 search 域都试一遍，全部 NXDOMAIN，第 4 次才查到。每次请求都这样会放大 DNS 负载和延迟（每次查询还分 A 和 AAAA）。','api.example.com.':'结尾的点表示“已是完整域名”，跳过 search，只查 1 次。也可以在 Pod 的 dnsConfig 里把 ndots 调成 2。'}[name];
  dm.className='msg '+(n===1?'ok':n>2?'bad':'');dm.innerHTML=`共 ${n} 次查询。`+msg}run('api')})();
Term(document.getElementById('t4'),[
['kubectl -n kube-system get pods -l k8s-app=kube-dns -o wide','NAME                       READY   STATUS    IP\ncoredns-7db6d8ff4d-4kq2x   1/1     Running   10.244.0.3\ncoredns-7db6d8ff4d-h8zmw   1/1     Running   10.244.0.2','CoreDNS 是普通的 Deployment，通过 kube-dns Service（10.96.0.10）对外提供服务。'],
['kubectl -n kube-system get configmap coredns -o jsonpath="{.data.Corefile}"','.:53 {\n    errors\n    health\n    kubernetes cluster.local in-addr.arpa ip6.arpa {\n       pods insecure\n       fallthrough in-addr.arpa ip6.arpa\n    }\n    forward . /etc/resolv.conf\n    cache 30\n}','kubernetes 插件回答集群内的名字，其余的 forward 给上游 DNS。'],
['kubectl -n kube-system get configmap kube-proxy -o jsonpath="{.data.config\\.conf}" | grep mode','mode: iptables','kube-proxy 的模式：iptables、ipvs 或 nftables。'],
['docker exec learn-worker conntrack -L -p tcp --dport 80 2>/dev/null | head -2','tcp 6 86397 ESTABLISHED src=10.244.2.7 dst=10.96.88.14 sport=41822 dport=80 src=10.244.1.9 dst=10.244.2.7 sport=80 dport=41822 [ASSURED]','连接跟踪表：原始方向是 ClusterIP，回复方向是真实 Pod。DNAT 就记录在这里。'],
['kubectl run t --rm -it --image=nicolaka/netshoot -- bash','tmp-shell:~# dig +search api\ntmp-shell:~# tcpdump -i eth0 port 53','netshoot 带齐了网络调试工具：dig、tcpdump、curl、iperf、ss。'],
['kubectl get pod b -o yaml | grep -A4 dnsConfig','  dnsConfig:\n    options:\n    - name: ndots\n      value: "2"','按 Pod 调整 DNS 选项。']]);
Quiz(document.getElementById('qs'),[
['Kubernetes 网络模型要求 Pod 之间？',['必须经过 NAT','不经 NAT 直接互通','只能通过 Service'],1,'每个 Pod 一个可直达的 IP。'],
['ClusterIP 的转发在哪里发生？',['一个中心代理 Pod','客户端所在节点的内核规则','API Server'],1,'kube-proxy 在每个节点写规则。'],
['ndots:5 时解析 api.example.com 会先发生什么？',['直接查询','依次尝试 search 域','报错'],1,'少于 5 个点。'],
['gRPC 长连接通过 ClusterIP 访问 3 个副本，流量会？',['按请求均匀分配','一直落在建立连接时选中的那个 Pod','广播到全部'],1,'iptables 规则按连接负载均衡。']]);
