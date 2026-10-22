const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=170)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={s:B('String','user:1 → JSON 整体'),h:B('Hash','user:1 → name / city / visits'),l:B('List','user:1:recent → p4 p3 p2'),st:B('Set','follow:alice → {bob, carol}'),z:B('Sorted Set','board → alice:120, carol:150'),n1:P('改一个字段要读出、修改、写回整个值','bad'),n2:P('HINCRBY 单独修改一个字段','ok'),n3:P('两端 O(1)，适合队列和“最近 N 条”','ok'),n4:P('去重、成员判断 O(1)、交并差','ok'),n5:P('按分数有序：排名、范围查询 O(log N)','ok')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'String',p:'整个对象序列化成一个字符串。读写都是整体，适合不常改动的缓存对象。',set:{s:[0,0,{cls:'blk sig'}],n1:[190,8]}},
 {t:'Hash',p:'对象的每个属性是一个字段。只读某几个字段、只自增访问次数都不需要动整个对象。',d:3800,set:{s:[0,0],h:[0,54,{cls:'blk sig'}],n2:[190,62]}},
 {t:'List 与 Set',p:'浏览记录有顺序、可以重复，用 List；关注关系不能重复、要判断“是否关注”，用 Set。',d:3800,set:{s:[0,0],h:[0,54],l:[0,108,{cls:'blk sig'}],st:[0,162,{cls:'blk sig'}],n3:[190,116],n4:[190,170]}},
 {t:'Sorted Set',p:'每个成员有一个分数，按分数排序。排行榜、按时间排序的索引、延迟队列都用它。',d:3800,set:{s:[0,0],h:[0,54],l:[0,108],st:[0,162],z:[0,216,{cls:'blk sig'}],n5:[190,224]}}]});
const U=[['carol',150],['bob',135],['alice',120],['dave',90]];const e2={c:P('ZINCRBY board 40 bob','sig'),r:P('ZREVRANK board alice → 2（从 0 开始）','ok'),q:P('ZRANGE board 0 2 REV → 前三名','ok')};U.forEach(([n,s])=>e2[n]=B(n,'分数 '+s,'',160));
const pos=(o,hl)=>{const r={};o.forEach((n,i)=>r[n]=[0,i*52,hl&&hl.includes(n)?{cls:'blk ok'}:{cls:'blk'}]);return r};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'按分数排列',p:'成员按分数从高到低（REV）排列。内部同时维护一个跳表（按分数排序）和一个字典（成员 → 分数），见第 5 课。',set:{...pos(['carol','alice','bob','dave'].map(x=>x)),bob:[0,104,B('bob','分数 95')]}},
 {t:'加分',p:'bob 得了 40 分。ZINCRBY 是原子的，并发加分不会丢失。成员自动移动到新位置，O(log N)。',d:4000,set:{...pos(['carol','bob','alice','dave'],['bob']),c:[200,0]}},
 {t:'查询',p:'取前三名、查某人的排名，都不需要扫描整个集合。',d:3800,set:{...pos(['carol','bob','alice','dave'],['carol','bob','alice']),q:[200,0],r:[200,40]}}]});
(()=>{const Q=[['每篇文章的阅读数','INCR post:1001:views','ok','String 计数器，INCR 原子自增。数量极多的文章可以合并到一个 Hash：HINCRBY post:views 1001 1，减少键的数量和内存。'],
['用户资料（经常只改其中一个字段）','HSET user:42 name … avatar … level 3\nHINCRBY user:42 level 1\nHMGET user:42 name avatar','ok','Hash 可以单独读写字段。'],
['任务队列（多个消费者）','LPUSH jobs "{…}"\nBRPOP jobs 5','sig','List + 阻塞弹出是最简单的队列。缺点：消费者取走后崩溃，任务就丢了。需要确认机制时用 Stream（第 11 课）。'],
['今天访问过的用户（去重计数）','SADD visit:2026-10-22 42\nSCARD visit:2026-10-22','sig','Set 精确去重。千万级用户时一个 Set 要几百 MB，可以改用 HyperLogLog（12 KB，约 0.81% 误差，第 12 课）或位图。'],
['游戏积分排行榜','ZINCRBY rank:season5 30 player:42\nZRANGE rank:season5 0 99 REV WITHSCORES\nZREVRANK rank:season5 player:42','ok','Sorted Set 的典型用途。'],
['订单 30 分钟未支付自动取消','ZADD order:timeout 1761102000 order:9001   # 分数 = 到期时间戳\nZRANGE order:timeout -inf 1761101800 BYSCORE LIMIT 0 100','ok','用 ZSet 做延迟队列：定时取出分数小于当前时间的成员处理。处理时用 ZREM 的返回值判断是否被别的实例抢先。'],
['商品详情页整页缓存','SET page:product:1001 "<html>…" EX 300','ok','整体读写、带过期时间，String 最合适。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent=Q[i][1];m.className='msg '+Q[i][2];m.innerHTML=Q[i][3]});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择需求查看。'})();
Term(document.getElementById('t4'),[
['SET k v EX 60 NX','OK','不存在时才设置，60 秒后过期。NX/XX、EX/PX/EXAT、GET、KEEPTTL 可组合。'],
['MGET k1 k2 k3','1) "a"\n2) (nil)\n3) "c"','一次读取多个键，减少往返。'],
['LPOS queue "job-7"','(integer) 12','列表中元素的位置，O(N)。'],
['HEXPIRE session:42 600 FIELDS 1 csrf','1) (integer) 1','Redis 7.4+：只让 Hash 的某个字段过期。Valkey 9.0 也支持字段过期。'],
['ZRANGE board (100 200 BYSCORE','1) "alice"\n2) "bob"','分数在 (100, 200] 之间的成员。'],
['OBJECT ENCODING board','"listpack"','底层编码，小集合用紧凑编码（第 4 课）。']]);
Quiz(document.getElementById('qs'),[
['需要判断“用户是否已点赞”并去重，用？',['List','Set','String'],1,''],
['排行榜用？',['Hash','Sorted Set','List'],1,''],
['HGETALL 的复杂度是？',['O(1)','O(N)','O(log N)'],1,''],
['对一个 ZSet 执行 GET 会？',['返回 nil','返回 WRONGTYPE 错误','返回第一个成员'],1,''],
['遍历一个百万元素的 Hash 应该用？',['HGETALL','HSCAN','KEYS'],1,'']]);
