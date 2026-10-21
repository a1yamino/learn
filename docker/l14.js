const N=(t,s,c='')=>({w:250,h:56,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const E={cli:N('docker','命令行客户端'),dd:N('dockerd','REST API · 镜像、网络、卷'),cd:N('containerd','gRPC · 容器生命周期'),sh:N('containerd-shim-runc-v2','每个容器一个'),rc:N('runc','OCI 运行时'),ct:N('nginx','容器进程','sig'),
 a1:{w:260,cls:'tag'},a2:{w:260,cls:'tag'},a3:{w:260,cls:'tag'},a4:{w:260,cls:'tag'},a5:{w:260,cls:'tag'}};
const Y={cli:0,dd:90,cd:180,sh:270,rc:360,ct:450};const p=k=>[0,Y[k]];const ar=(k,t,y)=>({[k]:[280,y,{html:'↓ '+t}]});
Player(document.getElementById('p1'),{els:E,scenes:[
 {t:'CLI → dockerd',p:'docker 命令只是一个客户端，把请求发到 <code>/var/run/docker.sock</code> 上的 REST API。dockerd 负责镜像构建、网络、卷等高层功能。',set:{cli:p('cli'),dd:p('dd'),...ar('a1','HTTP · docker.sock',60)}},
 {t:'dockerd → containerd',p:'dockerd 把“运行容器”交给 containerd（gRPC）。containerd 管理镜像存储和容器生命周期，Kubernetes 也直接使用它。',set:{cli:p('cli'),dd:p('dd'),cd:p('cd'),...ar('a1','HTTP · docker.sock',60),...ar('a2','gRPC · containerd.sock',150)}},
 {t:'containerd → shim',p:'每个容器启动一个 shim 进程。它是容器进程的父进程，和 containerd 解耦。',set:{cli:p('cli'),dd:p('dd'),cd:p('cd'),sh:p('sh'),...ar('a1','HTTP · docker.sock',60),...ar('a2','gRPC · containerd.sock',150),...ar('a3','启动',240)}},
 {t:'shim → runc → 容器',p:'shim 调用 runc。runc 按 config.json 创建 namespace、cgroups、挂载根文件系统，然后 exec 出容器进程。',set:{cli:p('cli'),dd:p('dd'),cd:p('cd'),sh:p('sh'),rc:p('rc'),ct:p('ct'),...ar('a1','HTTP · docker.sock',60),...ar('a2','gRPC · containerd.sock',150),...ar('a3','启动',240),...ar('a4','runc create / start',330),...ar('a5','clone + exec',420)}},
 {t:'runc 退出',p:'容器创建完成后 runc 就退出了。留下的是 shim → 容器进程。上面的组件重启时，容器可以继续运行。',d:3800,set:{cli:p('cli'),dd:p('dd'),cd:p('cd'),sh:p('sh'),ct:[0,360],...ar('a1','HTTP · docker.sock',60),...ar('a2','gRPC · containerd.sock',150),...ar('a3','启动',240),a5:[280,330,{html:'↓ 父进程'}]}}]});
const C=(h,b,w=320)=>({w,cls:'card',html:`<h6>${h}</h6><div style="font:400 12px/1.7 var(--m)">${b}</div>`});
Player(document.getElementById('p2'),{els:{
 b:{w:700,h:300,cls:'frame',html:'<i>bundle 目录</i>'},cj:C('config.json','"process": { "args": ["nginx", …], "user": … }<br>"root": { "path": "rootfs" }<br>"mounts": [ /proc, /dev, … ]<br>"linux": {<br>&nbsp; "namespaces": [pid, net, mnt, uts, ipc],<br>&nbsp; "resources": { memory, cpu, pids }<br>}'),rf:C('rootfs/','bin/ etc/ usr/ var/ …<br><span style="color:var(--ink2)">（镜像各层合并后的目录）</span>',260),
 n:{w:700,cls:'tag'}},scenes:[
 {t:'两样东西',p:'OCI 运行时规范定义了 bundle：一个 <b>config.json</b> 和一个 <b>rootfs</b> 目录。runc 只认这两样，不知道什么是镜像、仓库或 Dockerfile。',set:{b:[0,0],cj:[30,40],rf:[400,40]}},
 {t:'config.json 汇总了一切',p:'第 11、12 课的 namespace 和 cgroups、第 6 课的挂载、镜像里的 Cmd 和 User，最终都落在这个文件里。',d:3600,set:{b:[0,0],cj:[30,40],rf:[400,40],n:[0,320,{html:'<b>镜像配置 + docker run 参数 → config.json</b>'}]}},
 {t:'rootfs 来自 overlay',p:'rootfs 就是第 13 课的 merged 目录。runc 用 pivot_root 把它切换成容器的根目录。',set:{b:[0,0],cj:[30,40],rf:[400,40,{cls:'card',html:'<h6>rootfs/ = overlay merged</h6><div style="font:400 12px/1.7 var(--m)">lowerdir（镜像层）<br>+ upperdir（容器层）</div>'}]}}]});
(()=>{let live=false;const lr=document.getElementById('lr'),kc=document.getElementById('kc'),lg=document.getElementById('lg');
 const b=document.createElement('button');b.className='btn';const pl=()=>{b.textContent='live-restore：'+(live?'开启':'关闭');b.classList.toggle('pri',live)};b.addEventListener('click',()=>{live=!live;pl();run(last)});lr.appendChild(b);pl();let last='dockerd';
 const R={dockerd:()=>live?['<b>$ sudo systemctl stop docker</b>\n<b>$ docker ps</b>\n<span class="e">Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?</span>\n<b>$ curl localhost:8080</b>\n<span class="o">&lt;title&gt;Welcome to nginx!&lt;/title&gt;</span>','开启 live-restore：dockerd 停止期间，三个容器照常运行（shim 还在）。dockerd 重启后重新接管。适合升级 Docker 时不中断服务。']:['<b>$ sudo systemctl stop docker</b>\n<b>$ curl localhost:8080</b>\n<span class="e">curl: (7) Failed to connect to localhost port 8080</span>','默认（live-restore 关闭）：dockerd 停止时会先停掉所有容器。在 <code>/etc/docker/daemon.json</code> 里加 <code>"live-restore": true</code> 可以改变这个行为。'],
  containerd:()=>['<b>$ sudo systemctl stop containerd</b>\n<b>$ curl localhost:8080</b>\n<span class="o">&lt;title&gt;Welcome to nginx!&lt;/title&gt;</span>\n<b>$ docker run -d redis</b>\n<span class="e">Error response from daemon: … connection refused: unix:///run/containerd/containerd.sock</span>','运行中的容器不受影响：它们的父进程是 shim，不是 containerd。但不能创建新容器。containerd 恢复后，会重新连接每个 shim。'],
  shim:()=>['<b>$ sudo kill -9 $(pgrep -f "shim.*7c1f")</b>\n<b>$ docker ps -a --format "{{.Names}} {{.Status}}"</b>\nweb <span class="e">Exited (137) 2 seconds ago</span>\napi Up 3 hours\ndb  Up 3 hours','只有这一个容器停止了。shim 是容器进程的“管家”，它没了，容器被清理。其他容器各有自己的 shim，不受影响。'],
  runc:()=>['<b>$ pgrep -a runc</b>\n<span style="opacity:.6">（没有输出）</span>','runc 不常驻。它在容器创建完成后就退出了，只在 create、start、exec、kill 这些操作时短暂运行。']};
 ['dockerd','containerd','shim','runc'].forEach(k=>{const x=document.createElement('button');x.className='btn';x.textContent='停掉 '+k;x.dataset.k=k;x.addEventListener('click',()=>run(k));kc.appendChild(x)});
 function run(k){last=k;kc.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x.dataset.k===k));const [o,t]=R[k]();lg.innerHTML=o+'\n\n<span style="color:#a9a69f">'+t+'</span>'}run('dockerd')})();
