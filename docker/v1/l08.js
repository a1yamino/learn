const B=(t,c,w=240,h=44)=>({w,h,cls:'blk '+c,html:t});
const cmd=(t)=>({w:520,h:40,cls:'blk dim',html:'<span style="padding:0 12px;width:100%;text-align:left;font-size:12px">'+t+'</span>'});
Player(document.getElementById('p1'),{els:{
 c1:cmd('docker network create demo'),c2:cmd('docker volume create redisdata'),c3:cmd('docker run -d --name cache --network demo -v redisdata:/data redis:7 …'),c4:cmd('docker build -t api . && docker run -d --name api --network demo -p 8000:8000 -e REDIS_HOST=cache api'),
 y:{w:340,cls:'card',html:'<h6>compose.yaml</h6><pre style="margin:0;font:400 12px/1.55 var(--m)">services:\n  api:\n    build: .\n    ports: ["8000:8000"]\n    environment:\n      REDIS_HOST: cache\n  cache:\n    image: redis:7\n    volumes: [redisdata:/data]\nvolumes:\n  redisdata:</pre>'},
 net:{w:520,h:250,cls:'frame',html:'<i>网络 demo_default</i>'},api:B('demo-api-1','sig',200),cache:B('demo-cache-1','',200),vol:B('卷 demo_redisdata','hatch',200),up:{cls:'pill mute',html:'$ docker compose up -d'}},
 scenes:[
 {t:'四条命令',p:'网络、数据卷、两个容器，参数分散在各处。顺序错了、参数漏了，环境就不一样。',set:{c1:[0,0],c2:[0,50],c3:[0,100],c4:[0,150]}},
 {t:'写成一个文件',p:'同样的内容写进 <code>compose.yaml</code>。服务名 <b>cache</b> 同时是 api 访问 Redis 用的主机名。',d:3600,set:{y:[0,0]}},
 {t:'docker compose up -d',p:'Compose 以目录名作为<b>项目名</b>，创建网络 <code>项目_default</code>、数据卷和容器 <code>项目-服务-序号</code>，全部接入同一网络。',d:3800,set:{y:[0,0],up:[400,-30],net:[400,20],api:[440,70],cache:[700,70],vol:[700,190]}}]});
Player(document.getElementById('p2'),{els:{
 db:B('db · 启动中…','dim',200),api:B('api','',200),t:{w:420,cls:'tag'},err:{cls:'pill bad',html:'Connection refused'},ok:{cls:'pill ok',html:'已连接'},hc:{cls:'pill mute'}},
 scenes:[
 {t:'depends_on: [db]',p:'Compose 先启动 db 容器，再启动 api。但“容器已启动”不等于“数据库可以接受连接”。PostgreSQL 初始化要几秒。',set:{db:[0,0],api:[0,90],t:[240,10,{html:'<b>1.</b> 启动 db 容器'}]}},
 {t:'api 太早连接',p:'api 启动后立刻连接，db 还在初始化，连接被拒绝。没有重试逻辑的应用直接崩溃退出。',d:3600,set:{db:[0,0],api:[0,90,{cls:'blk dim',html:'api · 已退出'}],err:[240,100],t:[240,10,{html:'<b>2.</b> 立即启动 api'}]}},
 {t:'condition: service_healthy',p:'给 db 加健康检查（<code>pg_isready</code>），api 的 depends_on 写成 <code>condition: service_healthy</code>。Compose 会等到 db 变成 healthy 再启动 api。',d:3800,set:{db:[0,0,{cls:'blk',html:'db · healthy'}],hc:[240,10,{html:'pg_isready ✓'}],api:[0,90,{cls:'blk sig',html:'api'}],ok:[240,100]}}]});
