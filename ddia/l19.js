const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=150)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={a:B('alice','值班','ok'),b:B('bob','值班','ok'),t1:P('T1：值班人数 = 2 ≥ 2 → 可以请假','sig'),t2:P('T2：值班人数 = 2 ≥ 2 → 可以请假','sig'),w1:P('T1：alice 下班，提交','sig'),w2:P('T2：bob 下班，提交','sig'),x:P('没人值班！','bad')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'初始',p:'两名医生值班。规则：至少一人值班。',set:{a:[0,0],b:[180,0]}},
 {t:'各自检查',p:'两个事务都在快照上读到 2 人值班，检查都通过。',d:3400,set:{a:[0,0],b:[180,0],t1:[0,70],t2:[0,110]}},
 {t:'各自写入',p:'T1 只改 alice 的行，T2 只改 bob 的行：没有写冲突。',d:3400,set:{a:[0,0,B('alice','下班')],b:[180,0,B('bob','下班')],w1:[0,70],w2:[0,110]}},
 {t:'不变式被破坏',p:'两者都提交后，没有医生值班。这就是写偏斜。',d:3200,set:{a:[0,0,B('alice','下班','bad')],b:[180,0,B('bob','下班','bad')],x:[0,70]}}]});
const e2={t1:B('T1','读 on_call（快照）'),t2:B('T2','读 on_call（快照）'),r:P('SSI 记录：T1、T2 都读了 on_call 的这些行','sig'),c1:P('T1 写 alice 并提交 → T2 读到的前提已过时','sig'),ab:P('T2 提交时被检测到 → 中止，重试','bad')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'记录读取',p:'事务照常在快照上运行，数据库记下它们读了什么。',set:{t1:[0,0],t2:[200,0],r:[0,70]}},
 {t:'过时的前提',p:'T1 的写入影响了 T2 已经读过的数据。',d:3400,set:{t1:[0,0,B('T1','已提交','ok')],t2:[200,0],r:[0,70],c1:[0,110]}},
 {t:'中止',p:'T2 提交时，数据库发现它的决定基于过时的读取，于是中止它。',d:3400,set:{t1:[0,0,B('T1','已提交','ok')],t2:[200,0,B('T2','中止','bad')],c1:[0,110],ab:[0,150]}}]});
(()=>{const S=[['可重复读（快照隔离）',['T1 读：2 人值班        T2 读：2 人值班','T1 写 alice            T2 写 bob','T1 提交 ✓              T2 提交 ✓','结果：0 人值班 ✗'],'bad','快照隔离不能防止写偏斜。'],['两阶段锁（2PL）',['T1 读：对 on_call 行加共享锁','T2 读：同样加共享锁','T1 写 alice：需要排他锁，等待 T2 的共享锁','T2 写 bob：需要排他锁，等待 T1 → 死锁','数据库中止其中一个，另一个完成：1 人值班 ✓'],'ok','正确，但读写互相阻塞，吞吐和尾延迟都差。'],['可串行化快照隔离（SSI）',['T1 读：2 人值班        T2 读：2 人值班（不加锁）','T1 写 alice，提交 ✓','T2 写 bob，提交时检测到读写依赖 → 中止','T2 重试：读到 1 人 → 拒绝请假 ✓'],'ok','依赖检测不额外阻塞；普通写锁仍可能等待，冲突时中止并重试。'],['真正的串行执行',['T1 整体执行完：alice 下班','T2 再执行：读到 1 人 → 拒绝','结果：1 人值班 ✓'],'ok','没有并发，自然正确；要求事务短小、以存储过程提交。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 S.forEach(([t,r,c,msg])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));p.textContent=r.join('\n');m.className='msg '+c;m.innerHTML=msg});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择一种隔离方式。'})();
Term(document.getElementById('t4'),[
['EVAL "if tonumber(redis.call(\'GET\', KEYS[1])) >= 2 then return redis.call(\'DECR\', KEYS[1]) else return -1 end" 1 on_call','(integer) 1','检查与写入在一个脚本中原子执行：Redis 单线程逐个执行脚本，不会交错（先 SET on_call 2）。'],
['EVAL "…同上…" 1 on_call','(integer) -1','第二次请求读到 1，拒绝。']]);
Quiz(document.getElementById('qs'),[
['写偏斜的特征是？',['两个事务写同一行','基于读取结果决定写入，而写入使读取的前提失效','读到未提交数据'],1,''],
['快照隔离能防止写偏斜吗？',['能','不能','只在单机上能'],1,''],
['2PL 中读者与写者？',['互不阻塞','互相阻塞','只有写者阻塞写者'],1,''],
['SSI 的策略是？',['悲观加锁','乐观执行，提交时检测冲突并中止','串行执行'],1,''],
['真正的串行执行要求事务？',['短小，以存储过程一次性提交','可以等待用户输入','跨越多个分片'],0,'']]);
