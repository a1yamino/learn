/* 01 state machine */
const box=(t,s)=>({w:170,h:76,cls:'card',html:`<h6>${s}</h6><div style="font:700 20px/1 var(--f)">${t}</div>`});
const P={C:[0,180],R:[260,180],A:[260,20],X:[520,180],D:[780,180]};
const tok=(k,cmd)=>({tok:[P[k][0]+20,P[k][1]+96],cmd:[P[k][0],P[k][1]-46,{html:'<span class="pill mute">$ '+cmd+'</span>'}]});
const base={C:P.C,R:P.R,A:P.A,X:P.X,D:P.D};
Player(document.getElementById('p1'),{els:{C:box('created','已创建'),R:box('running','运行中'),A:box('paused','已暂停'),X:box('exited','已停止'),D:box('removed','已删除'),
 tok:{cls:'pill sig',html:'容器 web'},cmd:{cls:''}},
 scenes:[
 {t:'docker create',p:'按镜像创建容器：分配可写层和配置，但还没有启动进程。状态是 <b>created</b>。',set:{...base,...tok('C','docker create --name web nginx')}},
 {t:'docker start',p:'启动容器的主进程（PID 1）。状态变为 <b>running</b>。<code>docker run</code> 等于 create + start。',set:{...base,...tok('R','docker start web')}},
 {t:'docker pause / unpause',p:'冻结容器里的所有进程（cgroup freezer），内存保留。<code>unpause</code> 后从原处继续。',set:{...base,...tok('A','docker pause web')}},
 {t:'docker stop',p:'先给主进程发 <b>SIGTERM</b>，让它自己退出；10 秒后还没退出就发 <b>SIGKILL</b>。状态变为 <b>exited</b>。',d:3800,set:{...base,...tok('X','docker stop web')}},
 {t:'再次 docker start',p:'停止的容器还在，可写层里的文件也还在，可以重新启动。',set:{...base,...tok('R','docker start web')}},
 {t:'docker rm',p:'删除容器和它的可写层。运行中的容器不能直接删，要先 stop，或者用 <code>rm -f</code>。',d:3800,set:{...base,...tok('D','docker rm -f web')}}]});
/* 02 lifecycle console */
(()=>{let s='none';const sm=[...document.querySelectorAll('#sm span')],log=document.getElementById('log'),cmds=document.getElementById('cmds');
 const ID='3f2a9c1b7d4e',NR=`Error response from daemon: container ${ID} is not running`;
 const T={run:{none:['running','<span class="o">'+ID+'…</span>']},create:{none:['created',ID+'…']},
  start:{created:['running','web'],exited:['running','web'],running:['running','web']},
  pause:{running:['paused','web'],created:[0,NR],exited:[0,NR],paused:[0,`Error response from daemon: container ${ID} is already paused`]},
  unpause:{paused:['running','web'],running:[0,`Error response from daemon: container ${ID} is not paused`],created:[0,`Error response from daemon: container ${ID} is not paused`],exited:[0,`Error response from daemon: container ${ID} is not paused`]},
  stop:{running:['exited','web'],paused:['exited','web'],created:['created','web'],exited:['exited','web']},
  kill:{running:['exited','web'],paused:['exited','web'],created:[0,`Error response from daemon: cannot kill container: web: container ${ID} is not running`],exited:[0,`Error response from daemon: cannot kill container: web: container ${ID} is not running`]},
  rm:{created:['none','web'],exited:['none','web'],running:[0,`Error response from daemon: cannot remove container "/web": container is running: stop the container before removing or force remove`],paused:[0,`Error response from daemon: cannot remove container "/web": container is paused and must be unpaused first`]},
  'rm -f':{created:['none','web'],exited:['none','web'],running:['none','web'],paused:['none','web']}};
 const full={run:'docker run -d --name web nginx',create:'docker create --name web nginx'};
 const paint=()=>sm.forEach(x=>x.classList.toggle('on',x.dataset.s===s));
 Object.keys(T).forEach(k=>{const b=document.createElement('button');b.className='btn';b.textContent=k;b.addEventListener('click',()=>{const c=full[k]||`docker ${k} web`;let r=T[k][s];
  if(!r)r=s==='none'?[0,'Error response from daemon: No such container: web']:[0,`docker: Error response from daemon: Conflict. The container name "/web" is already in use.`];
  const ok=r[0]!==0;if(ok)s=r[0];log.insertAdjacentHTML('beforeend',`<b>$ ${c}</b>\n${ok?r[1]:'<span class="e">'+r[1]+'</span>'}\n`);log.scrollTop=log.scrollHeight;if(!ok)shake(b);paint()});cmds.appendChild(b)});
 log.innerHTML='<span style="opacity:.6">从 run 或 create 开始。</span>\n';paint()})();
