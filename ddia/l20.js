const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=150)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={c:B('协调者','','sig'),a:B('参与者 A','写入完成'),b:B('参与者 B','写入完成'),p:P('① 准备？','sig'),y:P('是 / 是','ok'),log:P('写入日志：commit ← 提交点','sig'),cm:P('② 提交！','ok')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'执行',p:'事务在两个参与者上执行写入，但还没有提交。',set:{c:[0,60],a:[250,0],b:[250,120]}},
 {t:'准备',p:'协调者询问能否提交。参与者持久化所有写入，投“是”后就放弃了中止的权利。',d:3600,set:{c:[0,60],a:[250,0,B('参与者 A','已准备','sig')],b:[250,120,B('参与者 B','已准备','sig')],p:[0,130],y:[120,170]}},
 {t:'提交点',p:'协调者把“提交”决定写入自己的日志：从此决定不可更改。',d:3400,set:{c:[0,60,B('协调者','决定：提交','sig')],a:[250,0,B('参与者 A','已准备','sig')],b:[250,120,B('参与者 B','已准备','sig')],log:[0,130]}},
 {t:'提交',p:'通知所有参与者提交；失败就一直重试，直到成功。',d:3400,set:{c:[0,60,B('协调者','决定：提交','sig')],a:[250,0,B('参与者 A','已提交','ok')],b:[250,120,B('参与者 B','已提交','ok')],cm:[0,130]}}]});
const e2={k:B('输入主题','消息 #57'),pr:B('处理','计算结果'),db:{w:220,h:90,cls:'frame',html:'<i>同一个事务</i><br>写入结果<br>记录位移 = 58'},ok:P('崩溃后从 58 继续：结果与位移总是一致','ok')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'消费',p:'读取一条消息并处理。',set:{k:[0,0],pr:[0,70]}},
 {t:'原子提交',p:'把处理结果和“已处理到哪里”放在同一个事务中提交。',d:3400,set:{k:[0,0],pr:[0,70],db:[200,20]}},
 {t:'故障',p:'要么两者都提交，要么都没有：重启后不会重复处理，也不会漏掉。',d:3400,set:{k:[0,0],pr:[0,70],db:[200,20],ok:[0,140]}}]});
(()=>{const S=[['发送准备之前',['参与者：事务未准备，超时后自行中止 ✓','锁随之释放'],'ok'],['收到所有“是”，写日志之前',['参与者：已准备，等待决定……','协调者恢复：日志中没有提交决定 → 中止','存疑期间锁一直被持有'],'sig'],['写入提交决定之后',['参与者：已准备，等待决定……','协调者恢复：日志中有 commit → 通知提交','存疑期间锁一直被持有'],'sig'],['写入决定后，日志盘损坏',['参与者：已准备，永远等不到决定','需要人工查看并决定提交或回滚（启发式决定，可能破坏原子性）'],'bad']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 S.forEach(([t,r,c])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));p.textContent=r.join('\n');m.className='msg '+c;m.innerHTML=c==='ok'?'还没有人放弃中止的权利，可以安全中止。':c==='sig'?'参与者已投“是”，只能等待协调者：2PC 是阻塞的。':'协调者是单点：日志丢失就无法自动恢复。'});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择协调者崩溃的时刻。'})();
Term(document.getElementById('t4'),[
['SELECT gid, prepared, owner FROM pg_prepared_xacts;','   gid    |           prepared            |  owner\n----------+-------------------------------+----------\n tx-42-p1 | 2026-10-23 10:15:02.31+00     | postgres','长时间存在的预备事务会持有锁，并阻止 VACUUM 清理旧版本：要监控。'],
['SELECT locktype, relation::regclass, mode, granted FROM pg_locks WHERE virtualtransaction LIKE \'-1/%\';',' locktype | relation |       mode       | granted\n----------+----------+------------------+---------\n …        | acct     | RowExclusiveLock | t','预备事务的锁（virtualtransaction 为 -1/…）。'],
['ROLLBACK PREPARED \'tx-42-p1\';','ROLLBACK PREPARED','由协调者（或人工）决定中止。']]);
Quiz(document.getElementById('qs'),[
['2PC 中参与者投“是”意味着？',['已经提交','放弃了中止的权利，被要求时必须能提交','可以随时反悔'],1,''],
['2PC 的提交点在哪里？',['参与者准备完成时','协调者把提交决定写入日志时','所有参与者提交后'],1,''],
['协调者在提交点后崩溃，参与者应该？',['自行提交','自行中止','等待协调者恢复'],2,''],
['数据库内部的分布式事务如何避免协调者单点阻塞？',['不用 2PC','用共识复制协调者状态','使用 XA'],1,''],
['实现精确一次消息处理的常见方法？',['消息处理结果与消费位移原子提交','增加重试','关闭自动提交'],0,'']]);
