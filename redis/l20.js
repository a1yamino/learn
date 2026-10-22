const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=480)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={a:B('SETNX lock 1','崩溃后锁永不释放','bad'),b:B('SET lock 1 NX PX 30000','有过期时间；但谁都能 DEL 它','sig'),c:B('SET lock &lt;uuid&gt; NX PX 30000 + Lua 比较删除','只删除自己的锁；但业务太慢锁会过期','sig'),d:B('+ 看门狗续期','进程停顿时仍可能过期；主从切换可能丢锁','sig'),f:B('+ fencing token','存储拒绝旧持有者的写入：正确性由存储保证','ok')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'只用 SETNX',p:'没有过期时间：持有者崩溃，锁永远不会释放。',set:{a:[0,0]}},
 {t:'加过期',p:'一条 SET 同时设置 NX 和过期时间。',d:3200,set:{a:[0,0],b:[0,54]}},
 {t:'唯一值',p:'值是持有者的唯一 ID，解锁时原子地比较再删除。',d:3400,set:{a:[0,0],b:[0,54],c:[0,108]}},
 {t:'续期',p:'后台定时延长锁的 TTL，直到业务完成。',d:3200,set:{a:[0,0],b:[0,54],c:[0,108],d:[0,162]}},
 {t:'fencing',p:'即使两个客户端都认为自己持有锁，存储也只接受 token 更大的写入。',d:3800,set:{a:[0,0],b:[0,54],c:[0,108],d:[0,162],f:[0,216]}}]});
(()=>{const base=['t=0   客户端 1 加锁成功（token 33）','t=1   客户端 1 开始 GC 停顿 40 秒','t=30  锁过期','t=31  客户端 2 加锁成功（token 34），写入 data = B'],S=[['无保护',['t=41  客户端 1 恢复，以为自己还持有锁，写入 data = A','结果：data = A，覆盖了客户端 2 的写入'],'bad','两个持有者同时写入，数据被破坏。'],['看门狗续期',['（看门狗线程也在 GC 停顿中，没能续期）','t=41  客户端 1 恢复，写入 data = A','结果：data = A，覆盖了客户端 2 的写入'],'bad','续期不能解决进程停顿。'],['写入前再检查一次锁',['t=41  客户端 1 GET lock → 不是自己的值 → 放弃','但如果停顿发生在检查之后、写入之前，问题依旧'],'sig','缩小了窗口，但“检查再写入”本身不是原子的。'],['fencing token',['t=41  客户端 1 写入 data = A，带 token 33','存储：已见过 token 34 → 拒绝','结果：data = B'],'ok','由存储拒绝旧的写入。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 S.forEach(([t,r,c,x])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));p.textContent=base.concat(r).join('\n');m.className='msg '+c;m.innerHTML=x});q.appendChild(b)});
 p.textContent=base.join('\n');m.className='msg';m.innerHTML='选择保护手段。'})();
const e2={m:{w:140,h:44,cls:'blk',html:'主库<br><span style="font-size:11px;opacity:.7">lock = A</span>'},r:{w:140,h:44,cls:'blk',html:'副本<br><span style="font-size:11px;opacity:.7">（尚未复制）</span>'},a:P('客户端 A：加锁成功','ok'),x:P('主库宕机，副本被提升','bad'),b:P('客户端 B：在新主库加锁也成功 → 两个持有者','bad')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'加锁',p:'A 在主库加锁成功，复制还没发生。',set:{m:[0,0],r:[200,0],a:[0,70]}},
 {t:'切换',p:'主库宕机，Sentinel 提升副本。锁不在新主库上。',d:3600,set:{m:[0,0,{cls:'blk bad',html:'主库<br><span style="font-size:11px;opacity:.7">宕机</span>'}],r:[200,0,{cls:'blk ok',html:'新主库<br><span style="font-size:11px;opacity:.7">没有 lock</span>'}],a:[0,70],x:[0,110]}},
 {t:'冲突',p:'B 加锁成功。WAIT 可以降低概率；Redlock 用多个独立主库取多数；真正的正确性仍需 fencing。',d:4200,set:{m:[0,0,{cls:'blk bad',html:'主库<br><span style="font-size:11px;opacity:.7">宕机</span>'}],r:[200,0,{cls:'blk ok',html:'新主库<br><span style="font-size:11px;opacity:.7">lock = B</span>'}],a:[0,70],b:[0,110]}}]});
Term(document.getElementById('t4'),[
['SET lock:k 7f3c NX PX 30000','OK','加锁。'],
['EVAL "if redis.call(\'GET\',KEYS[1])==ARGV[1] then return redis.call(\'DEL\',KEYS[1]) end return 0" 1 lock:k 7f3c','(integer) 1','解锁。'],
['HINCRBY rlock:k 7f3c:t1 1\nPEXPIRE rlock:k 30000','(integer) 2\n(integer) 1','可重入锁：哈希记录持有者与重入次数（Redisson 的做法，需放进同一个脚本）。'],
['INCR lock:k:token','(integer) 35','仅演示编号递增；令牌必须与授锁绑定且跨故障不回退，普通 Redis INCR 不提供这个保证。'],
['WAIT 1 100','(integer) 1','加锁后等待副本确认，减少切换丢锁的概率。']]);
Quiz(document.getElementById('qs'),[
['为什么不能 SETNX 后再 EXPIRE？',['太慢','中间崩溃会留下永不过期的锁','EXPIRE 不支持'],1,''],
['解锁为什么要比较值？',['避免删除别人的锁','提高性能','Cluster 要求'],0,''],
['看门狗能否防止 GC 停顿导致的问题？',['能','不能','只在 Cluster 中能'],1,''],
['保证正确性的关键补充？',['更长的 TTL','fencing token 或数据库约束','更多副本'],1,''],
['Redis 锁最适合的场景？',['资金扣减','避免重复计算等效率场景','选主'],1,'']]);
