const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,c='',w=70,h=36)=>({w,h,cls:'blk '+c,html:t});
const e={lp:{w:560,h:60,cls:'frame',html:'<i>listpack · 一块连续内存</i>'},hd:B('头','mute',50),f1:B('name','',60),v1:B('alice','',60),f2:B('city','',60),v2:B('taipei','',70),en:B('末尾','mute',50),n1:P('2 个字段 · 约 40 字节','ok'),big:P('写入一个 70 字节的值 → 超过 hash-max-listpack-value 64','bad'),ht:{w:560,h:120,cls:'frame',html:'<i>hashtable</i>'},b0:B('桶 0','',60),b1:B('桶 1','',60),b2:B('桶 2','',60),b3:B('桶 3','',60),d1:B('entry → name / alice','',190),d2:B('entry → city / taipei','',190),d3:B('entry → big / …','',190),n2:P('每个字段：entry + 两个 SDS + 指针 · 约 270 字节','sig'),n3:P('不会自动转回 listpack','mute')};
const LP={lp:[0,20],hd:[10,40],f1:[70,40],v1:[140,40],f2:[210,40],v2:[280,40],en:[360,40]};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'listpack',p:'两个字段时，Hash 是一块连续内存：字段和值交替紧凑存放，没有指针。查找要从头扫描，但元素少时比计算哈希还快。',set:{...LP,n1:[0,100]}},
 {t:'超过阈值',p:'写入一个超过 64 字节的值（或字段数超过 512）时，Redis 立即把整个对象转换为哈希表。',d:3800,set:{...LP,big:[0,100]}},
 {t:'hashtable',p:'每个字段变成一个独立分配的 entry，通过桶数组索引。查找 O(1)，但每个字段多出几十字节的指针和分配开销。',d:4200,set:{ht:[0,0],b0:[10,30],b1:[10,72],b2:[80,30],b3:[80,72],d1:[160,30],d2:[160,72],d3:[360,30],n2:[0,140]}},
 {t:'单向转换',p:'之后即使删掉大值，编码也不会变回 listpack。想恢复只能重建这个键。',d:3600,set:{ht:[0,0],b0:[10,30],b1:[10,72],b2:[80,30],b3:[80,72],d1:[160,30],d2:[160,72],n3:[0,140]}}]});
const e2={o1:B('redisObject','',120,40),i:B('int：12345 直接放在指针位置','ok',260,40),o2:B('redisObject','',120,40),es:B('SDS "hello"（紧挨着对象头）','ok',260,40),o3:B('redisObject','',120,40),rp:B('ptr →','mute',70,40),rs:B('SDS（单独分配，len / alloc / buf）','sig',290,40),n:P('embstr：一次分配，≤ 44 字节；修改后变为 raw','mute')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'int',p:'值是整数时，不需要额外的字符串内存，整数直接存储在对象的指针字段中。小整数 0–9999 还会共享预先创建的对象（未设置 maxmemory 淘汰策略时）。',set:{o1:[0,0],i:[130,0]}},
 {t:'embstr',p:'短字符串和对象头一次分配在连续内存中，减少一次分配，缓存友好。',d:3800,set:{o1:[0,0],i:[130,0],o2:[0,60],es:[130,60]}},
 {t:'raw',p:'超过 44 字节，SDS 单独分配。SDS 记录长度和已分配容量：取长度 O(1)、可以包含 \\0、APPEND 时按需预分配，减少重新分配次数。',d:4200,set:{o1:[0,0],i:[130,0],o2:[0,60],es:[130,60],o3:[0,120],rp:[130,120],rs:[210,120],n:[0,180]}}]});
(()=>{const Q=[['SET n 100','OBJECT ENCODING n → "int"\nMEMORY USAGE n → 56','ok','整数直接存储。MEMORY USAGE 包括键本身和字典条目的开销。'],
['SET s "user-profile-json-…"（30 字节）','OBJECT ENCODING s → "embstr"\nMEMORY USAGE s → 88','ok',''],
['APPEND s "x"','OBJECT ENCODING s → "raw"','sig','embstr 是只读的，任何修改都会转为 raw。'],
['HSET u name a age 3（2 个字段）','OBJECT ENCODING u → "listpack"\nMEMORY USAGE u → 40','ok',''],
['HSET 600 个字段（每个值 10 字节）','OBJECT ENCODING u → "hashtable"\nMEMORY USAGE u → 约 36 KB','sig','超过 hash-max-listpack-entries 512。内存数字仅示意，具体用 MEMORY USAGE 测量。'],
['SADD ids 1 2 3 … 500','OBJECT ENCODING ids → "intset"\nMEMORY USAGE ids → 约 1 KB（每个整数 2 字节）','ok','≤ 512 个整数（set-max-intset-entries）。'],
['SADD ids 1 … 600','OBJECT ENCODING ids → "hashtable"\nMEMORY USAGE ids → 约 30 KB','sig','超过 512 个整数，且超过 set-max-listpack-entries 128，直接变成 hashtable。'],
['ZADD z 1 a 2 b 3 c','OBJECT ENCODING z → "listpack"','ok','小 ZSet 是按分数有序的 listpack：成员和分数交替存放。超过阈值后变为 skiplist + dict（第 5 课）。'],
['RPUSH l a b c','OBJECT ENCODING l → "listpack"','ok','Redis 7.2+ 中短列表直接是一个 listpack，变长后转为 quicklist。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent='> '+Q[i][0]+'\n'+Q[i][1];m.className='msg '+Q[i][2];m.innerHTML=Q[i][3]});q.appendChild(b)});
 m.className='msg';m.innerHTML='默认阈值。MEMORY USAGE 的数字为示意，实际值随版本和分配器略有不同。'})();
Term(document.getElementById('t4'),[
['OBJECT ENCODING key','"listpack"','内部编码。'],
['MEMORY USAGE key SAMPLES 0','(integer) 1288','键和值占用的字节数；SAMPLES 0 表示统计全部元素（大集合较慢）。'],
['DEBUG OBJECT key','Value at:0x7f… refcount:1 encoding:listpack serializedlength:52 lru:… lru_seconds_idle:3','调试信息。生产环境通常禁用 DEBUG 命令。'],
['CONFIG SET hash-max-listpack-entries 1024','OK','调大阈值：更省内存，但大 listpack 的操作变慢。只对之后转换的对象生效。'],
['CONFIG GET list-max-listpack-size','1) "list-max-listpack-size"\n2) "-2"','-2 表示每个 quicklist 节点最多 8 KB；正数表示元素个数。'],
['MEMORY STATS','1) "peak.allocated"\n…\n"keys.count"\n…\n"dataset.percentage"','内存使用分解。']]);
Quiz(document.getElementById('qs'),[
['小 Hash 的默认编码？',['hashtable','listpack','ziplist'],1,'Redis 7 起 listpack 取代 ziplist。'],
['SET k "hello" 的编码？',['int','embstr','raw'],1,''],
['Hash 转为 hashtable 后删除字段，编码会？',['变回 listpack','保持 hashtable','变为 intset'],1,''],
['listpack 的主要优点？',['O(1) 查找','连续内存、没有指针开销','支持过期'],1,''],
['Redis 7.2+ 的 List 底层实现？',['跳表','短列表为 listpack，较长列表为 quicklist','哈希表'],1,'quicklist 是 listpack 节点的双向链表。']]);
