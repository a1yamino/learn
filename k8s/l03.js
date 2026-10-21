const S=(t,s,c='',w=150)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
Player(document.getElementById('p1'),{els:{pod:{w:460,h:250,cls:'frame',html:'<i>Pod · 10.244.1.5</i>'},pz:S('pause','持有网络命名空间','dim',130),a:S('web','nginx :80'),b:S('writer','busybox'),net:{w:400,h:34,cls:'blk sig',html:'共享：网络（IP、端口、localhost）'},vol:{w:400,h:34,cls:'blk',html:'共享：卷 html（emptyDir）'},fs:{cls:'pill mute',html:'各自的文件系统和进程'},n:{w:640,cls:'tag'}},scenes:[
 {t:'两个容器',p:'一个 Pod 里有 web 和 writer 两个容器，各自来自不同的镜像。',set:{pod:[0,0],a:[30,40],b:[260,40]}},
 {t:'共享网络',p:'Pod 先启动一个极小的 pause 容器创建网络命名空间，其余容器都加入它。所以它们有<b>同一个 IP</b>，用 localhost 互相访问，端口不能冲突。这正是 Docker 第 11 课的 <code>--network container:</code>。',d:4200,set:{pod:[0,0],a:[30,40],b:[260,40],pz:[310,-60],net:[30,120]}},
 {t:'共享卷',p:'声明在 Pod 级别的卷可以挂载到多个容器。writer 写入的文件，web 立刻能读到。',set:{pod:[0,0],a:[30,40],b:[260,40],net:[30,120],vol:[30,170]}},
 {t:'不共享的',p:'文件系统（除了挂载的卷）、进程（默认）、资源限制都是每个容器各自的。整个 Pod 一起调度到同一个节点，一起被删除。',d:3800,set:{pod:[0,0],a:[30,40],b:[260,40],net:[30,120],vol:[30,170],fs:[0,270]}}]});
const PH=(t,c='mute')=>({cls:'pill '+c,html:t});
Player(document.getElementById('p2'),{els:{pe:PH('Pending'),ru:PH('Running'),su:PH('Succeeded'),fa:PH('Failed'),i1:S('init','按顺序运行','',120),m1:S('app','主容器','',120),cr:PH('退出码 1','bad'),bo:{w:520,cls:'tag'},n:{w:640,cls:'tag'}},scenes:[
 {t:'Pending',p:'Pod 对象已创建：等待调度到节点、拉取镜像、运行 init 容器。<code>STATUS</code> 显示 <code>Init:0/1</code>、<code>ContainerCreating</code>。',d:3600,set:{pe:[0,0,{cls:'pill sig'}],ru:[130,0],su:[260,0],fa:[390,0],i1:[0,60,{cls:'blk sig'}],m1:[150,60,{cls:'blk dim'}]}},
 {t:'Running',p:'init 容器全部成功退出后，主容器启动。至少一个容器在运行，Pod 就是 Running。',set:{pe:[0,0],ru:[130,0,{cls:'pill sig'}],su:[260,0],fa:[390,0],i1:[0,60,{cls:'blk dim'}],m1:[150,60,{cls:'blk sig'}]}},
 {t:'容器崩溃',p:'<code>restartPolicy: Always</code>（默认）：kubelet 重启容器，等待时间 10s、20s、40s… 最长 5 分钟。这段等待就是 <b>CrashLoopBackOff</b>。Pod 本身仍是 Running 阶段。',d:4200,set:{pe:[0,0],ru:[130,0,{cls:'pill sig'}],su:[260,0],fa:[390,0],m1:[150,60,{cls:'blk dim'}],cr:[290,72],bo:[0,140,{html:'重启等待：10s → 20s → 40s → 80s → … → 5m'}]}},
 {t:'结束',p:'只有 <code>restartPolicy</code> 是 Never 或 OnFailure（Job 使用）时，Pod 才会进入 Succeeded 或 Failed。结束的 Pod 不会自己被重新创建：那是控制器的工作。',d:3800,set:{pe:[0,0],ru:[130,0],su:[260,0,{cls:'pill ok'}],fa:[390,0,{cls:'pill bad'}],n:[0,80,{html:'Pod 是一次性的'}]}}]});