/* 03 foreground / -d / -it */
const TB=(h)=>({w:420,h:150,cls:'card',html:h});
Player(document.getElementById('p3'),{els:{
 t1:TB('<h6>终端</h6><div style="font:400 13px/1.7 var(--m)"><b>$ docker run nginx</b><br>… start worker processes<br>172.17.0.1 "GET / HTTP/1.1" 200<br><span style="color:var(--ink2)">（终端被占用，Ctrl+C 会停止容器）</span></div>'),
 t2:TB('<h6>终端</h6><div style="font:400 13px/1.7 var(--m)"><b>$ docker run -d nginx</b><br>7c1f4a2e9b3d…<br><b>$</b> <span style="color:var(--ink2)">（立即返回，可以继续输入）</span></div>'),
 t3:TB('<h6>终端</h6><div style="font:400 13px/1.7 var(--m)"><b>$ docker run -it ubuntu bash</b><br>root@4b1e2c:/# ls<br>bin  etc  home  usr  var<br>root@4b1e2c:/# <span style="color:var(--ink2)">（在容器里）</span></div>'),
 c:{w:200,h:150,cls:'blk dim',html:'容器<br>nginx'},ln:{w:90,cls:'tag',html:'<div style="text-align:center">stdout<br>→</div>'}},
 scenes:[
 {t:'默认：前台运行',p:'容器的输出直接打印在你的终端上，终端被占用。按 Ctrl+C 会把信号发给容器，容器随之停止。',set:{c:[0,0],ln:[230,50],t1:[340,0]}},
 {t:'-d：后台运行',p:'<code>-d</code>（detach）让容器在后台运行，只打印容器 ID。输出仍然被 Docker 记录，用 <code>docker logs</code> 查看。',set:{c:[0,0,{html:'容器<br>nginx · 后台'}],t2:[340,0]}},
 {t:'-it：交互式',p:'<code>-i</code> 保持标准输入打开，<code>-t</code> 分配一个终端。两者一起用于 bash、python 这类交互程序。输入 <code>exit</code> 退出，容器也随之停止。',d:3800,set:{c:[0,0,{html:'容器<br>ubuntu · bash'}],t3:[340,0]}}]});
/* 04 terminal */
Term(document.getElementById('t4'),[
['docker logs -f --tail 5 web',`/docker-entrypoint.sh: Configuration complete; ready for start up
2026/10/21 09:46:01 [notice] 1#1: nginx/1.27.2
172.17.0.1 - - [21/Oct/2026:09:46:12 +0000] "GET / HTTP/1.1" 200 615 "-" "curl/8.5.0"
^C`,'<code>logs</code> 读取主进程写到 stdout/stderr 的内容。<code>-f</code> 持续跟随，<code>--tail 5</code> 只看最后 5 行，<code>--since 10m</code> 只看最近 10 分钟。应用要把日志写到 stdout，不要写到容器里的文件。'],
['docker exec -it web sh',`# ps
PID   USER     COMMAND
    1 root     nginx: master process nginx -g daemon off;
   29 nginx    nginx: worker process
   31 root     sh
# exit`,'<code>exec</code> 在<b>运行中</b>的容器里启动一个新进程，这里是 sh。PID 1 是容器的主进程；sh 退出不会影响它。精简镜像里可能没有 bash，用 sh。'],
['docker inspect -f "{{.State.Status}} {{.State.Pid}}" web','running 48213','<code>inspect</code> 输出容器的全部配置和状态（JSON）。<code>-f</code> 用 Go 模板取出某个字段。48213 是这个容器的主进程在宿主机上的 PID——容器就是宿主机上的一个进程。'],
['docker stats --no-stream web',`CONTAINER ID   NAME   CPU %   MEM USAGE / LIMIT     NET I/O
7c1f4a2e9b3d   web    0.00%   7.3MiB / 7.7GiB       1.2kB / 0B`,'实时资源使用。不加 <code>--no-stream</code> 会持续刷新。没有设置内存限制时，LIMIT 显示宿主机的全部内存。']]);
Quiz(document.getElementById('qs'),[
['执行 docker stop 后，容器可写层里的文件会怎样？',['被删除','保留，直到 docker rm','写回镜像'],1,'stop 只停止进程。rm 才删除容器和可写层。'],
['docker stop 默认怎样停止容器？',['立即 SIGKILL','先 SIGTERM，10 秒后 SIGKILL','发送 Ctrl+C 到终端'],1,'给应用一个优雅退出的机会。时长用 -t 修改。'],
['想在一个运行中的容器里查看进程，应该用？',['docker run -it 同一个镜像','docker exec -it 容器名 sh','docker attach 后输入命令'],1,'run 会新建另一个容器；exec 进入的是现有容器。']]);
