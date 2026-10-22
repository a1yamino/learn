const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=120)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={s1:B('分片 1','a – f'),s2:B('分片 2','g – m'),s3:B('分片 3','n – s'),s4:B('分片 4','t – z'),q:P('范围查询 b–d：只访问分片 1','ok'),h1:B('分片 1','哈希 0–63'),h2:B('分片 2','哈希 64–127'),h3:B('分片 3','哈希 128–191'),h4:B('分片 4','哈希 192–255'),q2:P('范围查询 b–d：要访问所有分片','bad')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'按键范围',p:'每个分片负责一个连续的键区间。',set:{s1:[0,0],s2:[130,0],s3:[260,0],s4:[390,0]}},
 {t:'范围查询',p:'键在分片内有序，范围查询只访问相关分片。',d:3000,set:{s1:[0,0,B('分片 1','a – f','ok')],s2:[130,0],s3:[260,0],s4:[390,0],q:[0,70]}},
 {t:'按哈希',p:'先对键哈希再分配：分布均匀。',d:3000,set:{h1:[0,0],h2:[130,0],h3:[260,0],h4:[390,0]}},
 {t:'代价',p:'相邻的键被打散到各个分片，范围查询要访问全部分片。',d:3200,set:{h1:[0,0,B('分片 1','bob','sig')],h2:[130,0,B('分片 2','cat','sig')],h3:[260,0,B('分片 3','bee','sig')],h4:[390,0,B('分片 4','dan','sig')],q2:[0,70]}}]});
const e2={s1:B('分片 1','20%'),s2:B('分片 2','95%','bad'),s3:B('分片 3','20%'),k:P('明星账号的所有请求 → 一个键 → 一个分片','bad'),f:P('加后缀：star_00 … star_99 分散到多个分片','ok')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'热点',p:'同一个键的所有请求都落在同一个分片上，哈希也无济于事。',set:{s1:[0,0],s2:[130,0],s3:[260,0],k:[0,70]}},
 {t:'拆分热点键',p:'对热点键加随机后缀把写入分散；读取时要读回所有后缀再合并，所以只对已知热点这样做。',d:3800,set:{s1:[0,0,B('分片 1','45%','ok')],s2:[130,0,B('分片 2','50%','ok')],s3:[260,0,B('分片 3','40%','ok')],f:[0,70]}}]});
(()=>{const S=[['hash mod N（4→5）',80,'几乎所有键都换了位置。'],['固定 256 个分片（4→5）',20,'只移动新节点接管的整片：最优的 1/5。'],['一致性哈希（4→5，每节点多个虚拟节点）',20,'只影响新节点在环上接管的区间。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 S.forEach(([t,pc,msg])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));p.textContent=`数据总量 10 TB\n需要移动：约 ${pc}% = ${pc/10} TB\n理论最小值：新节点应得的 1/5 = 2 TB`;m.className='msg '+(pc>20?'bad':'ok');m.innerHTML=msg});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择分配方式。'})();
Term(document.getElementById('t4'),[
['CLUSTER KEYSLOT user:1000','(integer) 1649','键 → 槽：CRC16 取模 16384。'],
['CLUSTER SHARDS','1) 1) "slots"\n   2) 1) (integer) 0\n      2) (integer) 5460\n   3) "nodes" …','槽 → 节点：映射表由集群维护，加节点时整槽迁移（只能在集群模式下执行）。']]);
Quiz(document.getElementById('qs'),[
['按键范围分片的主要优点？',['分布均匀','范围查询高效','没有热点'],1,''],
['为什么不应使用 hash mod N？',['哈希太慢','节点数变化时大部分键要移动','不均匀'],1,''],
['以时间戳为分片键（范围）的问题？',['范围查询慢','新写入都落在一个分片，形成热点','无法排序'],1,''],
['Cassandra 主键 (user_id, ts) 中 user_id 的作用？',['分片键，决定数据所在分片','排序列','索引'],0,''],
['对单个热点键的常见对策？',['加随机后缀分散写入','增加副本','改用范围分片'],0,'']]);
