const S=(t,s,c='',w=150)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
Player(document.getElementById('p1'),{els:{db:S('db','postgres'),mg:S('migrate','建表'),web:S('web','应用'),pd:{cls:'pill mute'},pm:{cls:'pill mute'},pw:{cls:'pill mute'},n:{w:640,cls:'tag'}},scenes:[
 {t:'三个服务',p:'web 需要数据库里已有表；表由 migrate 创建；migrate 需要数据库能连接。',set:{db:[0,80],mg:[230,80],web:[460,80]}},
 {t:'只写 depends_on',p:'默认条件是 <code>service_started</code>：db 容器一启动，migrate 就开始。但 Postgres 还在初始化，连接被拒绝。',d:3800,set:{db:[0,80],mg:[230,80,{cls:'blk dim'}],web:[460,80],pd:[0,20,{cls:'pill sig',html:'已启动，未就绪'}],pm:[230,20,{cls:'pill bad',html:'connection refused'}],n:[0,170,{html:'容器启动 ≠ 服务就绪'}]}},
 {t:'healthcheck + service_healthy',p:'db 定义 <code>pg_isready</code> 健康检查。migrate 等到 db 状态变成 <b>healthy</b> 才启动。',d:3600,set:{db:[0,80,{cls:'blk sig'}],mg:[230,80],web:[460,80],pd:[0,20,{cls:'pill ok',html:'healthy'}],pm:[230,20,{cls:'pill mute',html:'运行中'}]}},
 {t:'service_completed_successfully',p:'migrate 退出码 0 后，web 才启动。退出码非 0 时 web 不会启动，<code>up</code> 报错。',d:3600,set:{db:[0,80,{cls:'blk sig'}],mg:[230,80,{cls:'blk dim'}],web:[460,80,{cls:'blk sig'}],pd:[0,20,{cls:'pill ok',html:'healthy'}],pm:[230,20,{cls:'pill ok',html:'Exited (0)'}],pw:[460,20,{cls:'pill ok',html:'Started'}]}}]});
Player(document.getElementById('p2'),{els:{a:{w:220,h:150,cls:'frame',html:'<i>compose.yaml</i><br>image、depends_on<br>healthcheck、networks'},b:{w:220,h:150,cls:'frame',html:'<i>compose.override.yaml</i><br>build: .<br>ports 8080<br>develop.watch'},c:{w:220,h:150,cls:'frame',html:'<i>compose.prod.yaml</i><br>restart<br>资源限制<br>命名卷'},r:S('合并结果','docker compose config','sig',220),n:{w:720,cls:'tag'}},scenes:[
 {t:'公共部分',p:'<code>compose.yaml</code> 描述所有环境共有的结构：服务、依赖、健康检查。',set:{a:[0,0]}},
 {t:'开发：自动叠加',p:'<code>docker compose up</code> 会自动读取 <code>compose.override.yaml</code>，叠加在上面。适合放本地构建、调试端口、代码同步。',set:{a:[0,0],b:[260,0],r:[130,200],n:[0,280,{html:'compose.yaml + compose.override.yaml'}]}},
 {t:'生产：显式指定',p:'<code>-f compose.yaml -f compose.prod.yaml</code>：只合并列出的文件，override 不会被读取。',d:3600,set:{a:[0,0],b:[260,0,{cls:'frame dim'}],c:[520,0],r:[260,200],n:[0,280,{html:'-f compose.yaml -f compose.prod.yaml'}]}},
 {t:'合并规则',p:'标量（image、restart）后者覆盖；映射（environment）按键合并；列表（ports）默认<b>追加</b>，用 <code>!override</code> 或 <code>!reset</code> 替换。',d:4000,set:{a:[0,0],c:[260,0],r:[520,0]}}]});
