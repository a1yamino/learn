const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=120)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const K=[['a','已过期','bad'],['b','未过期',''],['c','已过期','bad'],['d','未过期',''],['e','已过期','bad'],['f','未过期','']];
const e={ks:{w:420,h:120,cls:'frame',html:'<i>过期字典 expires</i>'},g:P('GET a','sig'),g2:P('检查 a 的过期时间 → 已过期 → 删除，返回 nil','ok'),cy:P('serverCron：扫描一批过期字典条目','sig'),cy2:P('删除已过期的 c、e；过期比例高就继续，时间到就停','ok')};K.forEach(([k,s])=>e[k]=B('键 '+k,s,'',120));
const KS=(m={})=>{const o={ks:[0,0]};K.forEach(([k,s,c],i)=>o[k]=[10+(i%3)*135,28+Math.floor(i/3)*46,m[k]?(typeof m[k]==='string'?{cls:'blk '+m[k]}:m[k]):{cls:'blk '+c}]);return o};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'过期字典',p:'设置了过期时间的键都登记在过期字典中。时间到了并不会触发任何删除动作。',set:KS()},
 {t:'惰性删除',p:'客户端访问 a 时，先检查过期时间：已过期，立即删除，对客户端表现为键不存在。',d:4000,set:{...KS({a:{cls:'blk mute',html:'键 a<br><span style="font-size:11px;opacity:.7">已删除</span>'}}),g:[440,10],g2:[0,140]}},
 {t:'定期删除',p:'后台的主动过期循环逐步扫描过期字典，删除那些已经过期、却没人访问的键。',d:4000,set:{...KS({a:'mute',c:{cls:'blk mute',html:'键 c<br><span style="font-size:11px;opacity:.7">已删除</span>'},e:{cls:'blk mute',html:'键 e<br><span style="font-size:11px;opacity:.7">已删除</span>'}}),cy:[440,10],cy2:[0,140]}}]});
const e2={t0:B('10:00:00','100 万个键 EX 3600','',160),t1:B('11:00:00','全部到期','bad',160),m:P('used_memory 不会立刻下降','sig'),cpu:P('主动清理集中在这几秒：CPU 上升，延迟变高','bad'),db:P('缓存同时失效 → 请求全部打到数据库','bad'),fx:P('EX 3600 + random(0, 300)：分散过期时间','ok')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'同时写入',p:'某个批任务在 10:00 写入 100 万个缓存，都设置 1 小时过期。',set:{t0:[0,0]}},
 {t:'同时到期',p:'11:00 它们全部过期，但在被访问或被后台扫到之前仍占着内存。',d:3800,set:{t0:[0,0],t1:[180,0],m:[0,70]}},
 {t:'清理与击穿',p:'后台循环发现大量过期键，持续工作直到达到时间上限；同时缓存集体失效，请求涌向数据库（缓存雪崩，第 18 课）。',d:4200,set:{t0:[0,0],t1:[180,0],cpu:[0,70],db:[0,110]}},
 {t:'加随机抖动',p:'在过期时间上加一个随机量，把过期分散到一段时间里。',d:3600,set:{t0:[0,0],fx:[0,70]}}]});
(()=>{const Q=[['SET session:1 newvalue','TTL session:1 → -1','bad','普通 SET 覆盖值并清除过期时间。'],
['SET session:1 newvalue KEEPTTL','TTL session:1 → 598','ok','保留原过期时间。'],
['SET session:1 newvalue EX 600','TTL session:1 → 600','ok','重新设置，相当于滑动续期。'],
['APPEND session:1 "x"','TTL session:1 → 598','ok','修改值但不是整体替换，TTL 保留。INCR、HSET、LPUSH 等同理。'],
['RENAME session:1 session:2','TTL session:2 → 598','ok','过期时间随键转移。'],
['PERSIST session:1','TTL session:1 → -1','sig','显式移除过期时间。'],
['EXPIRE session:1 60 GT','(integer) 0\nTTL session:1 → 598','sig','GT：只有新的过期时间比当前更晚才更新。60 < 598，不更新。'],
['DEL session:1 后 TTL','TTL session:1 → -2','sig','-2 表示键不存在，-1 表示存在但没有过期时间。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent='> SET session:1 v EX 600\n> '+Q[i][0]+'\n'+Q[i][1];m.className='msg '+Q[i][2];m.innerHTML=Q[i][3]});q.appendChild(b)});
 m.className='msg';m.innerHTML='每个选项都从 SET session:1 v EX 600 开始。'})();
Term(document.getElementById('t4'),[
['SET k v PX 1500 NX','OK','毫秒级过期、仅当不存在时设置。'],
['EXPIREAT k 1761190000','(integer) 1','设置绝对过期时间（Unix 秒）。'],
['INFO keyspace','db0:keys=1203344,expires=1180021,avg_ttl=1532211,subexpiry=12','每个库的键数、带过期时间的键数、平均 TTL（毫秒）；subexpiry 是带字段过期的 Hash 数。'],
['INFO stats | grep expire','expired_keys:88123401\nexpired_stale_perc:3.12\nexpired_time_cap_reached_count:12\nexpire_cycle_cpu_milliseconds:31022','expired_stale_perc：估计的“已过期未删除”比例；time_cap_reached 表示清理因时间上限中止。'],
['CONFIG SET active-expire-effort 3','OK','1–10，越大清理越积极，CPU 越高。默认 1。'],
['OBJECT FREQ k','(integer) 5','LFU 计数（需要 LFU 淘汰策略，第 8 课）。']]);
Quiz(document.getElementById('qs'),[
['键过期的那一刻 Redis 会立即删除它吗？',['会','不会，靠惰性删除和定期删除','只在副本上删除'],1,''],
['SET k v（不带参数）对原有 TTL 的影响？',['保留','清除','加倍'],1,''],
['TTL 返回 -1 表示？',['键不存在','键存在但没有过期时间','已过期'],1,''],
['副本上的过期键？',['副本自己删除','等主库发送 DEL；读取时返回空','永不删除'],1,''],
['大量缓存同时过期的风险？',['数据丢失','CPU 尖刺和数据库被击穿','复制中断'],1,'']]);
