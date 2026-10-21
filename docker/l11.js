const B=(t,c,w=200,h=44)=>({w,h,cls:'blk '+c,html:t});
const NS=[['pid','pid'],['net','net'],['mnt','mnt'],['uts','uts'],['ipc','ipc'],['user','user'],['cg','cgroup']];
const els={kern:B('Linux 内核（只有一个）','ink',760),p1:B('systemd','dim',140),p2:B('sshd','dim',140),p3:B('你的 shell','dim',140),pc:B('nginx · PID 48213','sig',200),note:{w:760,cls:'tag'},box:{w:250,h:220,cls:'frame',html:'<i>容器 web</i>'}};
NS.forEach(([k,t],i)=>els['n'+k]={cls:'pill mute',html:t});
const base={kern:[0,260],p1:[0,180],p2:[160,180],p3:[320,180],pc:[540,180]};
const nsOn=()=>{const o={box:[515,-10]};NS.forEach(([k],i)=>o['n'+k]=[530+(i%3)*76,30+Math.floor(i/3)*40]);return o};
Player(document.getElementById('p1'),{els,scenes:[
 {t:'宿主机上的进程',p:'所有进程共用一个内核。容器里的 nginx 也在这个列表里，和 sshd、你的 shell 并列。',set:{...base,note:[0,320,{html:'<b>ps -e</b> 在宿主机上能看到 nginx'}]}},
 {t:'给它一组 namespace',p:'Docker 创建进程时，让它进入一组新的 namespace。内核据此给它看一份不同的“视图”。',d:3800,set:{...base,...nsOn()}},
 {t:'这就是容器',p:'没有虚拟硬件，没有第二个内核。容器 = 普通进程 + namespace（看到什么）+ cgroups（能用多少，下一课）。',d:3600,set:{...base,...nsOn(),note:[0,320,{html:'<b>容器 = 进程 + namespace + cgroups</b>'}]}}]});
const T=(h,rows)=>({w:300,cls:'card',html:`<h6>${h}</h6><div style="font:400 13px/1.7 var(--m)">${rows}</div>`});
Player(document.getElementById('p2'),{els:{h:T('宿主机：ps -e','1 systemd<br>812 sshd<br>2290 bash<br><b style="color:var(--sig)">48213 nginx: master</b><br><b style="color:var(--sig)">48251 nginx: worker</b>'),c:T('容器里：ps -e','<b style="color:var(--sig)">1 nginx: master</b><br><b style="color:var(--sig)">29 nginx: worker</b>'),n:{w:620,cls:'tag'}},scenes:[
 {t:'宿主机能看到所有进程',p:'从宿主机（根 PID namespace）看，nginx 的 PID 是 48213。',set:{h:[0,0]}},
 {t:'容器里只能看到自己',p:'新的 PID namespace 从 1 开始编号。同一个进程在容器里是 PID 1，看不到 namespace 外的进程。',d:3600,set:{h:[0,0],c:[340,0]}},
 {t:'PID 1 的特殊之处',p:'PID 1 退出，整个 namespace 里的进程都被杀死，容器随之停止。PID 1 还要负责回收僵尸进程，这就是 <code>docker run --init</code> 存在的原因。',d:3800,set:{h:[0,0],c:[340,0],n:[0,190,{html:'<b>PID 1 退出 = 容器停止</b>'}]}}]});
