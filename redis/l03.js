const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=120)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={c:B('应用','','',100),s:B('Redis','','',100),a1:P('GET k1 →','mute'),r1:P('← v1','mute'),a2:P('GET k2 →','mute'),r2:P('← v2','mute'),a3:P('GET k3 →','mute'),r3:P('← v3','mute'),t1:P('3 次往返 ≈ 0.9 ms','bad'),pp:P('GET k1 · GET k2 · GET k3 →','sig'),pr:P('← v1 · v2 · v3','ok'),t2:P('1 次往返 ≈ 0.3 ms','ok'),bk:P('服务器仍然逐条执行；只是不必等上一条的回复','mute')};
const L={c:[0,40],s:[460,40]};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'逐条执行',p:'发出一条命令，等回复，再发下一条。每条都付出一次网络往返。',set:{...L,a1:[150,0],r1:[250,30]}},
 {t:'累积',p:'N 条命令就是 N 次往返。服务器大部分时间在等下一条命令到来。',d:3800,set:{...L,a1:[150,0],r1:[250,30],a2:[150,60],r2:[250,90],a3:[150,120],r3:[250,150],t1:[0,190]}},
 {t:'Pipeline',p:'连续写出所有命令，再一次性读取所有回复。服务器读到就执行，回复按顺序排在输出缓冲区里。',d:4000,set:{...L,pp:[130,20],pr:[220,80],t2:[0,190]}},
 {t:'它不是什么',p:'Pipeline 不保证原子性，其他客户端的命令可能夹在中间；一条命令失败，其余照常执行。单个 Pipeline 不要太大（几百到几千条），否则回复会占用大量服务器内存。',d:4400,set:{...L,pp:[130,20],pr:[220,80],bk:[0,190]}}]});
const e2={};for(let i=0;i<4;i++)e2['t'+i]=B('请求 '+(i+1),'','',100);e2.pool={w:200,h:150,cls:'frame',html:'<i>连接池 max=2</i>'};e2.c1=B('连接 1','','',170);e2.c2=B('连接 2','','',170);e2.w=P('请求 3、4 等待空闲连接（设置等待超时）','sig');e2.sl=P('Redis 卡顿 2 秒、没有读超时 → 所有线程都卡在等回复','bad');e2.ok=P('读超时 200 ms：快速失败，降级到数据库或返回默认值','ok');
const T=(n,c)=>{const o={};for(let i=0;i<n;i++)o['t'+i]=[0,i*50,{cls:'blk '+(i<2?c:'mute')}];return o};const PL={pool:[150,0],c1:[165,30],c2:[165,90]};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'借用与归还',p:'请求从池中借一个已建立的连接，用完归还。省掉了 TCP 握手、TLS 和 AUTH。',set:{...T(2,'ok'),...PL}},
 {t:'池满排队',p:'阻塞式客户端每个并发请求占一个连接。并发超过池大小时，其余请求等待。',d:3800,set:{...T(4,'ok'),...PL,w:[0,210]}},
 {t:'没有超时',p:'Redis 因为一条慢命令卡住时，所有连接都在等待，应用的线程池也随之耗尽，故障从缓存蔓延到整个服务。',d:4200,set:{...T(4,'bad'),...PL,sl:[0,210]}},
 {t:'设置超时',p:'连接超时和读超时都要设，并决定超时后怎么办：缓存读失败通常可以直接查数据库。',d:3800,set:{...T(4,'ok'),...PL,ok:[0,210]}}]});
(()=>{const Q=[['循环 100 次 HGETALL','100 次往返 × 0.3 ms ≈ 30 ms','bad','往返主导耗时。'],
['MGET 100 个键（值为 JSON 字符串）','1 次往返 ≈ 0.35 ms','ok','批量命令最简单。注意：在 Cluster 中，MGET 的所有键必须在同一个槽，否则报 CROSSSLOT；客户端库通常提供按槽拆分的版本。'],
['Pipeline 100 条 HGETALL','1 次往返 ≈ 0.4 ms','ok','任意命令都可以放进 Pipeline。'],
['MULTI … 100 条 HGETALL … EXEC','1 次往返 ≈ 0.4 ms\n（多了 MULTI/EXEC 两条命令）','sig','也只有一次往返，但额外保证原子执行。只读场景不需要。'],
['Pipeline 10 万条 HGETALL','服务器把 10 万个回复堆在输出缓冲区：约 400 MB\n普通客户端默认没有输出缓冲区上限；若已配置上限，超限会被断开','bad','分批发送，每批几百到几千条。'],
['客户端缓存命中','本地内存读取 ≈ 0.001 ms，不经过网络','ok','开启 CLIENT TRACKING 的客户端（如 redis-py 5.1+ 的 cache_config、Lettuce）对热点键效果最好；键被修改时服务器推送失效通知。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent=Q[i][1];m.className='msg '+Q[i][2];m.innerHTML=Q[i][3]});q.appendChild(b)});
 m.className='msg';m.innerHTML='每个商品一个 Hash，约 1 KB。'})();
Term(document.getElementById('t4'),[
['HELLO 3','1# "server" => "redis"\n2# "version" => "8.10.2"\n3# "proto" => (integer) 3\n…','切换到 RESP3 协议。'],
['CLIENT SETNAME order-api','OK','给连接命名，在 CLIENT LIST 中容易识别。'],
['CLIENT LIST TYPE normal','id=31 addr=10.0.3.7:41220 name=order-api age=3600 idle=2 … tot-mem=22400 …','tot-mem 是该连接占用的内存（缓冲区）。'],
['CONFIG GET maxclients','1) "maxclients"\n2) "10000"','最大连接数。'],
['CONFIG GET timeout','1) "timeout"\n2) "0"','空闲连接多少秒后断开，0 表示不断开。'],
['CLIENT TRACKING on','OK','开启客户端缓存失效跟踪（通常由客户端库调用）。']]);
Quiz(document.getElementById('qs'),[
['Pipeline 主要节省了什么？',['服务器执行时间','网络往返','内存'],1,''],
['Pipeline 中一条命令失败，其他命令？',['全部回滚','照常执行','停止执行'],1,''],
['阻塞式客户端的连接池大小应该至少覆盖？',['CPU 核数','并发请求数','键的数量'],1,''],
['为什么必须设置读超时？',['提高吞吐','Redis 卡顿时避免应用线程全部被占住','节省内存'],1,''],
['一个 Pipeline 发送 10 万条命令的风险？',['回复堆积在服务器输出缓冲区','命令顺序被打乱','被当作事务'],0,'']]);
