const N=(t,s,c='',w=240)=>({w,h:56,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
Player(document.getElementById('p1'),{els:{
 ap:N('应用写文件','write()','sig',200),ov:N('overlay 文件系统','查找、copy-up','dim'),up:N('upperdir','/var/lib/docker/overlay2/…/diff'),bm:N('bind mount','直接映射','dim'),vd:N('卷目录','/var/lib/docker/volumes/x/_data'),disk:N('宿主机磁盘','ext4 / xfs','ink',520),
 l1:{w:240,cls:'tag'},l2:{w:240,cls:'tag'},n:{w:520,cls:'tag'}},scenes:[
 {t:'写到容器层',p:'经过 overlay：先在各层里查找文件，修改已有文件时整个复制到 upperdir（copy-up），再写入。',set:{ap:[0,0],ov:[0,90],up:[0,180],disk:[0,270],l1:[0,-30,{html:'<b>/app/cache</b>（容器层）'}]}},
 {t:'写到数据卷',p:'卷目录通过 bind mount 直接挂在容器的挂载点上，写入直接落到宿主机文件系统，没有分层和 copy-up。',d:3600,set:{ap:[0,0],ov:[0,90],up:[0,180],disk:[0,270],l1:[0,-30,{html:'<b>/app/cache</b>（容器层）'}],l2:[280,-30,{html:'<b>/var/lib/postgresql/data</b>（卷）'}],bm:[280,90],vd:[280,180]}},
 {t:'所以',p:'数据库、日志、大量写入的目录都应该放在卷上：更快，而且生命周期独立于容器。',set:{ap:[0,0],ov:[0,90],up:[0,180],disk:[0,270],l1:[0,-30,{html:'<b>/app/cache</b>（容器层）'}],l2:[280,-30,{html:'<b>/var/lib/postgresql/data</b>（卷）'}],bm:[280,90,{cls:'blk sig'}],vd:[280,180,{cls:'blk sig'}],n:[0,340,{html:'容器层适合少量写入；频繁写入用卷'}]}}]});
Player(document.getElementById('p2'),{els:{
 mac:{w:700,h:330,cls:'frame',html:'<i>你的 Mac</i>'},vm:{w:440,h:240,cls:'card',html:'<h6>Docker Desktop 虚拟机（Linux）</h6>'},ct:N('容器','/app','sig',180),code:N('~/project','你的代码','',180),vs:{w:200,cls:'tag'},vol:N('命名卷','虚拟机磁盘',''),n:{w:700,cls:'tag'}},scenes:[
 {t:'容器在虚拟机里',p:'Mac / Windows 没有 Linux 内核，Docker Desktop 运行一个轻量的 Linux 虚拟机，容器都在里面。',set:{mac:[0,0],vm:[240,50],ct:[270,110]}},
 {t:'绑定挂载跨越边界',p:'<code>-v ~/project:/app</code>：文件在 Mac 上，容器在虚拟机里。每次读写都要经过文件共享（virtiofs），还要同步文件变更事件。node_modules 这类几万个小文件时尤其慢。',d:4000,set:{mac:[0,0],vm:[240,50],ct:[270,110],code:[30,110],vs:[30,200,{html:'↔ virtiofs 文件共享'}]}},
 {t:'命名卷在虚拟机内部',p:'命名卷存在虚拟机的磁盘上，速度接近原生。常见做法：代码用绑定挂载（方便编辑），依赖目录（node_modules、.venv）用命名卷。',d:4000,set:{mac:[0,0],vm:[240,50],ct:[270,110],code:[30,110],vs:[30,200,{html:'↔ virtiofs 文件共享'}],vol:[470,190],n:[0,350,{html:'<b>-v ~/project:/app -v node_modules:/app/node_modules</b>'}]}}]});
(()=>{const S={img:{n:'Images',t:23,a:5,s:41.2,r:36.8},ctr:{n:'Containers',t:64,a:4,s:9.6,r:9.3},vol:{n:'Local Volumes',t:31,a:6,s:22.4,r:14.1},bc:{n:'Build Cache',t:1408,a:0,s:13.8,r:13.8}};const df=document.getElementById('df'),pm=document.getElementById('pm'),pr=document.getElementById('pr');
 const P=[['docker container prune','删除所有已停止的容器（和它们的可写层）。运行中的不受影响。',()=>{S.ctr.s-=S.ctr.r;S.ctr.r=0;S.ctr.t=S.ctr.a},''],
  ['docker image prune','只删除 dangling 镜像（没有标签的 &lt;none&gt;，通常是重新构建后被替换掉的旧版本）。',()=>{const x=Math.min(S.img.r,9.4);S.img.s-=x;S.img.r-=x;S.img.t-=8},''],
  ['docker image prune -a','删除所有<b>没有被容器使用</b>的镜像，包括有标签的。下次运行要重新拉取。',()=>{S.img.s-=S.img.r;S.img.r=0;S.img.t=S.img.a},''],
  ['docker builder prune','删除构建缓存。下次构建会变慢，但不影响任何运行中的东西。可以用 <code>--keep-storage 5GB</code> 保留一部分。',()=>{S.bc.s=0;S.bc.r=0;S.bc.t=0},''],
  ['docker volume prune -a','<span style="color:var(--bad)"><b>删除所有没有被容器使用的卷。</b>如果某个数据库容器刚好被删除或停止后删除了，它的数据就没了。</span>执行前先 <code>docker volume ls -f dangling=true</code> 看清楚。',()=>{S.vol.s-=S.vol.r;S.vol.r=0;S.vol.t=S.vol.a},'bad']];
 const tot=()=>Object.values(S).reduce((a,x)=>a+x.s,0);
 function draw(){df.innerHTML='<b>$ docker system df</b>\nTYPE            TOTAL   ACTIVE   SIZE      RECLAIMABLE\n'+Object.values(S).map(x=>`${x.n.padEnd(16)}${String(x.t).padEnd(8)}${String(x.a).padEnd(9)}${(x.s.toFixed(1)+'GB').padEnd(10)}${x.r.toFixed(1)}GB`).join('\n')+`\n\n<span style="color:#a9a69f">合计 ${tot().toFixed(1)} GB</span>`}
 P.forEach(([c,x,f,k])=>{const b=document.createElement('button');b.className='btn';b.textContent=c;b.addEventListener('click',()=>{f();b.disabled=true;draw();pm.className='msg'+(k?' bad':'');pm.innerHTML=x});pr.appendChild(b)});draw()})();
Term(document.getElementById('t4'),[
['docker info --format "{{.Driver}}  {{json .DriverStatus}}"','overlayfs  [["driver-type","io.containerd.snapshotter.v1"]]','新版 Docker 使用 containerd 镜像存储，驱动显示为 overlayfs snapshotter；旧安装显示 overlay2。Rootless 模式可能是 fuse-overlayfs。'],
['docker system df -v | head -12','Images space usage:\nREPOSITORY   TAG    IMAGE ID      SIZE     SHARED SIZE   UNIQUE SIZE   CONTAINERS\napi-demo     1.0    a1b2…         190MB    130MB         60MB          1\npython       3.12   9f2a…         130MB    130MB         0B            0','<b>SHARED SIZE</b>：和其他镜像共享的层。删除 python:3.12 只能释放 UNIQUE SIZE，因为它的层被 api-demo 共用。'],
['docker volume create --driver local --opt type=nfs --opt o=addr=10.0.0.5,rw --opt device=:/exports/data nfsdata','nfsdata','local 驱动也能挂载 NFS、CIFS、tmpfs：参数直接传给 mount。第一次有容器使用这个卷时才真正挂载。'],
['docker run --rm --mount type=tmpfs,dst=/scratch,tmpfs-size=64m alpine df -h /scratch','Filesystem   Size   Used Available Use% Mounted on\ntmpfs        64.0M     0     64.0M   0% /scratch','tmpfs 的大小可以限制。不限制时最多可以用到宿主机内存的一半。'],
['docker container inspect -f "{{.SizeRw}} {{.SizeRootFs}}" --size web','1048576 188743680','<b>SizeRw</b>：容器层的大小（1 MB）。<b>SizeRootFs</b>：镜像 + 容器层。容器层持续增长，说明应用在往容器里写数据，应该改用卷。']]);
Quiz(document.getElementById('qs'),[
['数据库写入密集，数据目录应该放在？',['容器层','命名卷','tmpfs'],1,'不经过 overlay，且独立于容器生命周期。'],
['Mac 上 npm install 在绑定挂载的目录里特别慢，常见的改法是？',['换成 alpine 镜像','给 node_modules 单独挂一个命名卷','关闭 BuildKit'],1,'大量小文件不跨虚拟机边界。'],
['哪条命令可能删除数据库数据？',['docker image prune','docker builder prune','docker volume prune'],2,'执行前确认卷的用途。'],
['服务器磁盘被 /var/lib/docker/containers 占满，最可能的原因？',['镜像太多','容器日志没有大小限制','卷太大'],1,'配置 max-size 或使用 local 日志驱动。']]);
