const B=(t,c,w=200,h=44)=>({w,h,cls:'blk '+c,html:t});
Player(document.getElementById('p1'),{els:{
 host:{w:760,h:330,cls:'card',html:'<h6>宿主机 · eth0 192.168.1.10</h6>'},br:B('docker0 网桥 · 172.17.0.1','ink',680),
 c1:B('容器 web<br><span style="font-size:11px;opacity:.7">eth0 172.17.0.2</span>','',200,60),c2:B('容器 api<br><span style="font-size:11px;opacity:.7">eth0 172.17.0.3</span>','',200,60),
 v1:{w:120,cls:'tag',html:'veth ↕'},v2:{w:120,cls:'tag',html:'veth ↕'},nat:{w:300,cls:'tag'},pk:{cls:'pill sig',html:'请求 :8080'},out:{w:200,cls:'tag',html:'<b>外部</b>'}},
 scenes:[
 {t:'每个容器一块虚拟网卡',p:'容器有自己的网络命名空间。Docker 创建一对 <b>veth</b>：一端是容器里的 eth0，另一端接在宿主机的 docker0 网桥上。',d:3600,set:{host:[0,0],br:[40,250],c1:[60,90],c2:[460,90],v1:[130,190],v2:[530,190]}},
 {t:'容器之间通过网桥通信',p:'同一网桥上的容器可以用 IP 互访。容器访问外网时，源地址被改写成宿主机地址（SNAT）。',set:{host:[0,0],br:[40,250],c1:[60,90],c2:[460,90],v1:[130,190],v2:[530,190],pk:[290,258,{cls:'pill mute',html:'172.17.0.2 → 172.17.0.3'}]}},
 {t:'-p 8080:80：端口映射',p:'外部请求到达宿主机 8080 端口，iptables 的 DNAT 规则把目的地址改成 172.17.0.2:80，转给容器。',d:3600,set:{host:[0,0],br:[40,250],c1:[60,90],c2:[460,90],v1:[130,190],v2:[530,190],out:[820,20],pk:[800,60],nat:[440,24,{html:'<b>DNAT</b> 宿主机:8080 → 172.17.0.2:80'}]}},
 {t:'到达容器',p:'容器里的应用看到的是发往自己 80 端口的普通请求。第 15 课会在宿主机上直接查看这些 iptables 规则。',set:{host:[0,0],br:[40,250],c1:[60,90],c2:[460,90],v1:[130,190],v2:[530,190],out:[820,20],pk:[90,50],nat:[440,24,{html:'<b>DNAT</b> 宿主机:8080 → 172.17.0.2:80'}]}}]});
Player(document.getElementById('p2'),{els:{
 net:{w:700,h:300,cls:'frame',html:'<i>自定义网络 appnet</i>'},dns:B('内置 DNS 127.0.0.11','ink',240),api:B('api','',180,56),db:B('db · 172.19.0.3','',180,56),q:{cls:'pill mute'},a:{cls:'pill ok'},note:{w:600,cls:'tag'}},
 scenes:[
 {t:'创建网络，按名字加入',p:'<code>docker network create appnet</code>，然后 <code>docker run --network appnet --name db …</code>。',set:{net:[0,0],api:[60,190],db:[460,190],dns:[230,50]}},
 {t:'api 查询 “db”',p:'容器里的 /etc/resolv.conf 指向 Docker 的内置 DNS（127.0.0.11）。api 解析 db 这个名字。',set:{net:[0,0],api:[60,190],db:[460,190],dns:[230,50],q:[80,130,{html:'db 的地址？'}]}},
 {t:'返回 db 的 IP',p:'DNS 返回 db 当前的 IP。容器重启后 IP 可能变化，但名字不变，所以<b>永远用名字</b>，不要写死 IP。',set:{net:[0,0],api:[60,190],db:[460,190],dns:[230,50],a:[80,130,{html:'db = 172.19.0.3'}]}},
 {t:'默认 bridge 网络没有这个功能',p:'不加 <code>--network</code> 的容器在默认 bridge 网络上，只能用 IP 互访（旧的 <code>--link</code> 已经弃用）。这是使用自定义网络的主要原因。',d:3600,set:{net:[0,0,{cls:'frame',html:'<i>默认网络 bridge</i>'}],api:[60,190],db:[460,190],q:[80,130,{html:'db 的地址？'}],note:[0,320,{html:'<b style="color:var(--bad)">Name or service not known</b>'}]}}]});
