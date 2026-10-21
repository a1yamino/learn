const B=(t,c,w=300,h=44)=>({w,h,cls:'blk '+c,html:t});
const base={ctr:[0,0],img:[0,170],lab:[0,-36]};
Player(document.getElementById('p1'),{els:{ctr:{w:300,h:220,cls:'card',html:'<h6>容器 pg</h6>'},wl:B('可写层 · 数据库文件','hatch',260),img:B('镜像 postgres:16 · 只读','dim'),lab:{w:300,cls:'tag'},
 mnt:{w:170,cls:'tag'},vol:B('命名卷 pgdata<br><span style="font-size:11px;opacity:.7">/var/lib/docker/volumes/pgdata</span>','',300,64),bind:B('宿主机目录 ./data<br><span style="font-size:11px;opacity:.7">你指定的任意路径</span>','',300,64),tmp:B('内存 tmpfs<br><span style="font-size:11px;opacity:.7">停止即清空</span>','dim',300,64),res:{w:300,cls:'tag'}},
 scenes:[
 {t:'默认：写在可写层',p:'不挂载时，数据库文件写进容器的可写层。',set:{...base,wl:[20,110],lab:[0,-36,{html:'<b>没有挂载</b>'}]}},
 {t:'删除容器，数据一起删除',p:'<code>docker rm</code> 删除可写层。数据库里的数据没了，新建的容器是空的。',set:{...base,wl:[20,110,{cls:'blk dim',html:'可写层（已删除）'}],res:[0,250,{html:'<b style="color:var(--bad)">数据丢失</b>'}]}},
 {t:'命名卷',p:'把 <code>/var/lib/postgresql/data</code> 挂到一个命名卷上。卷由 Docker 管理，独立于容器存在，删除容器不影响它。',d:3600,set:{...base,lab:[0,-36,{html:'<b>--mount type=volume</b>'}],wl:[20,110,{cls:'blk',html:'/var/lib/postgresql/data'}],mnt:[340,120,{html:'<div style="text-align:center">挂载<br><span style="font-size:22px;color:var(--ink)">→</span></div>'}],vol:[520,100]}},
 {t:'绑定挂载',p:'把宿主机上你指定的目录映射进去。两边看到的是同一份文件，适合开发时同步代码和配置。',set:{...base,lab:[0,-36,{html:'<b>--mount type=bind</b>'}],wl:[20,110,{cls:'blk',html:'/app'}],mnt:[340,120,{html:'<div style="text-align:center">挂载<br><span style="font-size:22px;color:var(--ink)">→</span></div>'}],bind:[520,100]}},
 {t:'tmpfs',p:'存在内存里，不写磁盘。适合临时文件、敏感的临时数据。容器停止就消失。',set:{...base,lab:[0,-36,{html:'<b>--mount type=tmpfs</b>'}],wl:[20,110,{cls:'blk',html:'/tmp'}],mnt:[340,120,{html:'<div style="text-align:center">挂载<br><span style="font-size:22px;color:var(--ink)">→</span></div>'}],tmp:[520,100]}}]});
/* 02 */
(()=>{let mode='none',exists=false,run=false,layer=false,store={volume:false,bind:false},mem=false;const lg=document.getElementById('lg'),MT=document.getElementById('mt'),AC=document.getElementById('ac');
 const FLAG={none:'',volume:' --mount type=volume,src=pgdata,dst=/var/lib/postgresql/data',bind:' --mount type=bind,src=$PWD/pgdata,dst=/var/lib/postgresql/data',tmpfs:' --mount type=tmpfs,dst=/var/lib/postgresql/data'};
 const out=(c,r,cls)=>{lg.insertAdjacentHTML('beforeend',`<b>$ ${c}</b>\n${cls?`<span class="${cls}">${r}</span>`:r}\n`);lg.scrollTop=lg.scrollHeight};
 [['none','不挂载'],['volume','命名卷'],['bind','绑定挂载'],['tmpfs','tmpfs']].forEach(([v,l])=>{const b=document.createElement('button');b.className='btn';b.textContent=l;b.dataset.v=v;b.addEventListener('click',()=>{if(exists){shake(b);out('# 切换挂载方式','先删除现有容器（挂载在创建时决定，之后不能改）。','e');return}mode=v;paint()});MT.appendChild(b)});
 const has=()=>mode==='none'?layer:mode==='tmpfs'?mem:store[mode];
 const A={'docker run':()=>{if(exists)return out('docker run -d --name pg …','Conflict. The container name "/pg" is already in use.','e');exists=run=true;out('docker run -d --name pg -e POSTGRES_PASSWORD=dev'+FLAG[mode]+' postgres:16','a91c3e…')},
  '写入一行':()=>{if(!run)return out('docker exec pg psql …','Error: No such container: pg','e');if(mode==='none')layer=true;else if(mode==='tmpfs')mem=true;else store[mode]=true;out("docker exec pg psql -U postgres -c \"INSERT INTO t VALUES ('hello')\"",'INSERT 0 1')},
  '查询':()=>{if(!run)return out('docker exec pg psql …','Error: No such container: pg','e');out('docker exec pg psql -U postgres -tc "SELECT x FROM t"',has()?' hello':'(0 rows)',has()?'o':'e')},
  'docker restart':()=>{if(!exists)return out('docker restart pg','Error: No such container: pg','e');mem=false;out('docker restart pg','pg'+(mode==='tmpfs'?'\n<span style="opacity:.7"># tmpfs 在停止时被清空</span>':''))},
  'docker rm -f':()=>{if(!exists)return out('docker rm -f pg','Error: No such container: pg','e');exists=run=false;layer=false;mem=false;out('docker rm -f pg','pg'+(mode==='none'?'\n<span style="opacity:.7"># 可写层已删除</span>':''))}};
 Object.keys(A).forEach(k=>{const b=document.createElement('button');b.className='btn';b.textContent=k;b.addEventListener('click',A[k]);AC.appendChild(b)});
 function paint(){[...MT.children].forEach(b=>b.classList.toggle('pri',b.dataset.v===mode))}paint();
 lg.innerHTML='<span style="opacity:.6">建议顺序：docker run → 写入一行 → docker rm -f → docker run → 查询。再换一种挂载方式试试。</span>\n'})();