(()=>{const P=[['Web 应用','它的数据库',1,'分开。数据库和应用扩缩容节奏不同，生命周期不同；放一起的话，扩 3 个应用就多出 3 个数据库。'],['应用','把它的日志文件发送出去的 agent',0,'同一个 Pod。agent 需要读应用写的文件（共享卷），且每个应用实例都要一个。'],['应用','本地 TLS/服务网格代理（如 Envoy）',0,'同一个 Pod。代理通过 localhost 接管应用的进出流量，必须共享网络命名空间。'],['前端 nginx','后端 API',1,'分开。它们通过 Service 通信就行；分开后能独立扩缩容、独立发布。'],['应用','启动前执行数据库迁移',0,'同一个 Pod 的 init 容器（或者一个独立的 Job）。不是长期运行的第二个容器。'],['Redis 缓存','使用它的应用',1,'分开。缓存要被多个应用副本共享；放进每个 Pod 就成了各自独立的缓存。']];
 const el=document.getElementById('pairs'),pm=document.getElementById('pm');const ans={};
 P.forEach(([a,b,k,why],i)=>{const r=document.createElement('div');r.style.cssText='display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line)';
  r.innerHTML=`<div><b>${a}</b> + ${b}</div><div class="cmds" style="margin:0"><button class="btn" data-v="0">同一个 Pod</button><button class="btn" data-v="1">分开</button></div>`;
  r.querySelectorAll('.btn').forEach(bt=>bt.addEventListener('click',()=>{const v=+bt.dataset.v;ans[i]=v===k;r.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===bt));
   const right=Object.values(ans).filter(Boolean).length,done=Object.keys(ans).length;pm.className='msg '+(v===k?'ok':'bad');pm.innerHTML=(v===k?'对。':'再想想。')+why+`<br><span style="opacity:.7">已答对 ${right}/${P.length}</span>`;if(v!==k&&window.shake)shake(r)}));el.appendChild(r)});
 pm.className='msg';pm.innerHTML='判断标准：是否<b>必须</b>共享网络或文件，是否<b>必须</b>一起调度、一起扩缩容。'})();
Term(document.getElementById('t4'),[
['kubectl run tmp --rm -it --image=busybox -- sh','If you don\'t see a command prompt, try pressing enter.\n/ # ','临时 Pod，退出即删除。调试集群内网络的常用方式。'],
['kubectl get pod two -o jsonpath="{.spec.containers[*].name}"','web writer','列出 Pod 的容器名。多容器 Pod 的 logs/exec 需要 <code>-c</code> 指定容器。'],
['kubectl describe pod crash','State:          Waiting\n  Reason:       CrashLoopBackOff\nLast State:     Terminated\n  Reason:       Error\n  Exit Code:    1\nRestart Count:  4\nEvents:\n  Warning  BackOff  kubelet  Back-off restarting failed container crash','Last State 给出上一次退出的原因和退出码（137 = OOMKilled，见 Docker 第 21 课）。'],
['kubectl logs crash --previous','starting','崩溃循环中当前容器可能还没输出，<code>--previous</code> 看上一次运行的日志。'],
['kubectl debug -it two --image=busybox --target=web','Targeting container "web". If you don\'t see processes from this container it may be because the container runtime doesn\'t support this feature.\n/ # ps\nPID   USER     COMMAND\n    1 root     nginx: master process','临时调试容器：给正在运行的 Pod 加一个容器，共享目标容器的进程命名空间。和 Docker 第 22 课的工具容器同一思路。'],
['kubectl get pod two -o yaml | grep -A3 "^status:" ','status:\n  conditions:\n  - lastProbeTime: null\n    type: PodReadyToStartContainers','status.conditions：PodScheduled、Initialized、ContainersReady、Ready。']]);
Quiz(document.getElementById('qs'),[
['同一个 Pod 的两个容器之间怎么通信最直接？',['Service 名称','localhost','节点 IP'],1,'它们共享网络命名空间。'],
['CrashLoopBackOff 表示？',['镜像不存在','容器反复崩溃，kubelet 在等待下一次重启','节点资源不足'],1,'等待时间指数增长，最长 5 分钟。'],
['一个直接创建的 Pod 所在节点宕机，会怎样？',['自动在别的节点重建','不会被重建','变成 Deployment'],1,'Pod 是一次性的，需要控制器来重建。'],
['数据库迁移最适合放在？',['应用 Pod 的 init 容器或独立的 Job','应用 Pod 的第二个长期运行容器','另一个命名空间'],0,'它执行一次就结束。']]);