(()=>{let nw='default',hs='localhost';const lg=document.getElementById('lg');
 const mk=(id,list,set)=>{const el=document.getElementById(id);list.forEach(([v,l])=>{const b=document.createElement('button');b.className='btn';b.textContent=l;b.dataset.v=v;b.addEventListener('click',()=>{set(v);draw()});el.appendChild(b)})};
 mk('nw',[['default','都在默认 bridge'],['same','都在 appnet'],['split','api 在 front，db 在 back']],v=>nw=v);mk('hs',[['localhost','localhost'],['db','db'],['ip','db 的 IP']],v=>hs=v);
 function draw(){document.querySelectorAll('#nw .btn').forEach(b=>b.classList.toggle('pri',b.dataset.v===nw));document.querySelectorAll('#hs .btn').forEach(b=>b.classList.toggle('pri',b.dataset.v===hs));
  const ip=nw==='same'?'172.19.0.3':nw==='split'?'172.21.0.2':'172.17.0.3',h=hs==='ip'?ip:hs;let r;
  if(hs==='localhost')r=['e','connection to server at "localhost" (127.0.0.1), port 5432 failed: Connection refused','api 容器里的 localhost 是 api 自己，不是 db，也不是宿主机。'];
  else if(hs==='db'&&nw!=='same')r=['e','could not translate host name "db" to address: Name or service not known',nw==='default'?'默认 bridge 网络没有 DNS。':'api 和 db 不在同一个网络，名字解析不到。'];
  else if(hs==='ip'&&nw==='split')r=['e','connection to server at "172.21.0.2", port 5432 failed: Connection timed out','不同网络之间默认不通，有 IP 也到不了。'];
  else if(hs==='ip')r=['o','connected','能连上，但 IP 是 Docker 分配的，容器重建后可能变化。不要写死 IP。'];
  else r=['o','connected · server version 16.4','同一个自定义网络，用名字访问。这是推荐做法。'];
  lg.innerHTML=`<b>$ docker exec api psql -h ${h} -U postgres -c "select 1"</b>\n<span class="${r[0]}">${r[1]}</span>\n${r[2]}`}draw()})();
Term(document.getElementById('t4'),[
['docker network ls','NETWORK ID     NAME      DRIVER    SCOPE\n9d1c…          bridge    bridge    local\n2a7e…          host      host      local\n51f0…          none      null      local\ne3a0…          appnet    bridge    local','三个内置网络：<b>bridge</b>（默认）、<b>host</b>（直接用宿主机网络，没有隔离，Linux 上才有完整效果）、<b>none</b>（没有网络）。appnet 是自己创建的 bridge 网络。'],
['docker run --rm --network appnet alpine cat /etc/resolv.conf','nameserver 127.0.0.11\noptions ndots:0','自定义网络里，DNS 指向 Docker 内置的解析器。它知道同一网络里每个容器的名字和别名（<code>--network-alias</code>）。'],
['docker run --rm --network appnet alpine ip addr show eth0','2: eth0@if17: <BROADCAST,MULTICAST,UP> mtu 1500\n    inet 172.19.0.4/16 brd 172.19.255.255 scope global eth0','<b>@if17</b> 表示这块网卡的另一端是宿主机上编号 17 的接口，就是 veth 对的另一半。'],
['docker run -d -p 8080:80 nginx && docker run -d -p 8080:80 nginx','a12f…\ndocker: Error response from daemon: driver failed programming external connectivity: Bind for 0.0.0.0:8080 failed: port is already allocated.','同一个宿主机端口只能映射一次。容器端口可以相同，每个容器有自己的网络命名空间。'],
['docker run --rm --add-host=host.docker.internal:host-gateway alpine ping -c1 host.docker.internal','PING host.docker.internal (172.17.0.1): 56 data bytes\n64 bytes from 172.17.0.1: seq=0 ttl=64 time=0.08 ms','容器访问宿主机上的服务（例如本机的数据库）。Docker Desktop 自带这个名字；Linux 上要加这个参数。']]);
Quiz(document.getElementById('qs'),[
['api 容器里用 localhost:5432 连接 db 容器，结果连不上。原因？',['db 没启动','localhost 指的是 api 容器自己','需要 -p 5432:5432'],1,'用 db 的容器名，并放在同一个自定义网络。'],
['两个容器在默认 bridge 网络上，能用容器名互相访问吗？',['能','不能，默认网络没有内置 DNS','只有在 Linux 上能'],1,'用自定义网络。'],
['容器之间互相访问，需要 -p 吗？',['需要','不需要，-p 只用于从宿主机外部访问','只有 TCP 需要'],1,'同一网络里直接访问容器端口。'],
['只希望本机能访问容器的 8080，怎么写？',['-p 8080:8080','-p 127.0.0.1:8080:8080','--network host'],1,'不写 IP 时绑定在 0.0.0.0，局域网里其他机器也能访问。']]);