(()=>{const st={db:'started',mg:'started'};const opts=[['started','service_started'],['healthy','service_healthy'],['done','service_completed_successfully']];
 const mk=(id,lab,key)=>{const el=document.getElementById(id);el.innerHTML=`<span style="font:500 13px var(--m);margin-right:6px">${lab}</span>`;opts.forEach(([v,l])=>{const b=document.createElement('button');b.className='btn';b.textContent=l;b.dataset.v=v;b.addEventListener('click',()=>{st[key]=v;draw()});el.appendChild(b)})};
 mk('c1','web → db：','db');mk('c2','web → migrate：','mg');
 const lg=document.getElementById('lg'),cm=document.getElementById('cm');
 function draw(){['c1','c2'].forEach((id,i)=>document.querySelectorAll('#'+id+' .btn').forEach(b=>b.classList.toggle('pri',b.dataset.v===st[i?'mg':'db'])))}
 document.getElementById('go').addEventListener('click',()=>{const L=[];let ok=true,msg;
  // db timings: start 0, healthy 4. migrate: start 0 (assumed healthy dep on db), exits 2s after start
  const dbReady=4,mgStart=4,mgDone=6;let t=0;
  if(st.db==='done'){L.push('0.0s db  started (长期运行，不会退出)');L.push('…… web 一直等待 db 退出');ok=false;msg='<b>service_completed_successfully</b> 用于会退出的任务。db 长期运行，web 永远等不到。'}
  else{const tdb=st.db==='healthy'?dbReady:0;let tmg=st.mg==='started'?mgStart:st.mg==='healthy'?null:mgDone;
   L.push('0.0s db       started','4.0s db       healthy','4.0s migrate  started','6.0s migrate  exited (0)');
   if(tmg===null){L.push('…… migrate 没有定义 healthcheck，并且已退出');ok=false;msg='migrate 没有健康检查，<b>service_healthy</b> 无法满足，<code>up</code> 报错：dependency failed to start。'}
   else{t=Math.max(tdb,tmg);L.push(t.toFixed(1)+'s web      started');
    if(t<dbReady){ok=false;L.push(t.toFixed(1)+'s web      ERROR connection refused (db 未就绪)');msg='web 在数据库就绪前启动，连接失败。db 用 <b>service_healthy</b>。'}
    else if(t<mgDone){ok=false;L.push(t.toFixed(1)+'s web      ERROR relation "t" does not exist');msg='web 在迁移完成前启动，表还不存在。migrate 用 <b>service_completed_successfully</b>。'}
    else msg='正确：db 等到 healthy，migrate 等到成功退出。web 启动时，数据库可连接，表已存在。'}}
  L.sort();lg.innerHTML=L.map(x=>`<div>${x.replace(/ERROR.*/,m=>`<b style="color:var(--bad)">${m}</b>`)}</div>`).join('');cm.className='msg '+(ok?'ok':'bad');cm.innerHTML=msg;if(!ok&&window.shake)shake(lg)});draw()})();
Term(document.getElementById('t4'),[
['docker compose config','name: cdeep\nservices:\n  web:\n    image: nginx:alpine\n    ports:\n      - mode: ingress\n        target: 80\n        published: "8080"\n…','输出所有文件合并、变量替换之后的最终配置。排查“为什么没生效”时第一步就看它。<code>--services</code>、<code>--volumes</code> 只列名字。'],
['docker compose --profile debug up -d','✔ Container cdeep-adminer-1  Started','只启动没有 profile 的服务 + 指定 profile 的服务。也可以用 <code>COMPOSE_PROFILES=debug</code>。直接 <code>docker compose up adminer</code> 也会启动它。'],
['docker compose up -d --wait','✔ Container cdeep-db-1   Healthy\n✔ Container cdeep-web-1  Healthy','等到所有服务 running/healthy 才返回，失败则退出码非 0。适合 CI 和部署脚本。'],
['docker compose watch','Watch enabled\nSyncing "web" after changes were detected\nRebuilding service(s) ["web"] after changes were detected','配合 <code>develop.watch</code>：<code>action: sync</code> 把改动的源文件复制进容器；<code>action: rebuild</code> 用于 package.json 等依赖文件。'],
['docker compose run --rm migrate','CREATE TABLE','单独运行一次某个服务，适合迁移、管理命令。依赖的服务会被先启动。'],
['docker compose -p staging -f compose.yaml -f compose.prod.yaml up -d','✔ Network staging_default  Created','<code>-p</code> 指定项目名。同一套文件可以在一台机器上跑多份（容器名、网络、卷都带不同前缀）。']]);
Quiz(document.getElementById('qs'),[
['只写 depends_on: [db] 时，web 会等到什么时候？',['db 能接受连接','db 容器启动','db 健康检查通过'],1,'默认条件是 service_started。'],
['迁移任务完成后再启动应用，用哪个条件？',['service_healthy','service_started','service_completed_successfully'],2,'要求退出码为 0。'],
['生产环境运行 docker compose -f compose.yaml -f compose.prod.yaml up，compose.override.yaml 会被读取吗？',['会','不会','只读取其中的 ports'],1,'显式 -f 时只合并列出的文件。'],
['${DB_PASSWORD:?missing} 在变量未设置时会怎样？',['替换为空字符串','替换为 missing','报错并停止'],2,':? 用于必填变量。']]);
