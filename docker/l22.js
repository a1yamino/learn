const S=(t,s,c='',w=150)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const K=[['s','状态','ps -a / 退出码'],['l','日志','logs'],['c','配置','inspect'],['r','资源','stats / cgroup'],['e','现场','exec / debug']];
const els={n:{w:820,cls:'tag'}};K.forEach(([k,t,s])=>els[k]=S(t,s));const G={};K.forEach(([k],i)=>G[k]=[i*170,60]);
const hl=(...ks)=>{const o={...G};ks.forEach(k=>o[k]=[G[k][0],60,{cls:'blk sig'}]);return o};
Player(document.getElementById('p1'),{els,scenes:[
 {t:'五步',p:'从外到内：先看容器处于什么状态，再看它说了什么，再看它被怎么配置，再看资源，最后才进入现场。',set:G},
 {t:'状态和退出码',p:'<code>docker ps -a</code>：Up、Restarting、Exited (?)。退出码本身往往就是答案：137 → OOM 或被杀；127 → 命令找不到；0 → 主进程跑完了。',d:3800,set:{...hl('s'),n:[0,140,{html:'0 · 1 · 126/127 · 137 · 143'}]}},
 {t:'日志',p:'<code>docker logs --tail 50 --timestamps</code>。崩溃前的最后几行通常写着原因。反复重启的容器加 <code>-f</code> 观察下一次。',set:hl('s','l')},
 {t:'配置与资源',p:'<code>inspect</code> 核对环境变量、挂载、端口、命令是否符合预期。<code>stats</code> 和 cgroup 文件看是否碰到内存上限、CPU 节流（第 21 课）。',d:3800,set:hl('s','l','c','r')},
 {t:'进入现场',p:'前面都没找到答案时，进到容器的命名空间里，直接看进程、端口、文件、网络。',set:{...hl('s','l','c','r','e'),n:[0,140,{html:'大多数问题在前三步就能定位'}]}}]});
Player(document.getElementById('p2'),{els:{app:{w:240,h:150,cls:'frame',html:'<i>app（distroless）</i><br>没有 sh、ps、curl'},tool:{w:240,h:150,cls:'frame',html:'<i>netshoot（工具容器）</i><br>sh、ps、ss、curl、tcpdump'},ns:{w:520,h:44,cls:'blk sig',html:'共享：PID 命名空间 + 网络命名空间'},fs:{cls:'pill mute',html:'文件系统各自独立'},x:{cls:'pill bad',html:'exec: "sh": not found'},n:{w:640,cls:'tag'}},scenes:[
 {t:'exec 失败',p:'<code>docker exec app sh</code> 需要镜像里有 sh。distroless 没有。',set:{app:[0,0],x:[0,170]}},
 {t:'带上工具',p:'另起一个工具容器。它自己的镜像里有所有调试工具。',set:{app:[0,0],tool:[300,0]}},
 {t:'加入命名空间',p:'<code>--pid container:app --network container:app</code>：工具容器看到 app 的进程，localhost 就是 app 的 localhost（第 11 课）。',d:3800,set:{app:[0,0],tool:[300,0],ns:[10,180],fs:[10,240]}},
 {t:'访问 app 的文件',p:'文件系统没有共享，但通过 <code>/proc/1/root/</code> 可以读到 app 的根目录。<code>docker debug</code> 把这些步骤自动化了。',d:3600,set:{app:[0,0],tool:[300,0],ns:[10,180],n:[0,240,{html:'ls /proc/1/root/app'}]}}]});