Term(document.getElementById('t4'),[
['pstree -p $(pgrep -x containerd) | head; pstree -sp $(docker inspect -f {{.State.Pid}} web)','systemd(1)───containerd-shim(51200)───nginx(51221)─┬─nginx(51262)\n                                                  └─nginx(51263)','容器进程的祖先链：systemd → shim → nginx。shim 的父进程是 1（它被设计成脱离 containerd 独立运行）。'],
['sudo ctr -n moby containers ls','CONTAINER    IMAGE    RUNTIME\n7c1f4a2e…             io.containerd.runc.v2','ctr 是 containerd 自带的调试客户端。Docker 的容器在 <b>moby</b> 命名空间里；Kubernetes 的在 <b>k8s.io</b> 里，可以用 <code>crictl</code> 查看。'],
['docker info --format "{{.Driver}} {{.CgroupDriver}} {{.CgroupVersion}}"','overlay2 systemd 2','存储驱动、cgroup 驱动、cgroup 版本。Kubernetes 节点上 kubelet 和容器运行时的 cgroup 驱动必须一致。'],
['ls -l /var/run/docker.sock','srw-rw---- 1 root docker 0 Oct 21 09:00 /var/run/docker.sock','属于 docker 组的用户可以访问。能访问它就能运行 <code>docker run -v /:/host --privileged</code>，等于 root。所以把用户加入 docker 组要谨慎。'],
['docker run --rm --runtime=runsc alpine dmesg | head -2','[    0.000000] Starting gVisor...\n[    0.412530] Waiting for children...','可以换运行时。gVisor（runsc）在用户态拦截系统调用，隔离更强；Kata Containers 为每个容器启动轻量虚拟机。需要单独安装并在 daemon.json 里注册。']]);
Quiz(document.getElementById('qs'),[
['容器运行起来之后，runc 在做什么？',['持续监控容器','已经退出了','转发网络流量'],1,'shim 留下来做父进程。'],
['停止 containerd，运行中的容器会怎样？',['全部停止','继续运行，但不能创建新容器','变成 paused'],1,'父进程是 shim。'],
['Kubernetes 不再支持 dockershim 后，Docker 构建的镜像还能在 Kubernetes 里运行吗？',['不能','能，镜像是 OCI 标准格式','需要转换格式'],1,'只是 kubelet 不再通过 dockerd 调用。'],
['为什么把 docker.sock 挂进容器很危险？',['会占用大量内存','拿到它就能控制宿主机上的 Docker，相当于 root','会让容器变慢'],1,'可以启动挂载宿主机根目录的特权容器。']]);
