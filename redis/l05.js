const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,c='',w=60,h=34)=>({w,h,cls:'blk '+c,html:t});
const e={o:{w:300,h:70,cls:'frame',html:'<i>ht[0] · 4 个桶（负载因子 1）</i>'},n:{w:560,h:70,cls:'frame',html:'<i>ht[1] · 8 个桶</i>'},ri:P('rehashidx = 0','sig'),op:P('每次 GET/SET/DEL 顺带迁移一个桶','mute'),dn:P('全部迁移完：ht[1] 变为 ht[0]','ok'),lk:P('期间查找：先查 ht[0]，再查 ht[1]；新写入只进 ht[1]','sig')};
for(let i=0;i<4;i++)e['a'+i]=B('桶'+i,'',60);for(let i=0;i<8;i++)e['b'+i]=B('桶'+i,'mute',60);
const OLD=(m)=>{const r={o:[0,0]};for(let i=0;i<4;i++)r['a'+i]=[10+i*70,28,{cls:'blk '+(i<m?'mute':'')}];return r};const NEW=(m)=>{const r={n:[0,100]};for(let i=0;i<8;i++)r['b'+i]=[10+i*68,128,{cls:'blk '+(m.includes(i)?'ok':'mute')}];return r};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'需要扩容',p:'元素数达到桶数，负载因子为 1。分配一个两倍大的新表，但不立即迁移。',set:{...OLD(0),...NEW([]),ri:[340,10]}},
 {t:'分摊迁移',p:'之后每次操作这个字典，就把 rehashidx 指向的桶里的所有元素搬到新表，然后 rehashidx 加一。',d:4000,set:{...OLD(1),...NEW([0,4]),ri:[340,10,P('rehashidx = 1')],op:[0,190]}},
 {t:'两张表并存',p:'迁移进行中，查找要依次查两张表；新元素只写入新表，旧表只会越来越空。',d:4000,set:{...OLD(3),...NEW([0,4,1,5,2,6]),ri:[340,10,P('rehashidx = 3')],lk:[0,190]}},
 {t:'完成',p:'旧表清空后释放，新表成为主表。每一步只做少量工作，没有一次长时间的停顿。',d:3600,set:{...NEW([0,1,2,3,4,5,6,7]),dn:[0,190]}}]});
const V=[10,20,35,50,70,85];const e2={tg:P('查找 70','sig'),r:P('高层跳过大段，逐层下降：约 log N 步','ok')};
V.forEach((v,i)=>{e2['l0_'+i]=B(String(v),'',50,30)});[[1,3,4],[3]].forEach((ids,lv)=>ids.forEach(i=>e2[`l${lv+1}_${i}`]=B(String(V[i]),'',50,30)));e2.h0=B('头','mute',50,30);e2.h1=B('头','mute',50,30);e2.h2=B('头','mute',50,30);
const SK=(hl=[])=>{const o={h2:[0,0],h1:[0,44],h0:[0,88]};V.forEach((v,i)=>{o['l0_'+i]=[70+i*80,88,{cls:'blk '+(hl.includes('l0_'+i)?'ok':'')}]});[[1,3,4],[3]].forEach((ids,lv)=>ids.forEach(i=>{const k=`l${lv+1}_${i}`;o[k]=[70+i*80,88-(lv+1)*44,{cls:'blk '+(hl.includes(k)?'ok':'')}]}));return o};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'多层链表',p:'最底层包含所有节点并按分数有序。每个节点随机获得若干层，高层节点稀疏。',set:{...SK(),tg:[0,140]}},
 {t:'从最高层出发',p:'在第 2 层：50 < 70，前进到 50；下一个是空，下降。',d:3800,set:{...SK(['l2_3']),tg:[0,140]}},
 {t:'逐层下降',p:'第 1 层：50 的下一个是 70，找到。底层链表中按顺序取后续元素，就是范围查询。',d:3800,set:{...SK(['l2_3','l1_3','l1_4']),tg:[0,140],r:[160,140]}}]});
(()=>{const Q=[['ZSCORE rank u42','O(1) · 0.002 ms','ok','走字典，不经过跳表。'],
['ZADD rank 500 u42','O(log N) · 0.005 ms','ok','字典更新分数，跳表删除旧节点再插入新位置。'],
['ZREVRANK rank u42','O(log N) · 0.004 ms','ok','跳表每层记录跨度，查找路径上累加跨度就是名次。'],
['ZRANGE rank 0 9 REV WITHSCORES','O(log N + 10) · 0.006 ms','ok','定位起点后顺序取 10 个。'],
['ZRANGE rank 500000 500049 REV','O(log N + 50) · 0.01 ms','ok','深分页同样快：按跨度定位第 50 万名。'],
['ZCOUNT rank 100 200','O(log N) · 0.004 ms','ok','两次定位，用名次相减，不遍历区间内的元素。'],
['ZRANGE rank 0 -1','O(N) · 约 120 ms，回复约 25 MB','bad','取全部 100 万个，阻塞服务器。'],
['ZREMRANGEBYSCORE rank -inf 1000','O(log N + M)，M = 删除的数量','sig','删除 10 万个时会阻塞几十毫秒，大批量删除要分批。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent='> '+Q[i][0]+'\n'+Q[i][1];m.className='msg '+Q[i][2];m.innerHTML=Q[i][3]});q.appendChild(b)});
 m.className='msg';m.innerHTML='rank：100 万成员，编码 skiplist。耗时为服务器端执行时间的示意值。'})();
Term(document.getElementById('t4'),[
['DEBUG HTSTATS 0','[Dictionary HT]\n Hash table 0 stats (main hash table):\n table size: 1048576\n number of elements: 1000000','键空间哈希表的桶数和元素数（rehash 中会显示两张表）。'],
['DEBUG HTSTATS-KEY myhash','…','某个 hashtable 编码的键内部的表状态。'],
['SCAN 0 MATCH user:* COUNT 1000 TYPE hash','1) "17920"\n2) 1) "user:42"\n   …','按模式和类型过滤；过滤发生在取出之后，所以可能返回空数组但游标不为 0。'],
['HSCAN myhash 0 COUNT 100','1) "128"\n2) …','遍历大 Hash。listpack 编码的小 Hash 会一次全部返回。'],
['ZRANGE rank 0 9 REV WITHSCORES','…','前 10 名。Redis 6.2 起 ZRANGE 统一支持 BYSCORE / BYLEX / REV / LIMIT。'],
['ZRANDMEMBER rank 3 WITHSCORES','…','随机取成员。']]);
Quiz(document.getElementById('qs'),[
['为什么 Redis 用渐进式 rehash？',['节省内存','避免一次迁移全部元素阻塞主线程','提高哈希质量'],1,''],
['rehash 期间新元素写入哪张表？',['旧表','新表','两张都写'],1,''],
['SCAN 的保证是？',['不重复','遍历全程都存在的元素至少返回一次','每次返回 COUNT 个'],1,''],
['ZSCORE 的复杂度？',['O(1)','O(log N)','O(N)'],0,'走字典。'],
['ZRANK 能做到 O(log N) 是因为？',['跳表每层记录跨度','缓存了排名','字典有序'],0,'']]);
