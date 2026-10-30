const S=(t,s,c='',w=140)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
Player(document.getElementById('p1'),{els:{u:{cls:'pill mute',html:'用户 :443'},fe:{w:300,h:250,cls:'frame',html:'<i>frontend 网络</i>'},be:{w:300,h:250,cls:'frame',html:'<i>backend 网络（internal）</i>'},web:S('web','nginx · TLS · 静态'),api:S('api','多阶段 · 非 root'),db:S('db','postgres'),rd:S('redis','缓存'),mg:S('migrate','一次性'),vol:{cls:'pill sig',html:'卷 pgdata → 每日备份'},n:{w:700,cls:'tag'}},scenes:[
 {t:'入口只有一个',p:'只有 web 发布端口（443）。它负责 TLS、静态文件，并把 /api 转发给 api。',set:{u:[0,-40],fe:[0,0],web:[20,60]}},
 {t:'两个网络',p:'api 同时在 frontend 和 backend。db、redis 只在 backend，且 backend 设为 <code>internal: true</code>，连外网都出不去。web 无法直接访问数据库。',d:4000,set:{u:[0,-40],fe:[0,0],be:[380,0],web:[20,60],api:[220,140],db:[400,60],rd:[560,60]}},
 {t:'启动顺序',p:'db、redis 健康后，migrate 运行并成功退出，api 才启动；api 健康后 web 才启动（第 18 课）。',d:3800,set:{u:[0,-40],fe:[0,0],be:[380,0],web:[20,60],api:[220,140],db:[400,60,{cls:'blk sig'}],rd:[560,60,{cls:'blk sig'}],mg:[480,170]}},
 {t:'数据',p:'只有 db 有状态，数据在命名卷 pgdata。其他服务都可以随时销毁重建。备份对象只有这一个卷。',d:3600,set:{u:[0,-40],fe:[0,0],be:[380,0],web:[20,60],api:[220,140],db:[400,60],rd:[560,60],vol:[400,130],n:[0,280,{html:'无状态：web、api、redis（缓存可重建）　有状态：db'}]}}]});
const St=[['p','push'],['c','CI'],['r','仓库'],['s','服务器']];const e2={n:{w:700,cls:'tag'},d1:{cls:'pill sig',html:'sha256:4b1e…（新）'},d0:{cls:'pill mute',html:'sha256:91ac…（上一版）'},bad:{cls:'pill bad',html:'unhealthy'}};St.forEach(([k,t],i)=>e2[k]=S(t,['git push main','测试 · 扫描 · 签名','ghcr.io','compose up --wait'][i]));
const G2={};St.forEach(([k],i)=>G2[k]=[i*180,0]);
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'推送',p:'合并到 main。CI 构建一次，跑测试和扫描，推送并签名，输出 digest。',set:{...G2,p:[0,0,{cls:'blk sig'}],c:[180,0,{cls:'blk sig'}]}},
 {t:'部署',p:'服务器拿到 digest，<code>up -d --wait</code>：拉取、替换容器、等待健康检查。记下部署的 digest。',d:3600,set:{...G2,r:[360,0,{cls:'blk sig'}],s:[540,0,{cls:'blk sig'}],d1:[540,80],d0:[540,120]}},
 {t:'新版本有问题',p:'健康检查失败，<code>--wait</code> 返回非 0。或者上线后错误率升高。',set:{...G2,s:[540,0],d1:[540,80],bad:[540,-40],d0:[540,120]}},
 {t:'回滚',p:'用上一个 digest 再部署一次。digest 只固定镜像内容，不还原数据库、卷或运行时配置。仅在迁移与旧应用兼容、配置也恢复正确时，才能用它恢复旧版服务。然后按第 22 课的顺序找原因。',d:3800,set:{...G2,s:[540,0,{cls:'blk sig'}],d0:[540,80,{cls:'pill sig',html:'sha256:91ac…（回滚）'}],n:[0,170,{html:'回滚 = 部署上一个兼容当前数据库的 digest'}]}}]});