(()=>{const lg=document.getElementById('lg'),ed=document.getElementById('ed');
 const R={none:['不修改',[['db','Running'],['cache','Running'],['api','Running']],'没有变化，什么都不做。up 是声明式的：让实际状态符合文件。'],
  tag:['db 的 image 从 postgres:16.3 改成 16.4',[['db','Recreated'],['cache','Running'],['api','Running']],'只有 db 被重建（先拉新镜像）。数据在卷里，不受影响。依赖 db 的服务不会因此重建。'],
  env:['api 的 environment 加一个变量',[['db','Running'],['cache','Running'],['api','Recreated']],'环境变量是容器配置的一部分，改了就要用新配置重建容器。'],
  code:['只改了 api 的代码（main.py）',[['db','Running'],['cache','Running'],['api','Running']],'<b>什么都没重建！</b>Compose 只比较配置，不知道代码变了。要执行 <code>docker compose up -d --build</code>，重新构建镜像后 api 才会重建。'],
  build:['改了代码，执行 up -d --build',[['db','Running'],['cache','Running'],['api','Recreated']],'重新构建 api 镜像；镜像 ID 变了，所以 api 被重建。构建缓存仍然有效。'],
  port:['cache 加了 ports: ["6379:6379"]',[['db','Running'],['cache','Recreated'],['api','Running']],'端口映射在创建容器时决定，改了只能重建。']};
 Object.entries(R).forEach(([k,[l]])=>{const b=document.createElement('button');b.className='btn';b.textContent=l;b.dataset.v=k;b.addEventListener('click',()=>show(k));ed.appendChild(b)});
 function show(k){ed.querySelectorAll('.btn').forEach(b=>b.classList.toggle('pri',b.dataset.v===k));const [,rows,x]=R[k];
  lg.innerHTML=`<b>$ docker compose up -d${k==='build'?' --build':''}</b>\n`+rows.map(([s,st])=>` ${st==='Recreated'?'<span class="o">✔</span>':'✔'} Container demo-${s}-1  ${st==='Recreated'?'<span class="o">Recreated</span>':'Running'}`).join('\n')+'\n\n'+x}show('code')})();
Term(document.getElementById('t4'),[
['docker compose up -d',' ✔ Network demo_default       Created\n ✔ Volume "demo_redisdata"    Created\n ✔ Container demo-cache-1     Started\n ✔ Container demo-api-1       Started','<code>-d</code> 后台运行。不加 -d 时，所有服务的日志混在前台输出，Ctrl+C 停止全部。'],
['docker compose ps','NAME           IMAGE      SERVICE   STATUS          PORTS\ndemo-api-1     demo-api   api       Up 2 minutes    0.0.0.0:8000->8000/tcp\ndemo-cache-1   redis:7    cache     Up 2 minutes    6379/tcp','只列出这个项目的容器。注意 cache 的 6379 没有映射到宿主机，只在项目网络里可访问。'],
['docker compose logs -f --tail 20 api','demo-api-1  | INFO:     Started server process [1]\ndemo-api-1  | INFO:     Uvicorn running on http://0.0.0.0:8000','省略服务名就看全部服务的日志，每行带服务前缀。'],
['docker compose exec cache redis-cli get hits','"4"','在运行中的服务容器里执行命令，用服务名而不是容器名。'],
['docker compose down','  ✔ Container demo-api-1     Removed\n ✔ Container demo-cache-1   Removed\n ✔ Network demo_default     Removed','删除容器和网络。<b>数据卷保留</b>。<code>down -v</code> 才会删除数据卷，在有数据的项目上慎用。']]);
Quiz(document.getElementById('qs'),[
['Compose 项目里，api 怎样访问 Redis？',['localhost:6379','cache:6379（服务名）','宿主机 IP:6379'],1,'项目网络自带 DNS，服务名就是主机名。'],
['depends_on: [db] 能保证什么？',['db 已经可以接受连接','db 容器先启动','db 不会崩溃'],1,'就绪要用 condition: service_healthy。'],
['改了 api 的源代码后执行 docker compose up -d，会发生什么？',['api 自动重建','什么都不变，需要 --build','所有服务重建'],1,'Compose 只比较配置和镜像。'],
['想保留数据库数据，同时删除所有容器，应该用？',['docker compose down','docker compose down -v','docker volume prune'],0,'-v 会删除数据卷。']]);