(()=>{const CASES=[
 {name:'一直重启',sym:'docker ps：api   Restarting (137) 5 seconds ago',cmds:[
  ['docker logs --tail 5 api','Loading model weights (1.8 GB)…\nLoading model weights (1.8 GB)…','日志没有报错就中断了，像是被外部杀掉。'],
  ['docker inspect api -f "{{.State.OOMKilled}} {{.HostConfig.Memory}}"','true 1073741824',null,'OOMKilled=true，内存上限 1 GB，而模型要加载 1.8 GB。提高 <code>--memory</code>（第 21 课先测峰值）或换小一点的模型。'],
  ['docker exec api ps','Error response from daemon: Container is restarting','容器在反复重启，exec 进不去。先看状态和配置。']]},
 {name:'502 错误',sym:'nginx 返回 502 Bad Gateway；api 容器状态 Up 2 hours',cmds:[
  ['docker logs --tail 3 nginx','connect() failed (111: Connection refused) while connecting to upstream, upstream: "http://172.18.0.5:3000/"','nginx 连 api 被拒绝。api 在运行，那么端口有没有监听？'],
  ['docker run --rm --network container:api nicolaka/netshoot ss -lnt','State  Local Address:Port\nLISTEN 127.0.0.1:3000',null,'api 只监听 <b>127.0.0.1</b>，其他容器连不进来。改成 <code>0.0.0.0</code>（如 <code>HOST=0.0.0.0</code>）。'],
  ['docker stats --no-stream api','api   0.4%   82MiB / 512MiB','资源很空闲，不是资源问题。']]},
 {name:'磁盘满',sym:'宿主机磁盘使用率 98%，新容器无法启动',cmds:[
  ['docker system df','Images     12   4.1GB\nContainers 6    0.2GB\nVolumes    3    1.1GB\nBuild Cache 0   0B','镜像、卷、缓存加起来才 5 GB，不是这些。还有什么在 /var/lib/docker 下？'],
  ['du -sh /var/lib/docker/containers/* | sort -h | tail -1','71G  /var/lib/docker/containers/9e1f…',null,'一个容器目录占了 71 GB，就是它的 <code>*-json.log</code>。默认 json-file 不轮转。设置 <code>max-size</code> 或用 <code>local</code> 驱动（第 21 课），重建容器。'],
  ['docker image prune -a','Total reclaimed space: 2.3GB','腾出一些空间，但问题会再来。还没找到根源。']]}];
 let cur=0;const cs=document.getElementById('cs'),dl=document.getElementById('dl'),dc=document.getElementById('dc'),dm=document.getElementById('dm');
 CASES.forEach((c,i)=>{const b=document.createElement('button');b.className='btn';b.textContent=c.name;b.dataset.v=i;b.addEventListener('click',()=>{cur=i;load()});cs.appendChild(b)});
 function load(){cs.querySelectorAll('.btn').forEach(b=>b.classList.toggle('pri',+b.dataset.v===cur));const c=CASES[cur];dl.innerHTML=`<div><b>现象：</b>${c.sym}</div>`;dm.className='msg';dm.innerHTML='选择一条命令。';dc.innerHTML='';
  c.cmds.forEach(([cmd,out,hint,ans])=>{const b=document.createElement('button');b.className='btn';b.textContent=cmd;b.addEventListener('click',()=>{const e=document.createElement('div');e.style.marginTop='8px';e.innerHTML=`<div>$ ${cmd.replace(/</g,'&lt;')}</div><div style="white-space:pre-wrap;opacity:.8">${out.replace(/</g,'&lt;')}</div>`;dl.appendChild(e);b.disabled=true;
   if(ans){dm.className='msg ok';dm.innerHTML='找到原因：'+ans}else{dm.className='msg';dm.innerHTML=hint}});dc.appendChild(b)})}load()})();
Term(document.getElementById('t4'),[
['docker ps -a --format "table {{.Names}}\\t{{.Status}}"','NAMES   STATUS\napi     Restarting (137) 3 seconds ago\nworker  Exited (1) 2 minutes ago\nweb     Up 3 hours (unhealthy)','第一眼：谁没在运行、退出码是什么、健康检查是否失败。'],
['docker logs --since 10m --timestamps --tail 50 worker','2026-10-21T10:58:02Z Traceback (most recent call last):\n2026-10-21T10:58:02Z KeyError: \'DATABASE_URL\'','<code>--since</code>、<code>--tail</code> 缩小范围；<code>-f</code> 持续跟踪。'],
['docker inspect web -f "{{json .State.Health}}" | jq ".Log[-1]"','{ "ExitCode": 1, "Output": "curl: (7) Failed to connect to localhost port 8080" }','健康检查最近一次的输出，说明它为什么 unhealthy。'],
['docker events --since 1h --until "$(date +%s)" --filter event=die --filter event=oom','2026-10-21T18:41:13 container oom 3f2a… (name=api)\n2026-10-21T18:41:13 container die 3f2a… (exitCode=137, name=api)','事后还原：什么时候、哪个容器、为什么停止。'],
['docker debug api','root@api / [debug]# ps\n  PID USER  COMMAND\n    1 app   node server.js','Docker Desktop 自带。给任何容器（包括已停止的、没有 shell 的）挂上一个带工具的调试 shell。'],
['nsenter -t $(docker inspect -f {{.State.Pid}} api) -n ss -lnt','LISTEN 0 511 0.0.0.0:3000','在宿主机上直接进入容器的网络命名空间，用宿主机的工具。需要 root。'],
['docker cp api:/app/config.json .','Successfully copied 2.05kB to /home/alice/.','把容器里的文件拷出来看，对停止的容器也有效。']]);
Quiz(document.getElementById('qs'),[
['容器 Exited (0)，一启动就退出。最可能的原因？',['OOM','主进程正常执行完了','镜像损坏'],1,'例如 CMD 是一个运行完就结束的命令，或服务在后台运行。'],
['Exited (127) 说明？',['命令找不到','被 SIGKILL','内存不足'],0,'检查 CMD/ENTRYPOINT 拼写和 PATH。'],
['容器里 curl localhost:3000 正常，其他容器和宿主机访问不到。首先怀疑？',['DNS','服务只监听 127.0.0.1','磁盘满'],1,'改成 0.0.0.0。'],
['镜像里没有 sh，怎么查看它的监听端口？',['重新构建加上 sh','工具容器加入它的网络命名空间','不可能'],1,'--network container:X 或 docker debug。']]);
