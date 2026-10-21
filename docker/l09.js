const B=(t,c,w=420,h=44)=>({w,h,cls:'blk '+c,html:'<span style="padding:0 14px;width:100%;text-align:left">'+t+'</span>'});
const S=[['df','Dockerfile · ENV MODE=default','dim'],['ef','env_file: app.env · MODE=staging',''],['en','environment: MODE=dev',''],['cl','docker compose run -e MODE=prod','']];
const els={};S.forEach(([k,t,c])=>els[k]=B(t,c));els.res={w:300,cls:'tag'};els.ar={w:300,cls:'tag'};
const pos=n=>{const o={};S.slice(0,n).forEach(([k],i)=>o[k]=[0,150-i*50]);return o};
const win=(n,v)=>({...pos(n),[S[n-1][0]]:[0,150-(n-1)*50,{cls:'blk sig'}],res:[460,150-(n-1)*50+12,{html:'容器里 <b>MODE='+v+'</b>'}]});
Player(document.getElementById('p1'),{els,scenes:[
 {t:'Dockerfile 的 ENV',p:'镜像里的默认值，优先级最低。适合放不随环境变化的设置。',set:win(1,'default')},
 {t:'env_file',p:'从文件读取一组变量，覆盖镜像默认值。适合把一个环境的配置放在一起。',set:win(2,'staging')},
 {t:'environment',p:'compose.yaml 里直接写的变量，覆盖 env_file。',set:win(3,'dev')},
 {t:'命令行 -e',p:'<code>docker compose run -e</code> 或 <code>docker run -e</code>，优先级最高，用于临时覆盖。',set:win(4,'prod')}]});
const L=(t,c,w=380)=>({w,h:40,cls:'blk '+c,html:'<span style="padding:0 12px;width:100%;text-align:left;font-size:12px">'+t+'</span>'});
Player(document.getElementById('p2'),{els:{
 a1:L('ENV DB_PASSWORD=s3cr3t','sig'),a2:L('ARG NPM_TOKEN → RUN npm install','sig'),a3:L('COPY .env .','sig'),a4:L('RUN rm .env','dim'),base:L('FROM node:20-slim','dim'),
 n1:{w:380,cls:'tag'},n2:{w:380,cls:'tag'},n3:{w:380,cls:'tag'},ok:L('运行时：secrets → /run/secrets/db_password','hatch'),okb:L('构建时：RUN --mount=type=secret,id=npm','hatch')},
 scenes:[
 {t:'ENV 写死密钥',p:'ENV 是镜像配置的一部分。任何能拉取镜像的人用 <code>docker inspect</code> 就能看到。',set:{base:[0,150],a1:[0,100],n1:[420,110,{html:'<b>docker inspect</b> 直接可见'}]}},
 {t:'ARG 传入 token',p:'构建参数的值会记录在使用它的那一层的元数据里，<code>docker history</code> 可以看到。',set:{base:[0,150],a1:[0,100],a2:[0,50],n1:[420,110,{html:'<b>docker inspect</b> 直接可见'}],n2:[420,60,{html:'<b>docker history</b> 可见'}]}},
 {t:'复制后再删除',p:'第 5 课讲过：后面的层删除文件，前面的层仍然完整保存。导出镜像就能拿到 .env。',d:3600,set:{base:[0,150],a1:[0,100],a2:[0,50],a3:[0,0],a4:[0,-50],n1:[420,110,{html:'<b>docker inspect</b> 直接可见'}],n2:[420,60,{html:'<b>docker history</b> 可见'}],n3:[420,10,{html:'<b>docker save</b> 解包可见'}]}},
 {t:'正确做法',p:'镜像里不放任何密钥。运行时用 secrets 挂载成文件；构建时用 BuildKit secret 挂载，只在那一条 RUN 期间存在。',d:3800,set:{base:[0,150],ok:[0,100],okb:[0,50],n1:[420,110,{html:'不在镜像配置里'}],n2:[420,60,{html:'不在任何层里'}]}}]});
