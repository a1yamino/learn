const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=120)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const bits=(s,hi)=>({w:520,h:44,cls:'frame',html:'<span style="font-family:monospace;letter-spacing:4px">'+[...s].map((c,i)=>hi&&hi.includes(i)?`<b style="color:var(--ac)">${c}</b>`:c).join('')+'</span>'});
const e={d1:bits('00000000000000000000'),d2:bits('00000000000000000000'),l1:P('10-21'),l2:P('10-22'),r:bits('00000000000000000000'),lr:P('AND'),m:P('','sig')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'SETBIT',p:'用户 3、7、12 在 10-21 活跃：把对应位置设为 1。',set:{l1:[0,10],d1:[80,0,bits('00010001000010000000',[3,7,12])]}},
 {t:'第二天',p:'10-22 活跃的是用户 7、12、15。',d:3400,set:{l1:[0,10],d1:[80,0,bits('00010001000010000000')],l2:[0,64],d2:[80,54,bits('00000001000010010000',[7,12,15])]}},
 {t:'BITOP AND',p:'按位与得到两天都活跃的用户，BITCOUNT 结果为 2。',d:4000,set:{l1:[0,10],d1:[80,0,bits('00010001000010000000')],l2:[0,64],d2:[80,54,bits('00000001000010010000')],lr:[0,118],r:[80,108,bits('00000001000010000000',[7,12])]}},
 {t:'内存',p:'1 亿个用户一天只要 1 亿位 ≈ 12 MB；但只要设置了最大偏移量，前面的空间就全部分配。',d:3600,set:{m:[0,0,P('1 亿位 = 12.5 MB；同样的集合：每个成员几十字节 → 数 GB','ok')]}}]});
(()=>{const Q=[['1 万个访客',['集合：约 0.6 MB，精确','位图（ID 最大 1 亿）：12 MB，精确','HLL：约 10 KB 以内（稀疏），误差 ~0.81%'],'规模小时集合最简单，位图反而浪费。'],
['100 万个访客',['集合：约 60 MB，精确','位图（ID 最大 1 亿）：12 MB，精确','HLL：12 KB，误差 ~0.81%'],'位图在 ID 密集时很省。'],
['1 亿个访客',['集合：约 6 GB，精确','位图：12 MB，精确','HLL：12 KB，误差 ~0.81%'],'只要数量时 HLL 优势巨大。'],
['访客是设备 ID 字符串',['集合：可用，内存大','位图：不能直接用，需先把字符串映射成连续整数','HLL：可用，12 KB'],'位图要求整数偏移量。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent=Q[i][1].join('\n');m.className='msg ok';m.innerHTML=Q[i][2]});q.appendChild(b)});
 m.className='msg';m.innerHTML='数字是数量级估算，实际值取决于成员长度和编码。'})();
const e2={g:{w:240,h:150,cls:'frame',html:'<i>经纬度网格</i>'},c:B('wx4g0','geohash 前缀','sig',120),z:B('ZSET 分数','52 位整数','',140),s:P('GEOSEARCH：计算覆盖半径的相邻格子 → 按分数区间 ZRANGE → 精确计算距离过滤','ok')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'编码',p:'经度和纬度交替二分，每次二分得到一位，交错成 52 位整数。相近的点通常有相同的前缀。',set:{g:[0,0],c:[60,50]}},
 {t:'存储',p:'这个整数作为有序集合的分数，成员是门店名。',d:3400,set:{g:[0,0],c:[60,50],z:[280,50]}},
 {t:'查询',p:'查附近时找出中心格子和周围 8 个格子（分数区间），取出候选后计算真实距离并排序。',d:4400,set:{g:[0,0],c:[60,50],z:[280,50],s:[0,170]}}]});
Term(document.getElementById('t4'),[
['BITPOS active:20261021 1','(integer) 3','第一个为 1 的位：最小的活跃用户 ID。'],
['BITFIELD cnt INCRBY u8 0 1 OVERFLOW SAT INCRBY u8 8 1','1) (integer) 1\n2) (integer) 1','把字符串当成多个 8 位计数器，溢出时饱和。'],
['PFADD uv x\nMEMORY USAGE uv','(integer) 1\n(integer) 104','小基数时是稀疏编码。'],
['GEODIST shops taipei101 station km','"5.0857"','两点距离。'],
['GEOSEARCH shops FROMMEMBER daan BYBOX 4 4 km ASC','1) "daan"\n2) "taipei101"','以成员为中心、按矩形查询。']]);
Quiz(document.getElementById('qs'),[
['位图的底层类型？',['专用类型','字符串','列表'],1,''],
['HyperLogLog 能告诉你什么？',['某元素是否存在','大约有多少个不同元素','元素列表'],1,''],
['HLL 的最大内存？',['12 KB','1 MB','与元素数成正比'],0,''],
['GEOADD 数据的 TYPE 是？',['geo','zset','hash'],1,''],
['ID 稀疏（最大 40 亿，只有 1000 个）时统计活跃用户，更合适的是？',['位图','集合','BITFIELD'],1,'位图会分配约 500 MB。']]);
