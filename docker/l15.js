const N=(t,s,c='',w=220)=>({w,h:56,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const base={eth:[0,0],pre:[0,90],fw:[0,180],br:[0,270],veth:[0,360],ct:[0,450]};
const E={eth:N('eth0','192.168.1.10'),pre:N('PREROUTING → DOCKER','nat 表','dim'),fw:N('FORWARD','filter 表 · DOCKER-USER','dim'),br:N('docker0','网桥 172.17.0.1','ink'),veth:N('vethb3a1 ⇄ eth0','veth 对'),ct:N('nginx :80','容器 172.17.0.2'),
 pk:{cls:'pill sig'},n:{w:340,cls:'tag'}};
const pk=(y,t)=>({pk:[250,y+16,{html:t}]});
Player(document.getElementById('p1'),{els:E,scenes:[
 {t:'到达宿主机网卡',p:'请求：目的地址 192.168.1.10:8080。',set:{...base,...pk(0,'dst 192.168.1.10:8080')}},
 {t:'DNAT',p:'nat 表 PREROUTING 跳到 DOCKER 链，命中 <code>-p 8080:80</code> 生成的规则，目的地址被改成 <b>172.17.0.2:80</b>。conntrack 记住这个改写，回包时自动改回来。',d:3800,set:{...base,pre:[0,90,{cls:'blk sig'}],...pk(90,'dst 172.17.0.2:80')}},
 {t:'FORWARD',p:'目的地址不是本机了，所以走 FORWARD 链，而不是 INPUT 链。<b>ufw 的规则在 INPUT 链</b>，于是被绕过了。',d:3800,set:{...base,fw:[0,180,{cls:'blk sig'}],...pk(180,'dst 172.17.0.2:80'),n:[250,240,{html:'ufw / INPUT 链：<b>没有经过</b>'}]}},
 {t:'网桥和 veth',p:'路由表说 172.17.0.0/16 在 docker0 上。网桥根据 MAC 地址把包交给对应的 veth，从另一端（容器的 eth0）出来。',set:{...base,br:[0,270,{cls:'blk sig'}],veth:[0,360,{cls:'blk sig'}],...pk(360,'dst 172.17.0.2:80')}},
 {t:'到达容器',p:'nginx 收到一个发往自己 80 端口的普通请求。',set:{...base,ct:[0,450,{cls:'blk sig'}],...pk(450,'到达')}}]});
const O={ct:[0,0],veth:[0,90],br:[0,180],post:[0,270],eth:[0,360]};
Player(document.getElementById('p2'),{els:{ct:N('容器 172.17.0.2','curl api.github.com'),veth:N('eth0 ⇄ veth',''),br:N('docker0','默认网关 172.17.0.1','ink'),post:N('POSTROUTING','MASQUERADE 172.17.0.0/16','dim'),eth:N('eth0','192.168.1.10'),pk:{cls:'pill sig'}},scenes:[
 {t:'容器发出请求',p:'源地址 172.17.0.2。容器的默认路由指向 docker0（172.17.0.1）。',set:{...O,pk:[250,16,{html:'src 172.17.0.2'}]}},
 {t:'经过网桥到宿主机',p:'宿主机开启了 ip_forward，查路由表，从 eth0 发出。',set:{...O,pk:[250,196,{html:'src 172.17.0.2'}]}},
 {t:'MASQUERADE',p:'外网不认识 172.17.x.x。nat 表 POSTROUTING 链的 MASQUERADE 规则把源地址改成 eth0 的地址。回包按 conntrack 记录改回容器地址。',d:3800,set:{...O,post:[0,270,{cls:'blk sig'}],pk:[250,286,{html:'src 192.168.1.10'}]}}]});
(()=>{let sc='in',ufw=false;const S=document.getElementById('sc'),F=document.getElementById('fw'),H=document.getElementById('hops'),M=document.getElementById('hm');
 const SC={in:'外部访问 -p 8080:80',bind:'外部访问 -p 127.0.0.1:8080:80',out:'容器访问外网',same:'同网络容器按名字访问',diff:'跨网络访问'};
 Object.entries(SC).forEach(([k,l])=>{const b=document.createElement('button');b.className='btn';b.textContent=l;b.dataset.k=k;b.addEventListener('click',()=>{sc=k;draw()});S.appendChild(b)});
 const u=document.createElement('button');u.className='btn';u.addEventListener('click',()=>{ufw=!ufw;draw()});F.appendChild(u);
 function draw(){S.querySelectorAll('.btn').forEach(b=>b.classList.toggle('pri',b.dataset.k===sc));u.textContent='ufw deny 8080：'+(ufw?'已开启':'未开启');u.classList.toggle('pri',ufw);
  const H1={in:[['eth0 收到 dst 192.168.1.10:8080',''],['PREROUTING → DOCKER：DNAT 到 172.17.0.2:80','r'],['FORWARD → DOCKER-USER（空）→ DOCKER：放行',''],['docker0 → veth → 容器 eth0',''],['nginx 收到请求','o']],
   bind:[['eth0 收到 dst 192.168.1.10:8080',''],['PREROUTING → DOCKER：规则只匹配 dst 127.0.0.1，不命中',''],['INPUT：本机 8080 没有程序监听','x']],
   out:[['容器 eth0 发出 src 172.17.0.2',''],['veth → docker0 → 宿主机路由：从 eth0 发出',''],['FORWARD：放行',''],['POSTROUTING：MASQUERADE，src 改为 192.168.1.10','r'],['到达外网，回包经 conntrack 改回','o']],
   same:[['api 查询 db：发往 127.0.0.11:53',''],['容器内 iptables：重定向到 dockerd 内置 DNS 的随机端口','r'],['返回 db = 172.19.0.3',''],['api → br-1a2b 网桥 → db 的 veth（同一网桥，二层转发）',''],['到达 db','o']],
   diff:[['api（172.19.0.2，br-1a2b）发往 172.20.0.3（br-9c8d）',''],['FORWARD → DOCKER-ISOLATION-STAGE-1/2：两个 Docker 网桥之间的流量','r'],['DROP','x']]}[sc];
  let hops=H1;if(ufw&&sc==='in')hops=[...H1.slice(0,2),['（ufw 的 deny 规则在 INPUT 链，这个包根本不经过 INPUT）','x2'],...H1.slice(2)];
  H.innerHTML=hops.map(([t,c])=>`<li style="${c==='r'?'color:var(--sig)':c==='o'?'color:var(--ok)':c==='x'?'color:var(--bad)':c==='x2'?'color:var(--ink2);font-style:italic':''}">${t}</li>`).join('');
  M.className='msg';M.innerHTML={in:ufw?'<b>ufw 拒绝了 8080，外部仍然能访问。</b>这是 Docker 在服务器上最常见的安全事故之一。用 DOCKER-USER 链，或绑定 127.0.0.1。':'正常访问。',bind:'只绑定 127.0.0.1：外部访问失败，本机反向代理（如 nginx）仍然可以访问。推荐做法。',out:'出站只靠一条 MASQUERADE 规则。',same:'DNS 由 dockerd 提供，容器之间直接通过网桥通信，不经过 NAT。',diff:'Docker 用隔离链阻止不同网络之间的流量。要互通，把容器同时接入两个网络。'}[sc]}draw()})();
Term(document.getElementById('t4'),[
['ip -brief link show type veth; bridge link','vethb3a1@if7   UP   aa:1c:…\nvethb3a1: <BROADCAST,MULTICAST,UP> master docker0 state forwarding','宿主机上的 veth 一端。<b>master docker0</b> 说明它接在网桥上。@if7 对应容器里 eth0 的接口编号。'],
['sudo iptables -t nat -L DOCKER -n','Chain DOCKER (2 references)\ntarget  prot  source     destination\nRETURN  all   0.0.0.0/0  0.0.0.0/0\nDNAT    tcp   0.0.0.0/0  0.0.0.0/0    tcp dpt:8080 to:172.17.0.2:80','每个 <code>-p</code> 生成一条 DNAT 规则。本课演示 iptables 后端。nftables 后端采用不同表、链及过滤方式，没有 DOCKER-USER 链，不能照搬这里的 iptables 命令。'],
['sudo iptables -t nat -L POSTROUTING -n','Chain POSTROUTING (policy ACCEPT)\ntarget      prot source         destination\nMASQUERADE  all  172.17.0.0/16  0.0.0.0/0\nMASQUERADE  all  172.19.0.0/16  0.0.0.0/0','每个 Docker 网络一条 MASQUERADE。'],
['sudo nsenter -t $(docker inspect -f {{.State.Pid}} api) -n iptables -t nat -S','-A DOCKER_OUTPUT -d 127.0.0.11/32 -p udp --dport 53 -j DNAT --to-destination 127.0.0.11:41629\n-A DOCKER_POSTROUTING -s 127.0.0.11/32 -p udp --sport 41629 -j SNAT --to-source :53','在<b>容器的</b> net namespace 里看 iptables：对 127.0.0.11:53 的查询被转到 dockerd 在这个 namespace 里监听的随机端口。'],
['sudo conntrack -L -p tcp --dport 8080','tcp 6 431999 ESTABLISHED src=203.0.113.9 dst=192.168.1.10 sport=51022 dport=8080 src=172.17.0.2 dst=203.0.113.9 sport=80 dport=51022 [ASSURED]','conntrack 记录了 NAT 前后的两组地址。回包靠它改写。'],
['ps -ef | grep docker-proxy','root  2210  … /usr/bin/docker-proxy -proto tcp -host-ip 0.0.0.0 -host-port 8080 -container-ip 172.17.0.2 -container-port 80','docker-proxy 处理 iptables 覆盖不到的情况，例如从本机访问 localhost:8080（不经过 PREROUTING）。可以在 daemon.json 里用 <code>"userland-proxy": false</code> 关闭。']]);
Quiz(document.getElementById('qs'),[
['服务器上 ufw deny 8080，但用 -p 8080:80 发布的容器仍能从外部访问。原因？',['ufw 坏了','DNAT 后包走 FORWARD 链，不经过 ufw 所在的 INPUT 链','Docker 关闭了 ufw'],1,'用 DOCKER-USER 链或绑定 127.0.0.1。'],
['容器访问外网时，外部服务器看到的源地址是？',['容器 IP','宿主机的 IP','docker0 的 IP'],1,'MASQUERADE。'],
['容器的 eth0 和宿主机上的哪个设备是一对？',['docker0','一个 vethXXXX 接口','宿主机 eth0'],1,'veth 对，宿主机端接在网桥上。'],
['自定义网络里，容器的 DNS 请求由谁回答？',['宿主机的 /etc/resolv.conf','dockerd 内置的解析器','公共 DNS'],1,'解析不了的再转发给上游。']]);