/* 03 masking */
const F=(h,t,w=280)=>({w,cls:'card',html:`<h6>${h}</h6><div style="font:500 13px/1.8 var(--m)">${t}</div>`});
Player(document.getElementById('p3'),{els:{im:F('镜像里的 /app','main.py<br>requirements.txt<br>static/'),hd:F('宿主机 ./empty','<span style="color:var(--ink2)">（空目录）</span>'),nv:F('新的命名卷 appdata','<span style="color:var(--ink2)">（空）</span>'),
 see:F('容器里看到的 /app',''),ar:{w:120,cls:'tag'}},scenes:[
 {t:'镜像里有文件',p:'镜像的 /app 目录里有代码和静态文件。',set:{im:[0,0]}},
 {t:'绑定挂载一个空目录',p:'<code>-v $PWD/empty:/app</code>。挂载点会<b>遮住</b>镜像里原有的 /app。容器看到的是宿主机的空目录，应用启动失败：找不到 main.py。',d:3800,set:{im:[0,0,{cls:'card',html:'<h6>镜像里的 /app（被遮住）</h6><div style="font:500 13px/1.8 var(--m);opacity:.4">main.py<br>requirements.txt<br>static/</div>'}],hd:[0,170],ar:[310,200,{html:'<div style="text-align:center">遮住<br><span style="font-size:22px;color:var(--ink)">→</span></div>'}],see:[450,170,{html:'<h6>容器里看到的 /app</h6><div style="font:500 13px/1.8 var(--m);color:var(--bad)">（空）</div>'}]}},
 {t:'空的命名卷：先复制',p:'<code>-v appdata:/app</code>。命名卷是空的时候，Docker 会<b>先把镜像里的内容复制进卷</b>，再挂载。之后卷里有内容，就不再复制，即使镜像更新了也不会。',d:4200,set:{im:[0,0],nv:[0,170,{html:'<h6>命名卷 appdata</h6><div style="font:500 13px/1.8 var(--m)">main.py<br>requirements.txt<br>static/</div>'}],ar:[310,200,{html:'<div style="text-align:center">挂载<br><span style="font-size:22px;color:var(--ink)">→</span></div>'}],see:[450,170,{html:'<h6>容器里看到的 /app</h6><div style="font:500 13px/1.8 var(--m);color:var(--ok)">main.py<br>requirements.txt<br>static/</div>'}]}}]});
Term(document.getElementById('t4'),[
['docker volume ls','DRIVER    VOLUME NAME\nlocal     pgdata\nlocal     3f9a1c0e7b…','带长哈希名字的是<b>匿名卷</b>：镜像里写了 <code>VOLUME</code> 指令（postgres 镜像就有）却没指定卷名时自动创建。用 <code>docker volume prune</code> 清理没有被使用的卷。'],
['docker run -d -v pgdata:/var/lib/postgresql/data postgres:16','8be1…','<code>-v 名字:路径</code> 是命名卷；<code>-v /绝对路径:路径</code> 或 <code>-v ./相对路径:路径</code> 是绑定挂载。只看写法容易混淆，所以推荐 <code>--mount</code>。'],
['docker run --mount type=bind,src=./nope,dst=/app alpine','docker: Error response from daemon: invalid mount config for type "bind": bind source path does not exist: /home/you/nope','<code>--mount</code> 在路径不存在时报错。<code>-v ./nope:/app</code> 会悄悄创建一个属于 root 的空目录，然后遮住 /app，问题更难发现。'],
['docker run --rm -v ./site:/data:ro alpine touch /data/x','touch: /data/x: Read-only file system','<code>:ro</code>（或 <code>readonly</code>）只读挂载。配置文件和代码在生产中通常只读挂载。'],
['docker inspect -f "{{json .Mounts}}" pg','[{"Type":"volume","Name":"pgdata","Source":"/var/lib/docker/volumes/pgdata/_data","Destination":"/var/lib/postgresql/data","Driver":"local","RW":true}]','查看一个容器挂载了什么。排查“数据去哪了”时第一步看这里。']]);
Quiz(document.getElementById('qs'),[
['生产环境的 PostgreSQL 数据目录，应该用哪种挂载？',['不挂载','命名卷','tmpfs'],1,'由 Docker 管理，独立于容器，便于备份。'],
['开发时用 -v $PWD:/app 挂载代码，结果镜像里 /app 下安装好的 node_modules 不见了。为什么？',['npm 出错了','绑定挂载遮住了镜像里的 /app','node_modules 被 .dockerignore 排除'],1,'常见解法：再给 /app/node_modules 单独挂一个命名卷。'],
['docker rm -f 删除容器后，它使用的命名卷会怎样？',['一起删除','保留，需要 docker volume rm 单独删除','变成匿名卷'],1,'docker rm -v 只会删除匿名卷。'],
['哪种挂载的数据在容器重启后就没有了？',['命名卷','绑定挂载','tmpfs'],2,'tmpfs 在内存里，停止即清空。']]);
