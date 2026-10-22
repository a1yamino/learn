const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=120)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={s1:B('分片 1','CPU 20%'),s2:B('分片 2','CPU 100%','bad'),s3:B('分片 3','CPU 20%'),s4:B('分片 4（新增）','CPU 5%'),k:P('GET live:9527 × 30 万/秒 → 都在分片 2','bad'),n:P('加分片：热 key 仍然只在分片 2','sig')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'热点',p:'一个键只属于一个槽、一个分片。',set:{s1:[0,60],s2:[140,60],s3:[280,60],k:[0,0]}},
 {t:'扩容无效',p:'新增分片只会分走其他槽，热 key 的流量不会被分摊。',d:4000,set:{s1:[0,60],s2:[140,60],s3:[280,60],s4:[420,60],k:[0,0],n:[0,120]}}]});
(()=>{const S=[['不处理',[30,0,0,0],'分片 1 需要承受 30 万/秒，远超能力。'],['读副本（每个分片 2 个副本）',[10,0,0,0],'主+2 副本分摊：每个节点 10 万，刚好打满，且有复制延迟。'],['复制 8 份分布到 4 个分片',[7.5,7.5,7.5,7.5],'每个分片 7.5 万，写入时要更新 8 份。'],['本地缓存 2 秒（50 个应用实例）',[0.0025,0,0,0],'每个实例每 2 秒回源一次：约 25 次/秒，几乎为零。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 S.forEach(([t,a,r])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent=a.map((v,i)=>`分片 ${i+1}: ${'█'.repeat(Math.min(30,Math.round(v)))} ${v} 万/秒`).join('\n');const bad=Math.max(...a)>=10;m.className='msg '+(bad?'bad':'ok');m.innerHTML=r});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择方案。'})();
const e2={k:B('big:h','100 万字段 / 70 MB','bad',160),r:P('HGETALL：一次序列化 200 万个元素 → 主线程阻塞 + 网卡打满','bad'),d:P('DEL：逐个释放 100 万个对象 → 数百毫秒','bad'),u:P('UNLINK：从键空间移除，内存交给后台线程释放','ok'),s:P('HSCAN 0 COUNT 100：每次一小批','ok'),m:P('迁移槽：MIGRATE 整个键一次性序列化传输 → 阻塞','sig')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'读取',p:'一次读取全部元素。',set:{k:[0,0],r:[0,60]}},
 {t:'分批',p:'改用游标分批读取，每次只占用很短的时间。',d:3200,set:{k:[0,0],r:[0,60],s:[0,100]}},
 {t:'删除',p:'同步删除要释放所有元素；UNLINK 把释放交给后台线程。',d:3800,set:{k:[0,0],d:[0,60],u:[0,100]}},
 {t:'迁移',p:'Cluster 扩容时，大 key 必须整体迁移。',d:3400,set:{k:[0,0],m:[0,60]}}]});
Term(document.getElementById('t4'),[
['redis-cli --memkeys','…\nBiggest string found "page:home" has 5242880 bytes\n…','按内存找最大的键。'],
['MEMORY USAGE live:9527:viewers SAMPLES 0','(integer) 98123456','SAMPLES 0 精确计算所有元素（大 key 上也慢）。'],
['CONFIG SET lazyfree-lazy-user-del yes','OK','让 DEL 的行为与 UNLINK 一样。'],
['OBJECT FREQ live:9527','(integer) 255','LFU 计数，接近 255 说明非常热。'],
['OBJECT ENCODING live:9527:viewers','"hashtable"','元素多了以后不再是紧凑编码，每个成员开销更大。']]);
Quiz(document.getElementById('qs'),[
['Cluster 加分片能分摊单个热 key 吗？',['能','不能','只有读能'],1,''],
['处理热读最有效的通常是？',['本地缓存','增大 maxmemory','UNLINK'],0,''],
['删除大 key 应该用？',['DEL','UNLINK','FLUSHALL'],1,''],
['读取百万成员集合的正确方式？',['SMEMBERS','SSCAN 分批','KEYS'],1,''],
['--hotkeys 依赖什么？',['LFU 淘汰策略','AOF','Cluster'],0,'']]);