(()=>{const on=new Set();const nsEl=document.getElementById('ns'),rc=document.getElementById('rc'),lg=document.getElementById('lg'),nm=document.getElementById('nm');let last='ps -e';
 const L=[['pid','PID'],['mnt','mount + 新根目录'],['uts','UTS'],['net','NET'],['user','USER']];
 L.forEach(([k,l])=>{const b=document.createElement('button');b.className='btn';b.textContent=l;b.dataset.k=k;b.addEventListener('click',()=>{on.has(k)?on.delete(k):on.add(k);b.classList.toggle('pri',on.has(k));run(last)});nsEl.appendChild(b)});
 const R={'ps -e':()=>on.has('pid')&&on.has('mnt')?['    PID CMD\n      1 sh\n      2 ps -e','只看到自己。']:on.has('pid')?['    PID CMD\n      1 systemd\n    812 sshd\n   2290 bash\n  50112 sh\n  50120 ps -e','<b>PID namespace 已经打开，为什么还能看到宿主机进程？</b> ps 读取的是 /proc，而 /proc 还是宿主机挂载的那个。要在新的 mount namespace 里重新挂载 /proc（<code>--mount-proc</code>）。']:['    PID CMD\n      1 systemd\n    812 sshd\n   2290 bash\n  50112 sh\n  50120 ps -e','和宿主机看到的一样。'],
  'hostname':()=>on.has('uts')?['container','UTS namespace：主机名是独立的，改了不影响宿主机。']:['my-laptop','宿主机的主机名。在这里改，宿主机也会被改掉。'],
  'ip -brief addr':()=>on.has('net')?['lo   DOWN','新的网络 namespace 里只有一个关闭的回环网卡。Docker 会再插入一端 veth，第 15 课讲。']:['lo       UNKNOWN 127.0.0.1/8\nwlan0    UP      192.168.1.10/24\ndocker0  UP      172.17.0.1/16','宿主机的全部网卡。'],
  'ls /':()=>on.has('mnt')?['bin  dev  etc  home  lib  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var','alpine 的文件系统。新的 mount namespace + 切换根目录（Docker 用 pivot_root）。']:['bin  boot  etc  home  lib  opt  proc  root  snap  srv  usr  var  …','宿主机的根目录，所有文件都能看到。'],
  'id':()=>on.has('user')?['uid=0(root) gid=0(root)\n# 宿主机上看，这个进程的 uid 是 100000','USER namespace：容器里是 root，映射到宿主机上的普通用户。这是 rootless 容器的基础，第 19 课讲。']:['uid=0(root) gid=0(root)','真正的 root。默认的 Docker 容器也是这样，只是被其他机制限制了能力。']};
 function run(c){last=c;rc.querySelectorAll('.btn').forEach(b=>b.classList.toggle('pri',b.textContent===c));const [o,x]=R[c]();lg.innerHTML=`<b>sh$ ${c}</b>\n${o}\n\n<span style="color:#a9a69f">${x}</span>`;nm.className='msg';nm.textContent=`已打开 ${on.size} / 5 个 namespace。`+(on.size===5?' 现在它看起来就像一个容器了。':'')}
 Object.keys(R).forEach(c=>{const b=document.createElement('button');b.className='btn';b.textContent=c;b.addEventListener('click',()=>run(c));rc.appendChild(b)});run('ps -e')})();
Term(document.getElementById('t4'),[
['sudo lsns -t net','        NS TYPE NPROCS   PID USER COMMAND\n4026531840 net     187     1 root /sbin/init\n4026532501 net       2 48213 root nginx: master process nginx -g daemon off;\n4026532612 net       1 49870 root redis-server *:6379','列出系统里的 namespace。每个容器至少一个独立的 net namespace，<b>NPROCS</b> 是里面的进程数。'],
['sudo ls -l /proc/48213/ns','lrwxrwxrwx cgroup -> cgroup:[4026532561]\nlrwxrwxrwx ipc -> ipc:[4026532499]\nlrwxrwxrwx mnt -> mnt:[4026532497]\nlrwxrwxrwx net -> net:[4026532501]\nlrwxrwxrwx pid -> pid:[4026532500]\nlrwxrwxrwx user -> user:[4026531837]\nlrwxrwxrwx uts -> uts:[4026532498]','user 的编号和宿主机相同（4026531837 是初始 user namespace）：默认 Docker 不启用 user namespace。'],
['sudo nsenter -t 48213 -n ss -ltn','State  Recv-Q Send-Q Local Address:Port\nLISTEN 0      511    0.0.0.0:80','只进入容器的网络 namespace，使用宿主机上的 ss 工具。镜像里没有调试工具时很有用，第 22 课还会用到。'],
['docker run --rm --pid=host alpine ps -e | head -4','PID   USER     TIME  COMMAND\n    1 root      0:03 /sbin/init\n    2 root      0:00 [kthreadd]\n    3 root      0:00 [rcu_gp]','<code>--pid=host</code> 不创建新的 PID namespace，直接用宿主机的。类似的还有 <code>--network=host</code>、<code>--ipc=host</code>。用于监控工具，普通应用不要用。'],
['docker run --rm --network container:web alpine wget -qO- localhost','&lt;title&gt;Welcome to nginx!&lt;/title&gt;','<code>--network container:web</code>：加入 web 容器的网络 namespace，于是 localhost 就是 web。Kubernetes 的 Pod 就是这样让多个容器共享网络的。']]);
Quiz(document.getElementById('qs'),[
['容器里 ps 显示 PID 1 是 nginx，宿主机上这个进程的 PID 是？',['也是 1','一个普通的大数字，例如 48213','看不到它'],1,'PID namespace 只改变编号的视图。'],
['哪个 namespace 让容器有独立的主机名？',['uts','ipc','mnt'],0,'UTS = UNIX Time-sharing System，历史名称。'],
['unshare --pid 之后 ps 仍然显示宿主机所有进程，原因是？',['命令写错了','/proc 还是宿主机的，需要重新挂载','需要重启'],1,'ps 读取 /proc。'],
['容器能用和宿主机不同版本的 Linux 内核吗？',['能','不能，所有容器共用宿主机内核','只有特权容器可以'],1,'namespace 隔离视图，不隔离内核。']]);
