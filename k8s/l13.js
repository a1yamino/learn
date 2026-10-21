const S=(t,s,c='',w=150)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});const P=(t,c='sig')=>({cls:'pill '+c,html:t});
const ST=[['w','watch','nodeName = 我'],['v','挂载卷','PVC、ConfigMap…'],['sb','RunPodSandbox','pause + CNI'],['pl','PullImage','拉镜像'],['in','init 容器','依次运行'],['cc','Create/Start','应用容器'],['pr','探针','startup → ready']];
const e={kl:S('kubelet','','',150),rt:S('containerd','CRI 服务端','',150),cni:S('CNI 插件','veth + IP','',150),ip:P('10.244.1.12','ok'),n:{w:760,cls:'tag'}};ST.forEach(([k,t,s])=>e[k]=S(t,s,'',140));
const G={};ST.forEach(([k],i)=>G[k]=[(i%4)*160,Math.floor(i/4)*80]);
const on=(n,x={})=>{const o={...G};ST.slice(0,n).forEach(([k],i)=>o[k]=[G[k][0],G[k][1],{cls:'blk sig'}]);return {...o,...x}};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'认领与准备',p:'kubelet watch 到 nodeName 是自己的 Pod。先准备卷：挂载 PVC（必要时等待云盘挂到本节点）、写入 ConfigMap / Secret 文件。',d:3800,set:on(2)},
 {t:'沙箱与网络',p:'通过 CRI 调用 <code>RunPodSandbox</code>：containerd 启动 pause 容器创建命名空间，并调用 CNI 插件建 veth、分配 IP。之后的容器都加入这个沙箱。',d:4200,set:on(3,{rt:[160,180],cni:[320,180],ip:[480,190]})},
 {t:'镜像与容器',p:'拉取镜像（按 imagePullPolicy），依次运行 init 容器并等待成功退出，再创建并启动应用容器（containerd → runc，Docker 第 14 课）。',d:3800,set:on(6,{rt:[160,180]})},
 {t:'持续同步',p:'之后 kubelet 执行探针、按 restartPolicy 重启退出的容器、把 status 写回 API Server。这是一个持续的循环，直到 Pod 被删除。',set:{...on(7),n:[0,180,{html:'kubelet 本身也是一个控制循环'}]}}]});
const T=[['d','标记删除','deletionTimestamp'],['ep','摘除端点','Service 不再转发'],['ps','preStop','如 sleep 5'],['tm','SIGTERM','应用开始退出'],['wt','等待','grace period 30s'],['kl','SIGKILL','仍未退出则强杀'],['cl','清理','沙箱、网络、卷']];
const e2={n:{w:760,cls:'tag'}};T.forEach(([k,t,s])=>e2[k]=S(t,s,'',140));const G2={d:[0,60],ep:[170,0],ps:[170,120],tm:[340,120],wt:[510,120],kl:[680,120],cl:[680,0]};
const o2=(...k)=>{const o={};k.forEach(x=>o[x]=[G2[x][0],G2[x][1],{cls:'blk sig'}]);return o};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'标记删除',p:'<code>kubectl delete pod</code> 只是给对象设置 deletionTimestamp。Pod 进入 Terminating。',set:o2('d')},
 {t:'两条路同时开始',p:'端点控制器把 Pod 从 EndpointSlice 删除（kube-proxy 随后更新规则）；kubelet 同时开始执行 preStop。两者<b>没有先后保证</b>，所以 preStop 里短暂等待能避免请求打到正在退出的进程上（第 9 课）。',d:4400,set:o2('d','ep','ps')},
 {t:'SIGTERM 与等待',p:'preStop 结束后向主进程发送 SIGTERM。应用应停止接收新连接、处理完已有请求后退出。grace period 从删除时开始计时，包括 preStop 的时间。',d:4000,set:o2('d','ep','ps','tm','wt')},
 {t:'强制结束与清理',p:'超时仍未退出 → SIGKILL。然后 kubelet 删除容器、沙箱，CNI 回收 IP，卸载卷，最后从 API Server 删除 Pod 对象。PID 1 不处理 SIGTERM 的程序（如 shell 脚本）总要等满 30 秒（Docker 第 4 课）。',d:4400,set:{...o2('d','ep','ps','tm','wt','kl','cl')}}]});