(()=>{const cm=document.getElementById('cm'),lg=document.getElementById('lg'),fd=document.getElementById('fd');const found=new Set();
 const C=[['docker inspect -f "{{json .Config.Env}}" shop-api:1.3','["PATH=/usr/local/sbin:…","NODE_ENV=production","STRIPE_KEY=sk_live_51Hx…"]','env','ENV 里的 STRIPE_KEY'],
  ['docker history --no-trunc shop-api:1.3 | grep ARG','RUN |1 NPM_TOKEN=npm_9fQ2… /bin/sh -c npm ci   41.2MB','arg','构建参数 NPM_TOKEN'],
  ['docker run --rm shop-api:1.3 ls -a /app','.  ..  dist  node_modules  package.json',null,null],
  ['docker save shop-api:1.3 | tar -x && grep -r "DB_PASSWORD" blobs/','blobs/sha256/7ac1…: app/.env: DB_PASSWORD=pa55w0rd!','file','被“删除”的 .env'],
  ['docker run --rm shop-api:1.3 env | grep -i pass','',null,null]];
 C.forEach(([c,o,k,label])=>{const b=document.createElement('button');b.className='btn';b.textContent=c.split(' ').slice(0,2).join(' ')+(c.includes('ls -a')?' ls':c.includes('env |')?' env':'');b.title=c;b.addEventListener('click',()=>{
  lg.innerHTML=`<b>$ ${c.replace(/</g,'&lt;')}</b>\n${o?(k?'<span class="e">'+o+'</span>':o):'<span style="opacity:.6">（没有输出）</span>'}\n${k?'\n找到：'+label:c.includes('ls -a')?'\n/app 里看不到 .env，因为最后一层删除了它。但这不代表它不在镜像里。':'\n运行时环境变量里没有密码。'}`;
  if(k){found.add(k);b.classList.add('pri')}fd.className='msg'+(found.size===3?' ok':'');fd.textContent=found.size===3?'3 处全部找到。镜像里的任何内容都能被读出来，这三个密钥都要立即轮换。':`已找到 ${found.size} / 3 处泄露。`});cm.appendChild(b)});
 lg.innerHTML='<span style="opacity:.6">从左到右依次试试。</span>';fd.textContent='已找到 0 / 3 处泄露。'})();
Term(document.getElementById('t4'),[
['docker compose config','name: cfg-demo\nservices:\n  app:\n    image: alpine:3.20\n    environment:\n      LEVEL: from-env-file\n      MODE: dev\n    secrets:\n      - source: db_password\n        target: db_password','输出最终生效的配置：<code>${TAG}</code> 已被 <code>.env</code> 替换，env_file 已合并进 environment。排查配置问题时先看这里。'],
['docker run --rm -e MODE --env-file prod.env alpine env','MODE=dev\nLEVEL=prod\nDB_HOST=db.internal\n…','<code>-e MODE</code> 不写值时，从当前 shell 取值。<code>--env-file</code> 每行一个 <code>KEY=VALUE</code>，不支持 shell 语法和引号展开。'],
['docker compose --env-file .env.prod config | grep image','    image: alpine:3.19','用另一个文件做 <code>${}</code> 替换。配合多个 compose 文件（<code>-f compose.yaml -f compose.prod.yaml</code>）区分环境，第 18 课详细讲。'],
['docker compose exec app cat /run/secrets/db_password','s3cr3t','secret 是一个只读文件。很多官方镜像支持 <code>_FILE</code> 后缀的变量，例如 <code>POSTGRES_PASSWORD_FILE=/run/secrets/db_password</code>，直接从文件读取。']]);
Quiz(document.getElementById('qs'),[
['Dockerfile 里写了 ENV API_KEY=xxx，谁能看到它？',['只有 root','任何能拉取这个镜像的人','没人，它被加密了'],1,'docker inspect 直接显示。'],
['先 COPY .env，下一行 RUN rm .env。镜像里还有 .env 吗？',['没有','有，在前一层里','只在构建缓存里'],1,'层只增不减。'],
['项目目录下的 .env 文件，默认用来做什么？',['自动注入每个容器','替换 compose.yaml 里的 ${变量}','存放 secrets'],1,'要进入容器，用 env_file 或 environment。'],
['environment 和 env_file 都设置了 MODE，容器里是哪个？',['env_file','environment','两个都有'],1,'environment 优先。']]);