(()=>{const L=[['services:'],['  web:'],['    image: shop-web:latest','部署用了 latest：无法确定版本，也无法可靠回滚。用 digest。'],['    ports: ["443:443"]'],['  api:'],['    image: ghcr.io/acme/shop-api@sha256:4b1e…'],['    environment:'],['      DB_PASSWORD: Sup3rS3cret!','密码明文写在 Compose 文件里，会进入 git。用 .env（不提交）或 secrets（第 9 课）。'],['    ports: ["3000:3000"]','api 直接发布端口，绕过了 web 反向代理。删除，只在内部网络访问。'],['    deploy: { resources: { limits: { memory: 512M } } }'],['  db:'],['    image: postgres:16'],['    ports: ["5432:5432"]','数据库端口暴露到宿主机所有网卡，可能被公网访问。删除。'],['    healthcheck: { test: ["CMD-SHELL", "pg_isready"] }'],['    volumes: ["./data:/var/lib/postgresql/data"]'],['  worker:'],['    image: ghcr.io/acme/shop-worker@sha256:77d0…'],['    privileged: true','privileged 几乎等于宿主机 root（第 19 课）。worker 不需要，删除并 cap_drop: [ALL]。'],['    depends_on: [db]','只等 db 容器启动，不等就绪。用 condition: service_healthy（第 18 课）。'],['    logging: { driver: json-file }','json-file 没有 max-size，会写满磁盘（第 21 课）。加 options: { max-size: "10m" } 或用 local。']];
 const total=L.filter(x=>x[1]).length,found=new Set();const cf=document.getElementById('cf'),rv=document.getElementById('rv');rv.setAttribute('role','status');
 L.forEach(([t,why],i)=>{const d=document.createElement('button');d.type='button';d.className='code-line';d.setAttribute('aria-pressed','false');d.textContent=t;d.style.padding='2px 6px';d.style.borderRadius='4px';d.style.transition='background-color 200ms ease';d.addEventListener('click',()=>{
  if(why){found.add(i);d.setAttribute('aria-pressed','true');d.style.background='color-mix(in srgb,var(--bad) 22%,transparent)';rv.className='msg '+(found.size===total?'ok':'');rv.innerHTML=`${found.size}/${total}　${why}`+(found.size===total?'<br>全部找到。这 7 处都是上线后真实出现过的事故原因。':'')}
  else{rv.className='msg';rv.innerHTML=`${found.size}/${total}　这一行没问题。`+(t.includes('./data')?' bind mount 到 ./data 在单机上可以用，命名卷更易于备份和迁移，但不算错误。':'')}});cf.appendChild(d)});rv.className='msg';rv.innerHTML=`0/${total}　点击有问题的行。`})();
Term(document.getElementById('t4'),[
['./deploy.sh 4b1e… 77d0…','pull api@sha256:4b1e…\n✔ Container shop-api-1  Healthy\n✔ Container shop-web-1  Healthy\n2026-10-21T19:20 api=4b1e… web=77d0… >> deploys.log','把部署封装成脚本：传 digest，<code>up -d --wait</code>，成功后记录到 deploys.log，供回滚使用。'],
['docker compose ps --format "table {{.Service}}\\t{{.Status}}"','SERVICE  STATUS\napi      Up 2 hours (healthy)\ndb       Up 9 days (healthy)\nredis    Up 9 days (healthy)\nweb      Up 2 hours (healthy)','日常巡检。'],
['docker compose logs --since 30m api | grep -c " 5[0-9][0-9] "','3','最近 30 分钟的 5xx 数量。真实环境接入日志收集和告警。'],
['docker compose exec -T db pg_dump -U postgres shop | gzip > /backup/shop-$(date +%F).sql.gz','','每日备份（cron）。复制到另一台机器或对象存储；同一块磁盘上的备份不能防磁盘故障。'],
['tail -2 deploys.log','2026-10-20T15:02 api=91ac… web=77d0…\n2026-10-21T19:20 api=4b1e… web=77d0…','回滚：<code>./deploy.sh 91ac… 77d0…</code>。'],
['docker system df && docker image prune -af --filter until=168h','Total reclaimed space: 1.8GB','定期清理一周以上未使用的镜像，保留最近几个版本用于快速回滚。']]);
Quiz(document.getElementById('qs'),[
['这个架构里，哪个服务需要备份？',['web','api','db','redis'],2,'只有 db 有持久状态。'],
['为什么 backend 网络设为 internal？',['更快','数据库和缓存无法访问外网，也不能被外部直接访问','节省 IP'],1,'缩小攻击面。'],
['新版本健康检查失败，最快的恢复方式？',['在服务器上修改代码','部署上一个兼容当前数据库的 digest','重启服务器'],1,'先恢复服务，再排查原因。'],
['怎么确认备份有效？',['文件大小大于 0','定期在别处恢复并检查数据','备份脚本没有报错'],1,'没恢复过的备份不算备份。']]);