(()=>{const C=[['ContainerCreating（5 分钟）','Warning  FailedAttachVolume  Multi-Attach error for volume "pvc-3f1e…": Volume is already exclusively attached to one node',['挂载卷',1],'挂载卷。RWO 云盘还挂在旧节点上（旧 Pod 所在节点宕机或没清理干净）。查 <code>kubectl get volumeattachments</code>，等待或手动解除挂载。'],
 ['ContainerCreating','Warning  FailedCreatePodSandBox  failed to setup network for sandbox: plugin type="calico" failed: … connection refused',['沙箱 / CNI',2],'创建沙箱时 CNI 插件失败。查节点上的 CNI 插件 Pod（如 calico-node）是否正常、IP 池是否耗尽。'],
 ['ImagePullBackOff','Warning  Failed  Failed to pull image "ghcr.io/acme/api:1.4.3": 401 Unauthorized',['拉取镜像',3],'拉镜像。私有仓库缺少凭证：检查 <code>imagePullSecrets</code>，或镜像名、标签写错（那会是 not found）。'],
 ['CreateContainerConfigError','Warning  Failed  Error: secret "db" not found',['创建容器',5],'创建容器时组装配置失败：引用的 Secret / ConfigMap 不存在或缺少键。镜像已拉取，容器还没启动。'],
 ['Init:CrashLoopBackOff','Warning  BackOff  Back-off restarting failed container wait-db in pod api-…',['init 容器',4],'init 容器反复失败，应用容器根本没开始。<code>kubectl logs api-… -c wait-db</code> 看它在等什么。'],
 ['Running，0/1 Ready','Warning  Unhealthy  Readiness probe failed: HTTP probe failed with statuscode: 503',['探针',6],'容器在运行，readiness 失败，不在 Service 端点里。看应用日志和 /ready 依赖的东西。']];
 const S=['挂载卷','沙箱 / CNI','拉取镜像','init 容器','创建容器','探针'];const el=document.getElementById('cases'),km=document.getElementById('km');let right=0;
 C.forEach(([st,ev,[ans],why])=>{const r=document.createElement('div');r.style.cssText='padding:12px 0;border-bottom:1px solid var(--line)';
  r.innerHTML=`<div style="font:600 13px var(--m)">STATUS: ${st}</div><div style="font:400 12px/1.5 var(--m);opacity:.75;margin:4px 0 8px">${ev}</div><div class="cmds" style="margin:0">${S.map(s=>`<button class="btn" data-v="${s}">${s}</button>`).join('')}</div>`;
  let done=false;r.querySelectorAll('.btn').forEach(b=>b.addEventListener('click',()=>{const ok=b.dataset.v===ans;r.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));if(ok&&!done){done=true;right++}
   km.className='msg '+(ok?'ok':'bad');km.innerHTML=(ok?'对。':'不对。')+(ok?why:'看事件里提到的对象：卷、网络、镜像、配置引用，还是容器自身？')+`<br><span style="opacity:.7">已答对 ${right}/${C.length}</span>`;if(!ok&&window.shake)shake(r)}));el.appendChild(r)});
 km.className='msg';km.innerHTML='每个状态对应 kubelet 流程中的一步。'})();
Term(document.getElementById('t4'),[
['docker exec learn-worker crictl info | grep -A2 \'"cni"\'','    "cni": {\n      "binDir": "/opt/cni/bin",\n      "confDir": "/etc/cni/net.d",','containerd 从哪里找 CNI 插件和配置。'],
['docker exec learn-worker crictl images | head -4','IMAGE                                 TAG        IMAGE ID        SIZE\ndocker.io/library/nginx               alpine     a5d7…           20.5MB\nregistry.k8s.io/pause                 3.10       873e…           320kB','节点上的镜像缓存。磁盘紧张时 kubelet 按最近使用时间回收。pause 镜像就是沙箱用的。'],
['docker exec learn-worker crictl logs $(docker exec learn-worker crictl ps -q --name life)','/docker-entrypoint.sh: Configuration complete; ready for start up','API Server 不可用时，仍可在节点上直接看容器日志。日志文件在 <code>/var/log/pods/</code>。'],
['docker exec learn-worker cat /var/lib/kubelet/config.yaml | grep -E "eviction|maxPods|cgroupDriver" ','cgroupDriver: systemd\nevictionHard:\n  memory.available: 100Mi\nmaxPods: 110','kubelet 配置：驱逐阈值、每节点最多 Pod 数、cgroup 驱动（必须和运行时一致）。'],
['kubectl get --raw /api/v1/nodes/learn-worker/proxy/stats/summary | jq ".pods[0].memory.workingSetBytes"','14286848','通过 API Server 访问 kubelet 的统计接口，metrics-server 就是从这里取数据。'],
['kubectl delete pod life --grace-period=0 --force','Warning: Immediate deletion does not wait for confirmation that the running resource has been terminated.\npod "life" force deleted','强制删除只是从 API Server 删掉对象，<b>不保证</b>容器已停止。节点失联时慎用，对 StatefulSet 尤其危险（可能出现两个同名 Pod）。']]);
Quiz(document.getElementById('qs'),[
['Pod 的 IP 是在哪一步分配的？',['调度时','RunPodSandbox 调用 CNI 时','容器启动后'],1,'沙箱创建时配置网络。'],
['CreateContainerConfigError 最常见的原因？',['镜像不存在','引用的 Secret 或 ConfigMap 不存在','节点资源不足'],1,'镜像已拉取，组装配置失败。'],
['grace period 是 30 秒，preStop 用了 10 秒，应用收到 SIGTERM 后还有多少时间？',['30 秒','约 20 秒','10 秒'],1,'计时从删除开始，包括 preStop。'],
['用 kubectl 删除一个静态 Pod 的镜像 Pod，会怎样？',['Pod 永久删除','kubelet 立即重建','节点被驱逐'],1,'要删除节点上的文件。']]);
